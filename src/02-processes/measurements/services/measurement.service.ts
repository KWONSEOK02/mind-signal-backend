import { spawn } from 'child_process';
import { Session } from '@06-entities/sessions';
import { redisService } from '@07-shared/lib/redis';
import { SocketService } from '@07-shared/lib/socket';
import { config } from '@07-shared/config/config';
import { AppError } from '@07-shared/errors'; // 전역 에러 클래스 사용

export const startMeasurementService = async (sessionId: string) => {
  // 1. 세션 조회 및 검증 (오류 처리를 서비스에서 전담)
  const session = await Session.findById(sessionId);
  if (!session) {
    throw new AppError('요청하신 세션을 찾을 수 없습니다.', 404);
  }

  // 2. 상태 전이 비즈니스 규칙 검사
  if (!session.canTransitionTo('MEASURING')) {
    throw new AppError(
      `현재 ${session.status} 상태에서는 측정을 시작할 수 없습니다.`,
      400
    );
  }

  // 3. DB 업데이트
  session.status = 'MEASURING';
  session.measuredAt = new Date();
  await session.save();

  // 4. Redis 브릿징 로직
  const subscriber = redisService.client.duplicate();
  await subscriber.connect();
  const channel = `mind-signal:${session.groupId}:subject:${session.subjectIndex}`;
  await subscriber.subscribe(channel, (message: string) => {
    try {
      const data = JSON.parse(message);
      SocketService.emitLiveEvent('eeg-live', { sessionId: session._id, data });
    } catch (err) {
      console.error('Redis JSON 파싱 에러:', err);
    }
  });

  // 5. 외부 엔진 실행
  const enginePath = config.dataEngine.path;
  const pythonProcess = spawn(
    'python',
    ['-m', 'core.main', session.groupId, String(session.subjectIndex)],
    { cwd: enginePath }
  );

  pythonProcess.on('close', async (_code) => {
    session.status = 'COMPLETED';
    await session.save();
    await subscriber.unsubscribe(channel);
    await subscriber.quit();
  });

  return { measuredAt: session.measuredAt };
};
