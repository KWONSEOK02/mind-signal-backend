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
 *     description: PC 웹에서 QR 코드를 생성하기 위한 초기 세션을 생성합니다.
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: 세션 및 페어링 토큰 생성 성공
 */
router.post('/', authenticate, sessionsController.createSession);

/**
 * @openapi
 * /api/sessions/{pairingToken}/pair:
 *   post:
 *     summary: 모바일 기기 페어링 연결 (Phase 1.5-A)
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pairingToken
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 기기 페어링 성공
 */
router.post('/:pairingToken/pair', authenticate, sessionsController.pairDevice);

/**
 * @openapi
 * /api/sessions/{sessionId}/consents:
 *   post:
 *     summary: 동의서 제출 및 스냅샷 생성 (Phase 1.5-B)
 *     description: 측정 시작 전 개인정보 활용 동의서를 제출하고 해당 시점의 스냅샷을 생성합니다.
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: 현재 진행 중인 세션 ID
 *     responses:
 *       200:
 *         description: 동의서 제출 완료
 *       400:
 *         description: 잘못된 요청 데이터
 */

router.post(
  '/:sessionId/consents',
  authenticate,
  sessionsController.submitConsent
);

export default router;
