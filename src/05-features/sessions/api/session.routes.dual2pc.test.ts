/**
 * session.routes.ts — DUAL_2PC 라우트 통합 테스트 (supertest)
 *
 * 검증 항목 (BE-1):
 *   - POST /:groupId/invite-operator — 유효 groupId → 201 + token/expiresAt
 *   - POST /:groupId/invite-operator — 세션 없음 → 404
 *   - POST /:groupId/invite-operator — 인증 없음 → 401
 *   - POST /join-as-operator — 유효 JWT → 200 + groupId + experimentMode
 *   - POST /join-as-operator — 만료 JWT → 401
 *   - POST /join-as-operator — 잘못된 서명 → 401
 */

import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// Session 모킹 — MongoDB 의존 제거함
jest.mock('@06-entities/sessions', () => ({
  Session: {
    find: jest.fn(),
    updateMany: jest.fn(),
  },
}));

// config 모킹
jest.mock('@07-shared/config/config', () => ({
  config: {
    jwtSecret: { secret: 'test-secret-key', expiresIn: '5m' },
    dataEngine: { secretKey: 'engine-secret' },
    dualPc: {
      timestampToleranceMs: 200,
      registrationTimeoutMs: 60000,
    },
  },
}));

// authenticate 모킹 — JWT 없이 req.user 주입
jest.mock('@07-shared/middlewares', () => {
  const actual = jest.requireActual('@07-shared/middlewares');
  return {
    ...actual,
    authenticate: (
      req: express.Request,
      _res: express.Response,
      next: express.NextFunction
    ) => {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return _res
          .status(401)
          .json({ status: 'fail', message: '인증이 필요합니다.' });
      }
      (req as any).user = { id: 'mock-operator-id' };
      next();
    },
  };
});

import { Session } from '@06-entities/sessions';
import sessionRouter from './session.routes';

const mockSession = Session as jest.Mocked<typeof Session>;

/** 테스트용 Express 앱 빌드 */
function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/sessions', sessionRouter);
  // 전역 에러 핸들러 — AppError statusCode 반영
  app.use(
    (
      err: any,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      res.status(err.statusCode || 500).json({
        status: err.status || 'error',
        message: err.message,
      });
    }
  );
  return app;
}

const app = buildApp();

/** 유효한 operator_invite JWT 생성 헬퍼 */
function makeInviteToken(groupId: string, opts?: jwt.SignOptions): string {
  return jwt.sign(
    { groupId, type: 'operator_invite' },
    'test-secret-key',
    opts ?? { expiresIn: '5m' }
  );
}

describe('POST /api/sessions/:groupId/invite-operator (BE-1-invite)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('유효 groupId + 인증 → 201 + token + expiresAt 반환함', async () => {
    // Arrange
    (mockSession.find as jest.Mock).mockResolvedValue([{ groupId: 'grp-001' }]);
    (mockSession.updateMany as jest.Mock).mockResolvedValue({
      modifiedCount: 1,
    });

    // Act
    const res = await request(app)
      .post('/api/sessions/grp-001/invite-operator')
      .set('Authorization', 'Bearer mock-user-token');

    // Assert
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data).toHaveProperty('expiresAt');
    expect(typeof res.body.data.token).toBe('string');
    expect(typeof res.body.data.expiresAt).toBe('number');
  });

  it('존재하지 않는 groupId → 404 반환함', async () => {
    // Arrange
    (mockSession.find as jest.Mock).mockResolvedValue([]);

    // Act
    const res = await request(app)
      .post('/api/sessions/nonexistent-group/invite-operator')
      .set('Authorization', 'Bearer mock-user-token');

    // Assert
    expect(res.status).toBe(404);
  });

  it('Authorization 헤더 없음 → 401 반환함', async () => {
    // Act — 인증 헤더 없이 요청
    const res = await request(app).post(
      '/api/sessions/grp-001/invite-operator'
    );

    // Assert
    expect(res.status).toBe(401);
  });
});

describe('POST /api/sessions/join-as-operator (BE-1-join)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('유효 JWT → 200 + groupId + experimentMode DUAL_2PC 반환함', async () => {
    // Arrange
    const token = makeInviteToken('grp-001');
    (mockSession.find as jest.Mock).mockResolvedValue([{ groupId: 'grp-001' }]);

    // Act
    const res = await request(app)
      .post('/api/sessions/join-as-operator')
      .send({ token });

    // Assert
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.groupId).toBe('grp-001');
    expect(res.body.data.experimentMode).toBe('DUAL_2PC');
  });

  it('만료 토큰 → 401 반환함', async () => {
    // Arrange — 즉시 만료 토큰
    const expiredToken = jwt.sign(
      { groupId: 'grp-001', type: 'operator_invite' },
      'test-secret-key',
      { expiresIn: 0 }
    );

    // Act
    const res = await request(app)
      .post('/api/sessions/join-as-operator')
      .send({ token: expiredToken });

    // Assert
    expect(res.status).toBe(401);
  });

  it('잘못된 서명 → 401 반환함', async () => {
    // Arrange — 다른 시크릿으로 서명
    const wrongToken = jwt.sign(
      { groupId: 'grp-001', type: 'operator_invite' },
      'wrong-secret'
    );

    // Act
    const res = await request(app)
      .post('/api/sessions/join-as-operator')
      .send({ token: wrongToken });

    // Assert
    expect(res.status).toBe(401);
  });

  it('token 필드 누락 → 400 반환함', async () => {
    // Act
    const res = await request(app)
      .post('/api/sessions/join-as-operator')
      .send({});

    // Assert
    expect(res.status).toBe(400);
  });
});
