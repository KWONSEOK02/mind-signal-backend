import { Router } from 'express';
import { userApi } from '@05-features/users';
import { authApi } from '@05-features/auth';
import { sessionApi } from '@05-features/sessions';
import { surveyApi } from '@05-features/surveys';
import { measurementApi } from '@02-processes/measurements';

const router = Router();

router.use('/user', userApi);
router.use('/auth', authApi);
router.use('/sessions', sessionApi);
router.use('/surveys', surveyApi);
router.use('/measurements', measurementApi);

export default router;
