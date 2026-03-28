import { Router } from 'express';
import authController from './auth.controller';
import { validate, validateParams } from '@07-shared/middlewares';
import { signUpSchema, loginSchema } from '@05-features/auth/dto/auth.dto';
import {
  socialLoginSchema,
  socialProviderSchema,
  socialTokenSchema,
} from '@05-features/auth/dto/social-auth.dto';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Auth
 *     description: 인증 및 회원가입 관리
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
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "test@gmail.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "password1234"
 *     responses:
 *       200:
 *         description: 로그인 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "success" }
 *                 user:
 *                   type: object
 *                   properties:
 *                     id: { type: string, example: "695a003df33270433494b87e" }
 *                     email: { type: string, example: "test@gmail.com" }
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
 *                 token: { type: string, example: "eyJhbGciOiJIUzI1NiIsInR..." }
 *       400:
 *         description: 유효성 검사 실패
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "fail" }
 *                 message: { type: string, example: "유효한 이메일을 입력하세요." }
 *       401:
 *         description: 인증 실패 (아이디 또는 비밀번호 불일치)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "fail" }
 *                 message: { type: string, example: "아이디 또는 비밀번호가 일치하지 않습니다." }
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
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "test@gmail.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "password1234"
 *               passwordConfirm:
 *                 type: string
 *                 minLength: 1
 *                 example: "password1234"
 *               name:
 *                 type: string
 *                 example: "김뇌파"
 *               loginType:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [local, google, kakao]
 *                 example: ["local"]
 *     responses:
 *       201:
 *         description: 회원가입 완료 및 토큰 발급 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "success" }
 *                 user:
 *                   type: object
 *                   properties:
 *                     id: { type: string, example: "695a003df33270433494b87e" }
 *                     email: { type: string, example: "test@gmail.com" }
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
 *                 token: { type: string, example: "eyJhbGciOiJIUzI1NiIsInR..." }
 *       400:
 *         description: 유효성 검사 실패
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "fail" }
 *                 message: { type: string, example: "유효한 이메일을 입력하세요." }
 *       409:
 *         description: 이메일 중복
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "fail" }
 *                 message: { type: string, example: "이미 가입된 이메일입니다" }
 */

router.post('/signup', validate(signUpSchema), authController.register);

/**
 * @openapi
 * /api/auth/social/{provider}:
 *   post:
 *     summary: 소셜 로그인 (인증 코드 + PKCE 방식)
 *     description: |
 *       소셜 공급자의 인증 코드와 PKCE code_verifier를 사용하여
 *       로그인 또는 신규 가입을 처리하고 JWT를 반환합니다.
 *     tags: [Auth]
 *     parameters:
 *       - name: provider
 *         in: path
 *         required: true
 *         description: 소셜 로그인 공급자
 *         schema:
 *           type: string
 *           enum: [google, kakao]
 *           example: "google"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - codeVerifier
 *             properties:
 *               code: { type: string, minLength: 1, example: "4/0AX4XfWh..." }
 *               codeVerifier: { type: string, minLength: 43, example: "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk" }
 *               redirectUri: { type: string, format: uri, example: "https://example.com/callback" }
 *     responses:
 *       200:
 *         description: 소셜 로그인 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "success" }
 *                 token: { type: string, example: "eyJhbGciOiJIUzI1NiIsInR..." }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id: { type: string, example: "695a003df33270433494b87e" }
 *                         email: { type: string, example: "user@gmail.com" }
 *                         name: { type: string, example: "김뇌파" }
 *                         brainType: { type: string, example: "PENDING" }
 *                         loginType:
 *                           type: array
 *                           items:
 *                             type: string
 *                             enum: [local, google, kakao]
 *                           example: ["google"]
 *                         membershipLevel: { type: string, example: "BASIC" }
 *                         providerId: { type: string, nullable: true, example: "110248619384628000000" }
 *       400:
 *         description: 유효성 검사 실패 또는 소셜 계정 정보 누락
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "fail" }
 *                 message: { type: string, example: "PKCE code_verifier는 필수입니다." }
 *       401:
 *         description: 소셜 공급자 토큰/사용자 정보 조회 실패
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "fail" }
 *                 message: { type: string, example: "Google 액세스 토큰 발급 실패" }
 *       409:
 *         description: 이미 다른 방식으로 가입된 이메일
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "fail" }
 *                 message: { type: string, example: "해당 이메일은 이미 local 방식으로 가입되어 있습니다" }
 *       502:
 *         description: 소셜 공급자 서버 연결 실패
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "error" }
 *                 message: { type: string, example: "Google 토큰 서버에 연결할 수 없습니다" }
 */
router.post(
  '/social/:provider',
  validateParams(socialProviderSchema),
  validate(socialLoginSchema),
  authController.socialLogin
);

/**
 * @openapi
 * /api/auth/social/{provider}/token:
 *   post:
 *     summary: 소셜 로그인 (Access Token 직접 수신, 모바일 SDK 플로우)
 *     description: 모바일 SDK에서 직접 획득한 Access Token으로 로그인 또는 신규 가입 처리 후 JWT를 반환합니다.
 *     tags: [Auth]
 *     parameters:
 *       - name: provider
 *         in: path
 *         required: true
 *         description: 소셜 로그인 공급자
 *         schema:
 *           type: string
 *           enum: [google, kakao]
 *           example: "kakao"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accessToken
 *             properties:
 *               accessToken: { type: string, minLength: 10, example: "ya29.a0AfH6SMB..." }
 *     responses:
 *       200:
 *         description: 소셜 로그인 성공 (Access Token 방식)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "success" }
 *                 token: { type: string, example: "eyJhbGciOiJIUzI1NiIsInR..." }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id: { type: string, example: "695a003df33270433494b87e" }
 *                         email: { type: string, example: "user@gmail.com" }
 *                         name: { type: string, example: "김뇌파" }
 *                         brainType: { type: string, example: "PENDING" }
 *                         loginType:
 *                           type: array
 *                           items:
 *                             type: string
 *                             enum: [local, google, kakao]
 *                           example: ["kakao"]
 *                         membershipLevel: { type: string, example: "BASIC" }
 *                         providerId: { type: string, nullable: true, example: "110248619384628000000" }
 *       400:
 *         description: 유효성 검사 실패
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "fail" }
 *                 message: { type: string, example: "Access Token은 필수입니다." }
 *       401:
 *         description: 소셜 공급자 사용자 정보 조회 실패
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "fail" }
 *                 message: { type: string, example: "Kakao 사용자 정보 조회 실패" }
 *       409:
 *         description: 이미 다른 방식으로 가입된 이메일
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "fail" }
 *                 message: { type: string, example: "해당 이메일은 이미 local 방식으로 가입되어 있습니다" }
 *       502:
 *         description: 소셜 공급자 서버 연결 실패
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "error" }
 *                 message: { type: string, example: "Kakao 사용자 정보 서버에 연결할 수 없습니다" }
 */
router.post(
  '/social/:provider/token',
  validateParams(socialProviderSchema),
  validate(socialTokenSchema),
  authController.socialLoginWithToken
);

export default router;
