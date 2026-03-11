import { spawn } from 'child_process';
import { Session } from '@06-entities/sessions';
import { redisService } from '@07-shared/lib/redis';
import { SocketService } from '@07-shared/lib/socket';
import { config } from '@07-shared/config/config';
import { AppError } from '@07-shared/errors'; // 전역 에러 클래스 사용

export const startMeasurementService = async (sessionId: string) => {
  // 1. 세션 조회 및 검증함
  const session = await Session.findById(sessionId);
  if (!session) {
    throw new AppError('요청하신 세션을 찾을 수 없습니다.', 404);
  }

  // 2. 상태 전이 비즈니스 규칙 검사함
  if (!session.canTransitionTo('MEASURING')) {
    throw new AppError(
      `현재 ${session.status} 상태에서는 측정을 시작할 수 없습니다.`,
      400
    );
  }

  // 3. subjectIndex null/range 검사 수행함 (Bug 3 guard)
  if (session.subjectIndex === null || session.subjectIndex <= 0) {
    throw new AppError('세션에 유효한 subjectIndex가 없습니다.', 400);
  }

  // 4. DB 업데이트함
  session.status = 'MEASURING';
  session.measuredAt = new Date();
  await session.save();

  // 5. Redis 구독자 연결 (실패 시 상태 롤백 수행함)
  const subscriber = redisService.client.duplicate();
  try {
    await subscriber.connect();
  } catch (err) {
    // Redis 연결 실패 시 세션 상태를 CANCELLED로 롤백함
    session.status = 'CANCELLED';
    await session.save();
    throw err;
  }

  const channel = `mind-signal:${session.groupId}:subject:${session.subjectIndex}`;
  await subscriber.subscribe(channel, (message: string) => {
    try {
      const data = JSON.parse(message);
      SocketService.emitLiveEvent('eeg-live', { sessionId: session._id, data });
    } catch (err) {
      console.error('Redis JSON 파싱 에러:', err);
    }
  });

  // 6. 외부 Python 엔진 실행함 (conda 환경 Python 바이너리 사용함)
  const enginePath = config.dataEngine.path;
  const pythonProcess = spawn(
    config.dataEngine.pythonBin,
    ['-m', 'core.main', session.groupId, String(session.subjectIndex)],
    { cwd: enginePath }
  );

  // 7. Python 프로세스 에러 핸들러 추가함 (실행 파일 없음 등 처리함)
  pythonProcess.on('error', async (err) => {
    console.error('Python 프로세스 실행 에러:', err);
    try {
      await subscriber.unsubscribe(channel);
      await subscriber.quit();
    } catch (cleanupErr) {
      console.error('Redis 정리 중 에러:', cleanupErr);
    }
  });

  // 8. Python 종료 시 상태 업데이트 및 Redis 정리함 (try/finally로 누수 방지함)
  pythonProcess.on('close', async (code) => {
    console.log(`Python 프로세스 종료 (exit code: ${code})`);
    // 종료 코드 기반으로 최종 세션 상태 결정함
    session.status = code === 0 ? 'COMPLETED' : 'CANCELLED';
    try {
      await session.save();
    } finally {
      // session.save() 실패 여부와 무관하게 Redis 구독 반드시 정리함
      try {
        await subscriber.unsubscribe(channel);
        await subscriber.quit();
      } catch (cleanupErr) {
        console.error('Redis 정리 중 에러:', cleanupErr);
      }
    }
  });

  return { measuredAt: session.measuredAt };
};
