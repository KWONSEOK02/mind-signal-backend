import { Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { config } from '@07-shared/config/config';
import { AuthedRequest } from '@07-shared/types';

/**
 * 선택적 인증 미들웨어 — 토큰 있으면 decode, 없으면 req.user = undefined로 통과함
 */
export const optionalAuthenticate = (
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next();
  }

  try {
    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(
      token,
      config.jwtSecret.secret as string
    ) as JwtPayload;

    (req as any).user = { id: payload.id };
  } catch {
    // 토큰이 유효하지 않아도 비인증 상태로 통과함
  }

  next();
};
