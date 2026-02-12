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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email: { type: string,  example: "test@gmail.com"}
 *               password: { type: string, example: "password1234" }
 *     responses:
 *       200:
 *         description: 로그인 성공
 *       401:
 *         description: 인증 실패 (가입 안한 사용자 또는 아이디 또는 비밀번호 불일치 등)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "fail" }
 *                 message: { type: string, example: 아이디 또는 비밀번호가 일치하지 않습니다. }
 */

router.post('/login', validate(loginSchema), authController.loginWithEmail);

/**
 * @openapi
 * /api/auth/signup:
 *   post:
 *     summary: 회원가입
 *     description: 새로운 사용자를 등록합니다.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - passwordConfirm
 *               - name
 *             properties:
 *               email: { type: string,  example: "test@gmail.com"}
 *               password: { type: string, example: "password1234" }
 *               passwordConfirm: {type: string,  example: "password1234"}
 *               name: { type: string, example: "김뇌파" }
 *               loginType: {type: string, example: "local"}
 *     responses:
 *       201:
 *         description: 회원가입 완료 및 토큰 발급 성공
 *       400:
 *         description: 필수 파라미터 누락 또는 유효성 검사 실패
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "fail" }
 *                 message: { type: string, example: "유효한 이메일을 입력하세요" }
 *       409:
 *         description: 이메일 중복 가입 오류 메세지
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "fail" }
 *                 message: { type: string, example: "이미 가입된 이메일입니다" }
 */

router.post('/signup', validate(signUpSchema), authController.register);

export default router;
