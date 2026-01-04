import { Router } from 'express';
import authController from '@05-features/auth/api/auth.controller';
import { validate } from '@07-shared/middlewares';
import { signUpSchema, loginSchema } from '@05-features/auth/dto/auth.dto';

const router = Router();

router.post('/login', validate(loginSchema), authController.loginWithEmail);
router.post('/signup', validate(signUpSchema), authController.register);

export default router;
