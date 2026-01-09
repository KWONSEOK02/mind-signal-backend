import { Router } from 'express';
import * as sessionsController from './session.controller';
import { authenticate } from '@07-shared/middlewares/authenticate.middleware'; // 인증 미들웨어

const router = Router();

/**
 * Phase 1.5: 모바일 QR 스캔 & 페어링
 * POST /sessions/:pairingToken/pair
 * * 1. authenticate: 요청자가 로그인한 사용자인지 확인하고 req.user를 바인딩함
 * 2. pairDevice: DTO 검증 후 비즈니스 프로세스(pairingProcess) 실행
 */
// 반드시 컨트롤러 앞에서 인증을 통해서 req.user를 확보해야 함
router.post('/', authenticate, sessionsController.createSession);
router.post('/:pairingToken/pair', authenticate, sessionsController.pairDevice);
router.post('/:sessionId/consents', authenticate, sessionsController.submitConsent);

export default router;
