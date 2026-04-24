import jwt from 'jsonwebtoken';
import { Session } from '@06-entities/sessions';
import { AppError } from '@07-shared/errors';
import { config } from '@07-shared/config/config';

/**
 * [Service] operator invite 토큰 발급 프로세스 수행함.
 *
 * groupId에 해당하는 세션 목록 조회 후 experimentMode를 DUAL_2PC로 갱신하고,
 * 5분 유효 JWT invite 토큰 반환함.
 *
 * @param groupId - 초대 대상 그룹 식별자 (string 필드 — ObjectId 아님)
 * @returns { token, expiresAt } — JWT 토큰 및 만료 타임스탬프(ms)
 * @throws AppError 404 — 해당 groupId 세션 없음
 */
export async function createOperatorInviteToken(groupId: string): Promise<{
  token: string;
  expiresAt: number;
}> {
  // v7 H-PREP-2: groupId는 string 필드 — findOne 대신 find 사용
  const sessions = await Session.find({ groupId });
  if (sessions.length === 0) {
    throw new AppError('세션 없음', 404);
  }

  // v7 H-PREP-3: groupId에 두 Session 문서 존재 → updateMany로 멱등 처리
  await Session.updateMany({ groupId }, { experimentMode: 'DUAL_2PC' });

  // JWT payload: { groupId, type: 'operator_invite' }, expiresIn: '5m'
  const expiresAt = Date.now() + 5 * 60 * 1000;
  const token = jwt.sign(
    { groupId, type: 'operator_invite' },
    config.jwtSecret.secret as string,
    { expiresIn: '5m' }
  );

  return { token, expiresAt };
}
