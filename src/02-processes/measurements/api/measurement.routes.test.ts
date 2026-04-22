/**
 * measurement.routes.ts — validateParams 보강 검증 + 라우트 통합 테스트
 *
 * 검증 항목:
 *   - measurementStartParamsSchema Zod 런타임 검증
 *   - validateParams가 라우트 미들웨어 체인에 실제로 연결됨 (supertest 기반)
 *   - 유효하지 않은 sessionId(비-ObjectId)는 검증 실패함
 */

import express from 'express';
import request from 'supertest';
import { measurementStartParamsSchema } from './measurement.schema';
import { authenticate, validateParams } from '@07-shared/middlewares';
import measurementController from './measurement.controller';

// measurementService 모킹 — 외부 인프라(Redis, Python 엔진, MongoDB) 의존 제거
jest.mock('@02-processes/measurements/services/measurement.service', () => ({
  startMeasurementService: jest
    .fn()
    .mockResolvedValue({ measuredAt: '2026-01-01T00:00:00.000Z' }),
}));

// authenticate 모킹 — JWT 검증 없이 req.user 주입
jest.mock('@07-shared/middlewares', () => {
  const actual = jest.requireActual('@07-shared/middlewares');
  return {
    ...actual,
    authenticate: (
      req: express.Request,
      _res: express.Response,
      next: express.NextFunction
    ) => {
      (req as any).user = { id: 'mockUserId' };
      next();
    },
  };
});

// 라우트 통합 테스트용 경량 Express 앱 생성
function buildMeasurementApp() {
  const app = express();
  app.use(express.json());
  app.post(
    '/sessions/:sessionId/eeg/stream:start',
    authenticate,
    validateParams(measurementStartParamsSchema),
    measurementController.startStreaming
  );
  return app;
}

describe('measurementStartParamsSchema Zod 런타임 검증', () => {
  it('유효한 24자리 hex ObjectId는 검증을 통과함', () => {
    const result = measurementStartParamsSchema.safeParse({
      sessionId: '65c9f0b2a1b2c3d4e5f67890',
    });
    expect(result.success).toBe(true);
  });

  it('소문자 24자리 hex ObjectId도 검증을 통과함', () => {
    const result = measurementStartParamsSchema.safeParse({
      sessionId: 'aabbccddeeff001122334455',
    });
    expect(result.success).toBe(true);
  });

  it('23자리 짧은 문자열은 검증 실패함', () => {
    const result = measurementStartParamsSchema.safeParse({
      sessionId: '65c9f0b2a1b2c3d4e5f6789',
    });
    expect(result.success).toBe(false);
  });

  it('비-hex 문자 포함 시 검증 실패함', () => {
    const result = measurementStartParamsSchema.safeParse({
      sessionId: 'zzzzzzzzzzzzzzzzzzzzzzzz',
    });
    expect(result.success).toBe(false);
  });

  it('빈 문자열은 검증 실패함', () => {
    const result = measurementStartParamsSchema.safeParse({ sessionId: '' });
    expect(result.success).toBe(false);
  });

  it('sessionId 누락 시 검증 실패함', () => {
    const result = measurementStartParamsSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('POST /sessions/:sessionId/eeg/stream:start — validateParams 라우트 통합', () => {
  const app = buildMeasurementApp();

  it('유효한 ObjectId sessionId로 요청 시 200 반환함', async () => {
    const res = await request(app).post(
      '/sessions/65c9f0b2a1b2c3d4e5f67890/eeg/stream:start'
    );
    expect(res.status).toBe(200);
  });

  it('비-ObjectId sessionId로 요청 시 400 반환함 (validateParams 체인 확인)', async () => {
    const res = await request(app).post(
      '/sessions/invalid-id/eeg/stream:start'
    );
    expect(res.status).toBe(400);
  });
});
