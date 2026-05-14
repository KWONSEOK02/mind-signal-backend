import { Response, NextFunction } from 'express';
import { config } from '@07-shared/config/config';
import { AppError } from '@07-shared/errors';
import { AuthedRequest } from '@07-shared/types';
import User from '@06-entities/users/model/user.schema';

/**
 * 관리자 권한 검증 미들웨어 — authenticate 이후에 chain됨.
 *
 * @param req - AuthedRequest (req.user.id JWT payload 주입 후)
 * @param _res - 응답 객체 미사용
 * @param next - 다음 미들웨어 호출 함수
 * @throws AppError 401 — req.user.id 누락 또는 DB stale
 * @throws AppError 403 — user.email이 ADMIN_EMAILS 미포함
 */
export const requireAdmin = async (
  req: AuthedRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.id) {
      return next(new AppError('인증이 필요합니다.', 401));
    }
    // projection {email:1}로 PII 최소화 + lean()으로 hydrated overhead 제거함
    const user = await User.findById(req.user.id, { email: 1 }).lean();
    if (!user) {
      return next(new AppError('사용자를 찾을 수 없습니다.', 401));
    }
    if (!config.adminEmails.includes(user.email)) {
      return next(new AppError('관리자 권한이 필요합니다.', 403));
    }
    next();
  } catch (err) {
    next(err);
  }
};
