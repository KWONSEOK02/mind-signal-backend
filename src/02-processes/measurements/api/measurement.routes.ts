// src/02-processes/measurement/api/measurement.routes.ts
import { Router } from 'express';
import measurementController from './measurement.controller';
import { authenticate } from '@07-shared/middlewares';

const router = Router();

/**
 * [Phase 2] 실시간 스트리밍 및 외부 엔진 실행 트리거
 * http://localhost:5000/api/measurements/sessions/:sessionId/eeg/stream:start
 * 02-processes 계층에서 복잡한 오케스트레이션을 제어함
 */

/**
 * @openapi
 * /api/measurements/sessions/{sessionId}/eeg/stream:start:
 *   post:
 *     summary: 실시간 뇌파 스트리밍 시작 (Phase 2)
 *     tags: [Measurements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 스트리밍 엔진 시작 성공
 */

router.post(
  '/sessions/:sessionId/eeg/stream:start',
  authenticate,
  measurementController.startStreaming
);

export default router;
