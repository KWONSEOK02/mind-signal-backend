import { Router } from 'express';
import userController from './user.controller';
import { authenticate } from '@07-shared/middlewares';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Users
 *     description: 사용자 정보 관리
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
 *         description: 사용자 정보 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "success" }
 *                 user:
 *                   type: object
 *                   properties:
 *                     email: { type: string, example: "testuser@gmail.com" }
 *                     name: { type: string, example: "김뇌파" }
 *                     brainType: { type: string, example: "PENDING" }
 *                     loginType:
 *                       type: array
 *                       items:
 *                         type: string
 *                         enum: [local, google, kakao]
 *                       example: ["local"]
 *                     membershipLevel: { type: string, example: "BASIC" }
 *                     providerId: { type: string, nullable: true, example: null }
 *                     id: { type: string, example: "695a003df33270433494b87e" }
 *       401:
 *         description: 인증 실패 (토큰 문제)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "fail" }
 *                 message: { type: string, example: "인증 정보가 유효하지 않습니다." }
 *       404:
 *         description: 사용자를 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "fail" }
 *                 message: { type: string, example: "사용자를 찾을 수 없습니다." }
 */

router.get('/me', authenticate, userController.getUser);

export default router;
