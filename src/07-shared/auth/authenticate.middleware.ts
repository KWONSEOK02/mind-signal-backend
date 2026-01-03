import { Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import config from '@07-shared/config/config';
import AppError from '@07-shared/errors/app.error';
import { AuthedRequest } from '@07-shared/auth';

export const authenticate = (
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError('인증이 필요합니다.', 401));
  }

  try {
    const token = authHeader.split(' ')[1];
    // 정답: 'uri'가 아닌 'secret'을 사용하고 string으로 캐스팅
    const payload = jwt.verify(
      token,
      config.jwt.secret as string
    ) as JwtPayload;

    req.userId = payload.id;
    next();
  } catch {
    next(new AppError('유효하지 않은 토큰입니다.', 401));
  }
};
