import { Router } from 'express';
import authController from './auth.controller';
import { validate } from '@07-shared/middlewares';
import { signUpSchema, loginSchema } from '@05-features/auth/dto/auth.dto';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Auth
 * description: 인증 및 회원가입 관리
 */

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: 로그인
 *     description: 사용자 이메일과 비밀번호를 받아 인증을 진행하고 JWT 토큰을 반환합니다.
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: 로그인 성공
 *       401:
 *         description: 인증 실패 (비밀번호 불일치 등)
 */

router.post('/login', validate(loginSchema), authController.loginWithEmail);

/**
 * @openapi
 * /api/auth/signup:
 *   post:
 *    summary: 회원가입
 *    description: 새로운 사용자를 등록합니다.
 *    tags: [Auth]
 *    responses:
 *      201:
 *        description: 회원가입 완료
 *      400:
 *        description: 잘못된 요청 데이터
 */

router.post('/signup', validate(signUpSchema), authController.register);

export default router;
