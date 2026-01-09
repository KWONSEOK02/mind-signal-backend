import { Session } from '@06-entities/sessions';
import { Types } from 'mongoose';

/**
 * Phase 1.5: 모바일 기기 페어링 프로세스
 * 1. 토큰 유효성 및 만료 확인
 * 2. 원자적 상태 변경 (CREATED -> PAIRED)
 * 3. 사용자 ID 바인딩
 */
export const pairDeviceProcess = async (
  pairingToken: string,
  userId: string
) => {
  // 0. userId 유효성 검사 (추가 권장)
  if (!Types.ObjectId.isValid(userId)) {
    throw new Error('INVALID_USER_ID_FORMAT');
  }

  // 1. 세션 조회
  const session = await Session.findOne({ pairingToken });
  if (!session) {
    throw new Error('INVALID_TOKEN');
  }

  // 2. 만료 및 상태 전이 가능 여부 체크 (Note A-1, A-2)
  if (session.isExpired()) {
    session.status = 'EXPIRED';
    await session.save();
    throw new Error('TOKEN_EXPIRED');
  }

  if (!session.canTransitionTo('PAIRED')) {
    throw new Error(`CANNOT_PAIR_FROM_STATUS_${session.status}`);
  }

  // 3. 페어링 정보 업데이트 (Note A-3)
  session.status = 'PAIRED';
  session.userId = new Types.ObjectId(userId);
  session.pairedAt = new Date();

  return await session.save();
};
