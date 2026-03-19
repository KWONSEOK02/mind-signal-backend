import { Request, Response, NextFunction } from 'express';
import authService from '@05-features/auth/services/auth.service';

const authController = {
  register: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user, token } = await authService.register(req.body);
      return res.status(201).json({ status: 'success', user, token });
    } catch (error) {
      return next(error);
    }
  },

  loginWithEmail: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.loginWithEmail(req.body);
      return res.status(200).json({ status: 'success', ...result });
    } catch (error) {
      return next(error);
    }
  },

  // 소셜 로그인 처리
  socialLogin: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { provider } = req.params;
      const { code, codeVerifier, redirectUri } = req.body;
      const { user, token } = await authService.socialLogin(
        provider,
        code,
        codeVerifier,
        redirectUri
      );
      return res.status(200).json({ status: 'success', token, data: { user } });
    } catch (error) {
      return next(error);
    }
  },

  // Access Token 직접 수신으로 소셜 로그인 처리함
  socialLoginWithToken: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { provider } = req.params;
      const { accessToken } = req.body;
      const { user, token } = await authService.socialLoginWithToken(
        provider,
        accessToken
      );
      return res.status(200).json({ status: 'success', token, data: { user } });
    } catch (error) {
      return next(error);
    }
  },
};

export default authController;
