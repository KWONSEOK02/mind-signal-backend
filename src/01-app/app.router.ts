import { Router } from 'express';
import { userApi } from '@05-features/users';
import { authApi } from '@05-features/auth';
const router = Router();

router.use('/user', userApi);
router.use('/auth', authApi);

export default router;
