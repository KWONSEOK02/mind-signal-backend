/**
 * engine.routes.ts — POST /api/engine/register-dual supertest 런타임 검증
 *
 * 검증 항목:
 *   - 유효 body → 200 + { message, registeredCount }
 *   - Zod 검증 실패 케이스 5종 → 400
 *   - secretKey 불일치 → 403
 *   - 재등록(같은 groupId+subjectIndex) → 200 + URL overwrite 검증
 */

import express from 'express';
import request from 'supertest';

// config 모킹 — dataEngine.secretKey 고정값 주입
jest.mock('@07-shared/config/config', () => ({
  config: {
    env: 'test',
    port: 5000,
    mongoUri: 'mongodb://localhost:27017/test',
    jwtSecret: { secret: 'test-secret', expiresIn: '5m' },
    isProduction: false,
    redis: { url: 'redis://localhost:6379' },
    dataEngine: {
      path: '/tmp/engine',
      baseUrl: 'http://localhost:5002',
      pythonBin: 'python',
      secretKey: 'correct-engine-secret',
    },
    dualPc: {
      timestampToleranceMs: 200,
      registrationTimeoutMs: 60000,
    },
  },
}));

import engineRouter from './engine.routes';

/** 테스트용 Express 앱 빌드 */
function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/engine', engineRouter);
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

/** 유효한 register-dual 바디 팩토리 */
function validBody(overrides?: Record<string, unknown>) {
  return {
    groupId: 'grp_abc123',
    subjectIndex: 1,
    engineUrl: 'http://192.168.0.10:5002',
    secretKey: 'correct-engine-secret',
    ...overrides,
  };
}

describe('POST /api/engine/register-dual — Test 1: 유효 body → 200', () => {
  const app = buildApp();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('유효한 body → 200 + message + registeredCount 반환함', async () => {
    // Arrange
    const body = validBody({
      groupId: 'grp_test200',
      subjectIndex: 1,
    });

    // Act
    const res = await request(app).post('/api/engine/register-dual').send(body);

    // Assert
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'DUAL_2PC 엔진 등록 완료');
    expect(res.body).toHaveProperty('registeredCount');
    expect(typeof res.body.registeredCount).toBe('number');
    expect(res.body.registeredCount).toBeGreaterThanOrEqual(1);
  });
});

describe('POST /api/engine/register-dual — Test 2: Zod 검증 실패 → 400', () => {
  const app = buildApp();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('subjectIndex=3 (max=2 초과) → 400 반환함', async () => {
    const res = await request(app)
      .post('/api/engine/register-dual')
      .send(validBody({ subjectIndex: 3 }));

    expect(res.status).toBe(400);
  });

  it('subjectIndex=0 (min=1 미만) → 400 반환함', async () => {
    const res = await request(app)
      .post('/api/engine/register-dual')
      .send(validBody({ subjectIndex: 0 }));

    expect(res.status).toBe(400);
  });

  it('engineUrl이 URL 형식이 아님 → 400 반환함', async () => {
    const res = await request(app)
      .post('/api/engine/register-dual')
      .send(validBody({ engineUrl: 'not-a-url' }));

    expect(res.status).toBe(400);
  });

  it('secretKey 누락 → 400 반환함', async () => {
    const res = await request(app).post('/api/engine/register-dual').send({
      groupId: 'grp_abc',
      subjectIndex: 1,
      engineUrl: 'http://host:5002',
    });

    expect(res.status).toBe(400);
  });

  it('groupId 누락 → 400 반환함', async () => {
    const res = await request(app)
      .post('/api/engine/register-dual')
      .send({ subjectIndex: 1, engineUrl: 'http://host:5002', secretKey: 'k' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/engine/register-dual — Test 3: secretKey 불일치 → 403', () => {
  const app = buildApp();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('잘못된 secretKey → 403 반환함', async () => {
    // Arrange
    const body = validBody({
      groupId: 'grp_test403',
      secretKey: 'wrong-secret',
    });

    // Act
    const res = await request(app).post('/api/engine/register-dual').send(body);

    // Assert
    expect(res.status).toBe(403);
    expect(res.body.status).toBe('fail');
  });
});

describe('POST /api/engine/register-dual — Test 4: 재등록 → 200 + URL overwrite 검증', () => {
  const app = buildApp();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('같은 groupId+subjectIndex 재등록 시 200 + 새 URL로 overwrite됨', async () => {
    const groupId = 'grp_reregister_test';
    const subjectIndex = 2;

    // Arrange — 첫 번째 등록
    const firstRes = await request(app)
      .post('/api/engine/register-dual')
      .send(
        validBody({
          groupId,
          subjectIndex,
          engineUrl: 'http://old-host:5002',
        })
      );
    expect(firstRes.status).toBe(200);

    // Act — 같은 groupId+subjectIndex로 재등록 (다른 URL)
    const secondRes = await request(app)
      .post('/api/engine/register-dual')
      .send(
        validBody({
          groupId,
          subjectIndex,
          engineUrl: 'http://new-host:5002',
        })
      );

    // Assert — 재등록도 200 반환
    expect(secondRes.status).toBe(200);
    expect(secondRes.body.message).toBe('DUAL_2PC 엔진 등록 완료');

    // Assert — getEngineUrlByGroupSubject로 overwrite 검증
    const { engineRegistryService } =
      await import('@02-processes/engine/services/engine-registry.service');
    const url = engineRegistryService.getEngineUrlByGroupSubject(
      groupId,
      subjectIndex
    );
    expect(url).toBe('http://new-host:5002');
  });
});
