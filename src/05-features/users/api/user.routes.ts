import { Router } from 'express';
import userController from '@05-features/users/api/user.controller';
import { authenticate } from '@07-shared/middlewares';

const router = Router();

router.get('/me', authenticate, userController.getUser);

export default router;
