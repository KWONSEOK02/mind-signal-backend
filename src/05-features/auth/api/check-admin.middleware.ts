import { Response, NextFunction } from 'express';
import { userRepository } from '@06-entities/users';
import { AppError } from '@07-shared/errors';
import { AuthedRequest } from '@07-shared/middlewares';

export const checkAdmin = async (
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) return next(new AppError('인증 정보가 없습니다.', 401));

    const user = await userRepository.findById(req.userId);
    // 정답: ERD 명세에 따라 'membershipLevel' 필드 사용
    if (!user || user.membershipLevel !== 'ADMIN') {
      return next(new AppError('관리자 권한이 없습니다.', 403));
    }
    next();
  } catch (err) {
    next(err);
  }
};
