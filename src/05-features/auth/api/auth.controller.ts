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
};

export default authController;
