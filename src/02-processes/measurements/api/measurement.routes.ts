// src/02-processes/measurement/api/measurement.routes.ts
import { Router } from 'express';
import measurementController from './measurement.controller';

const router = Router();

/**
 * [Phase 2] 실시간 스트리밍 및 외부 엔진 실행 트리거
 * http://localhost:5000/api/measurements/sessions/:sessionId/eeg/stream:start
 * 02-processes 계층에서 복잡한 오케스트레이션을 제어함
 */
router.post(
  '/sessions/:sessionId/eeg/stream:start',
  measurementController.startStreaming
);

export default router;
