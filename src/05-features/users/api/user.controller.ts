import { Request, Response, NextFunction } from 'express';
import userService from '@05-features/users/services/user.service';
import { AppError } from '@07-shared/errors';

const userController = {
  getUser: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // authenticate 미들웨어에서 넣어준 userId를 사용합니다.
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new AppError('인증 정보가 유효하지 않습니다.', 401);
      }
      const user = await userService.getUser(userId!);
      return res.status(200).json({ status: 'success', user });
    } catch (err) {
      return next(err);
    }
  },
};

export default userController;
