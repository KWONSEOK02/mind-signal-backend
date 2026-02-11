import { Router } from 'express';
import userController from './user.controller';
import { authenticate } from '@07-shared/middlewares';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Users
 * description: 사용자 정보 관리
 */

/**
 * @openapi
 * /api/user/me:
 *   get:
 *     summary: 내 정보 조회
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 사용자 정보 반환
 */

router.get('/me', authenticate, userController.getUser);

export default router;
