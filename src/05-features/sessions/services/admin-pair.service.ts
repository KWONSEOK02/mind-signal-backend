import { AppError } from '@07-shared/errors';
import User from '@06-entities/users/model/user.schema';
import { pairDeviceProcess } from './pairing.service';

/**
 * 관리자가 사용자 email로 강제 페어링 처리함.
 *
 * 기존 pairDeviceProcess 재사용으로 pairing listener fire + DUAL_2PC trigger
 * audit log (J phase) 자동 정합 유지.
 *
 * @param pairingToken - 세션 페어링 토큰
 * @param targetEmail - 페어링 대상 user의 email (normalize 후 lookup함)
 * @param adminId - 호출자 admin user의 _id (audit log 박제용)
 * @returns 페어링 완료된 Session document
 * @throws AppError 404 — target email DB 미존재
 * @throws AppError - pairDeviceProcess 기존 throw 전파 (401/400 등)
 */
export const adminPairDeviceProcess = async (
  pairingToken: string,
  targetEmail: string,
  adminId: string
) => {
  const normalized = targetEmail.trim().toLowerCase();
  const targetUser = await User.findOne(
    { email: normalized },
    { _id: 1 }
  ).lean();
  if (!targetUser) {
    console.log(
      `[admin-force-pair] outcome=failure reason=target_user_not_found ` +
        `adminId=${adminId} targetEmail=${normalized}`
    );
    throw new AppError('대상 사용자를 찾을 수 없습니다.', 404);
  }

  // lean() 도 ObjectId 반환함 — toString() 안전
  const targetUserId = targetUser._id.toString();
  const session = await pairDeviceProcess(pairingToken, targetUserId);

  console.log(
    `[admin-force-pair] outcome=success adminId=${adminId} ` +
      `targetUserId=${targetUserId} ` +
      `isSelf=${adminId === targetUserId} ` +
      `sessionId=${session._id} groupId=${session.groupId} ` +
      `subjectIndex=${session.subjectIndex}`
  );
  return session;
};
