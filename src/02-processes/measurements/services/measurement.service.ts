import { Session } from '@06-entities/sessions';
import { redisService } from '@07-shared/lib/redis';
import { SocketService } from '@07-shared/lib/socket';
import { AppError } from '@07-shared/errors';
import { engineProxyService } from '@02-processes/engine/services/engine-proxy.service';
import { RedisClientType } from 'redis';

/** Redis 구독자 레지스트리 — 키: `${groupId}:${subjectIndex}` */
const subscriberRegistry = new Map<string, RedisClientType>();

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

  // 구독자 레지스트리에 등록함
  const registryKey = `${session.groupId}:${session.subjectIndex}`;
  subscriberRegistry.set(registryKey, subscriber as unknown as RedisClientType);

  const channel = `mind-signal:${session.groupId}:subject:${session.subjectIndex}`;
  await subscriber.subscribe(channel, (message: string) => {
    try {
      const parsed = JSON.parse(message);
      // Python 엔진 페이로드에서 metrics 필드만 추출하여 전달함
      // 전체 구조: { type, groupId, subjectIndex, waves, metrics, time }
      // 프론트엔드 EmotivMetrics 규격: { engagement, interest, excitement, stress, relaxation, focus }
      const data = parsed.metrics ?? parsed;
      SocketService.emitLiveEvent('eeg-live', { sessionId: session._id, data });
    } catch (err) {
      console.error('Redis JSON 파싱 에러:', err);
    }
  });

  // 6. 엔진 프록시를 통해 EEG 스트리밍 시작 요청함 (로컬 FastAPI → core.main spawn)
  try {
    const result = await engineProxyService.streamStart(
      session.groupId,
      session.subjectIndex
    );
    console.log(`EEG 스트리밍 시작됨: ${JSON.stringify(result)}`);
  } catch (err) {
    console.error('EEG 스트리밍 시작 실패:', err);
    session.status = 'CANCELLED';
    await session.save();
    SocketService.emitLiveEvent('measurement-complete', {
      sessionId: session._id,
      status: session.status,
    });
    try {
      await subscriber.unsubscribe(channel);
      await subscriber.quit();
    } catch (cleanupErr) {
      console.error('Redis 정리 중 에러:', cleanupErr);
    }
    throw err;
  }

  return { measuredAt: session.measuredAt };
};

/**
 * 측정 종료 후 세션 COMPLETED 전이 + Redis 구독 해제 수행함
 * 두 subject 모두 COMPLETED 시 포스트-측정 오케스트레이션 트리거함
 */
export const stopMeasurementService = async (
  groupId: string,
  subjectIndex: number,
  stopReason: 'Natural' | 'ManualEarly' | 'HeadsetLost' | 'ProcessError' = 'Natural'
) => {
  const session = await Session.findOne({ groupId, subjectIndex });
  if (!session) {
    throw new AppError('세션을 찾을 수 없습니다.', 404);
  }

  if (!session.canTransitionTo('COMPLETED')) {
    throw new AppError(
      `현재 ${session.status} 상태에서는 측정을 완료할 수 없습니다.`,
      400
    );
  }

  // 세션 상태 COMPLETED 전이 + stopReason + measuredDuration 기록함
  session.status = 'COMPLETED';
  session.stopReason = stopReason;
  if (session.measuredAt) {
    session.measuredDurationSeconds = Math.round(
      (Date.now() - session.measuredAt.getTime()) / 1000
    );
  }
  await session.save();

  // Redis 구독자 정리함
  const registryKey = `${groupId}:${subjectIndex}`;
  const subscriber = subscriberRegistry.get(registryKey);
  if (subscriber) {
    try {
      const channel = `mind-signal:${groupId}:subject:${subjectIndex}`;
      await subscriber.unsubscribe(channel);
      await subscriber.quit();
    } catch (err) {
      console.error('Redis 구독 해제 중 에러:', err);
    }
    subscriberRegistry.delete(registryKey);
  }

  // Socket.io 측정 완료 이벤트 발행함
  SocketService.emitLiveEvent('measurement-complete', {
    sessionId: session._id,
    groupId,
    subjectIndex,
    status: 'COMPLETED',
    stopReason,
  });

  // 두 subject 모두 COMPLETED인지 확인함
  const allSessions = await Session.find({ groupId });
  const allCompleted = allSessions.every((s) => s.status === 'COMPLETED');

  return { allCompleted };
};
