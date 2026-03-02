import { Router } from 'express';
import * as sessionsController from './session.controller';
import { authenticate } from '@07-shared/middlewares'; // 인증 미들웨어

const router = Router();

/**
 * Phase 1.5: 모바일 QR 스캔 & 페어링
 * POST /sessions/:pairingToken/pair
 * * 1. authenticate: 요청자가 로그인한 사용자인지 확인하고 req.user를 바인딩함
 * 2. pairDevice: DTO 검증 후 비즈니스 프로세스(pairingProcess) 실행
 */
// 반드시 컨트롤러 앞에서 인증을 통해서 req.user를 확보해야 함

/**
 * @openapi
 * tags:
 *   - name: Sessions
 * description: 기기 페어링 및 세션 상태 관리
 */

/**
 * @openapi
 * /api/sessions:
 *   post:
 *     summary: 페어링 세션 생성 (Phase 1)
 *     description: |
 *       PC 웹에서 QR 코드를 생성하기 위한 초기 세션을 생성합니다.
 *       - 서버가 pairingToken(대문자 HEX)과 sessionId를 발급합니다.
 *       - pairingToken은 기본 5분 유효(expiresAt)입니다.
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: 세션 및 페어링 토큰 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "success" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     pairingToken:
 *                       type: string
 *                       description: QR로 노출되는 페어링 토큰(대문자 HEX)
 *                       example: "A1B2C3"
 *                     sessionId:
 *                       type: string
 *                       description: 생성된 세션 ID(ObjectId)
 *                       example: "65c9f0b2a1b2c3d4e5f67890"
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                       description: 토큰 만료 시각(UTC)
 *                       example: "2026-02-12T03:10:00.000Z"
 *       401:
 *         description: 인증 실패(토큰 누락/만료/비정상)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "fail" }
 *                 message: { type: string, example: "유효하지 않은 토큰입니다." }
 *       500:
 *         description: 서버 오류(세션 저장 실패 등)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "fail" }
 *                 message: { type: string, example: "서버 오류가 발생했습니다." }
 */

router.post('/', authenticate, sessionsController.createSession);

/**
 * @openapi
 * /api/sessions/{pairingToken}/pair:
 *   post:
 *     tags: [Sessions]
 *     summary: 모바일 기기 페어링 연결 (Phase 1.5-A)
 *     description: |
 *       QR 스캔 후 pairingToken으로 세션을 사용자 계정에 바인딩합니다.
 *       상태 전이 규칙: CREATED -> PAIRED 만 허용
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: pairingToken
 *         in: path
 *         required: true
 *         description: QR에서 획득한 페어링 토큰(대문자 HEX)
 *         schema:
 *           type: string
 *           example: "A1B2C3"
 *     responses:
 *       200:
 *         description: 기기 페어링 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "success" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     id: { type: string, example: "65c9f0b2a1b2c3d4e5f67890" }
 *                     pairingToken: { type: string, example: "A1B2C3" }
 *                     userId: { type: string, example: "65c9f0b2a1b2c3d4e5f67891" }
 *                     status:
 *                       type: string
 *                       enum: [CREATED, PAIRED, MEASURING, COMPLETED, EXPIRED, CANCELLED]
 *                       example: "PAIRED"
 *                     pairedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-02-12T03:06:00.000Z"
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-02-12T03:10:00.000Z"
 *                     measuredAt:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                       example: null
 *
 *       400:
 *         description: 상태 전이 불가 또는 검증 실패
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "fail" }
 *                 message:
 *                   type: string
 *                   example: "현재 세션 상태(MEASURING)에서는 페어링할 수 없습니다."
 *
 *       401:
 *         description: 인증 실패 또는 토큰 만료
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "fail" }
 *                 message:
 *                   type: string
 *                   example: "페어링 토큰이 만료되었습니다."
 *
 *       404:
 *         description: INVALID_TOKEN
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "fail" }
 *                 message: { type: string, example: "INVALID_TOKEN" }
 *
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "fail" }
 *                 message: { type: string, example: "서버 오류가 발생했습니다." }
 */

router.post('/:pairingToken/pair', authenticate, sessionsController.pairDevice);

/**
 * @openapi
 * /api/sessions/{sessionId}/consents:
 *   post:
 *     summary: 동의서 제출 및 스냅샷 생성 (Phase 1.5-B)
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         example: "65c9f0b2a1b2c3d4e5f67890"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - versionId
 *               - isResearchAgreed
 *             properties:
 *               versionId:
 *                 type: string
 *                 example: "v1.0"
 *               isResearchAgreed:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: 동의서 제출 완료
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "success" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     id: { type: string, example: "65c9f0b2a1b2c3d4e5f67999" }
 *                     userId: { type: string, example: "65c9f0b2a1b2c3d4e5f67891" }
 *                     sessionId: { type: string, example: "65c9f0b2a1b2c3d4e5f67890" }
 *                     versionId: { type: string, example: "v1.0" }
 *                     isResearchAgreed: { type: boolean, example: true }
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-02-12T00:00:00.000Z"
 *
 *       400:
 *         description: 잘못된 요청 또는 세션 상태 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "fail" }
 *                 message:
 *                   type: string
 *                   example: "페어링되지 않은 세션에서는 동의를 진행할 수 없습니다."
 *
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "fail" }
 *                 message:
 *                   type: string
 *                   example: "인증이 필요합니다."
 *
 *       404:
 *         description: 세션을 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "fail" }
 *                 message:
 *                   type: string
 *                   example: "세션을 찾을 수 없습니다."
 *
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "fail" }
 *                 message:
 *                   type: string
 *                   example: "서버 오류가 발생했습니다."
 */

router.post(
  '/:sessionId/consents',
  authenticate,
  sessionsController.submitConsent
);

// 특정 그룹의 실시간 합류 현황 조회 수행함 (운영자 대시보드 폴링용)
router.get(
  '/group/:groupId/status',
  authenticate,
  sessionsController.checkGroupStatus
);

export default router;
