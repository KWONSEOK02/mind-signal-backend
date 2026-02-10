import { Request, Response, NextFunction } from 'express';
import userService from '@05-features/users/services/user.service';

const userController = {
  getUser: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // authenticate 미들웨어에서 넣어준 userId를 사용합니다.
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new Error('인증 정보에서 사용자 ID를 찾을 수 없습니다.');
      }
      const user = await userService.getUser(userId!);
      return res.status(200).json({ status: 'success', user });
    } catch (err) {
      return next(err);
    }
  },
};

export default userController;
