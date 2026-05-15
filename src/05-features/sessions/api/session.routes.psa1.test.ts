import express, { Request, Response, NextFunction } from 'express';
import request from 'supertest';

// 1. Mock 적용 (controller import 전 hoist 의무, barrel 경로 정합)

// 1-1. middlewares barrel mock — authenticate 교체 + validate은 actual 유지
// session.routes.dual2pc.test.ts:38-56 패턴 정합
jest.mock('@07-shared/middlewares', () => {
  const actual = jest.requireActual('@07-shared/middlewares');
  return {
    ...actual,
    authenticate: (req: Request, _res: Response, next: NextFunction) => {
      (req as Request & { user?: { id: string } }).user = {
        id: '507f1f77bcf86cd799439011',
      };
      next();
    },
  };
});

// 1-2. clock mock — FixedClock으로 systemClock 교체 (V3 우회 부재 정합)
jest.mock('@07-shared/clock', () => {
  const { FixedClock } = jest.requireActual('@07-shared/clock');
  return {
    SystemClock: jest.fn(),
    FixedClock,
    systemClock: new FixedClock(new Date('2026-05-15T10:00:00Z')),
  };
});

// 1-3. 06-entities/sessions mock — Mongoose model 재실행 차단 (CX-4)
// InvalidStatusTransitionError는 domain/errors.ts에 export됨 (CX2-1)
jest.mock('@06-entities/sessions', () => {
  const { SessionAggregate } = jest.requireActual(
    '@06-entities/sessions/domain/session.aggregate'
  );
  const { InvalidStatusTransitionError } = jest.requireActual(
    '@06-entities/sessions/domain/errors'
  );
  const { aggregateToPairingResponseDto } = jest.requireActual(
    '@06-entities/sessions/mappers/aggregate-to-response-dto'
  );

  const findByPairingToken = jest.fn();
  const save = jest.fn();

  return {
    SessionAggregate,
    InvalidStatusTransitionError,
    aggregateToPairingResponseDto,
    sessionRepository: { findByPairingToken, save },
    SessionRepository: jest.fn(() => ({ findByPairingToken, save })),
  };
});

// 1-4. pairing.service mock — firePairingCompleteListeners spy + 기존 export 보존
jest.mock('@05-features/sessions/services/pairing.service', () => ({
  pairDeviceProcess: jest.fn(),
  addPairingCompleteListener: jest.fn(),
  firePairingCompleteListeners: jest.fn(),
}));

// 2. 라우터 + 의존성 import (mock 적용 후)
import sessionRoutes from './session.routes';
import { firePairingCompleteListeners } from '@05-features/sessions/services/pairing.service';
import { sessionRepository, SessionAggregate } from '@06-entities/sessions';

// 3. bare Express app 빌드 (C4-CONN 해소, session.routes.adminpair.test.ts:56-71 패턴)
const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/sessions', sessionRoutes);
  app.use(
    (
      err: Error & { statusCode?: number },
      _req: Request,
      res: Response,
      _next: NextFunction
    ) => {
      res.status(err.statusCode || 500).json({
        status: 'fail',
        message: err.message,
      });
    }
  );
  return app;
};

const app = buildApp();

// 4. SessionAggregate stub factory (Phase G G3 정합 — 7 인자)
const createCreatedAggregate = (overrides: {
  expiresAt: Date;
  pairingToken?: string;
}) => {
  return SessionAggregate.create({
    id: '507f1f77bcf86cd799439020',
    groupId: '507f1f77bcf86cd799439030',
    subjectIndex: 1,
    pairingToken: overrides.pairingToken ?? 'valid-token',
    operatorId: '507f1f77bcf86cd799439040',
    mode: 'DUAL_2PC' as const,
    expiresAt: overrides.expiresAt,
  });
};

describe('POST /api/sessions/:pairingToken/pair (PSA1 E2E)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('E2E-A: 정상 페어링 시 200 + DTO + listener fire 1회 (controller→helper 검증)', async () => {
    // Arrange — 미래 만료 시각으로 aggregate 생성 (FixedClock 2026-05-15T10:00:00Z 기준)
    const testNow = new Date('2026-05-15T10:00:00Z');
    const future = new Date(testNow.getTime() + 5 * 60 * 1000);
    const aggregate = createCreatedAggregate({ expiresAt: future });
    (sessionRepository.findByPairingToken as jest.Mock).mockResolvedValue(
      aggregate
    );
    (sessionRepository.save as jest.Mock).mockResolvedValue(aggregate);

    // Act
    const res = await request(app)
      .post('/api/sessions/valid-token/pair')
      .set('Authorization', 'Bearer test-token');

    // Assert — 200 + DTO shape 검증
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      id: expect.any(String),
      groupId: expect.any(String),
      subjectIndex: expect.any(Number),
      creatorId: expect.any(String),
      experimentMode: 'DUAL_2PC',
      status: 'PAIRED',
      userId: expect.any(String),
      pairedAt: expect.any(String),
      measuredAt: null,
    });
    // operatorId/mode는 DTO에 노출되지 않음 (필드명 변환 정합)
    expect(res.body.data).not.toHaveProperty('operatorId');
    expect(res.body.data).not.toHaveProperty('mode');

    // controller-level listener fire 검증 (ADR-008 §3)
    expect(firePairingCompleteListeners).toHaveBeenCalledTimes(1);
    expect(firePairingCompleteListeners).toHaveBeenCalledWith(
      aggregate.groupId,
      aggregate.subjectIndex
    );

    // 영속화 1회 호출 확인
    expect(sessionRepository.save).toHaveBeenCalledTimes(1);
  });

  it('E2E-B: 만료 토큰 페어링 시 401 한국어 응답 + listener 0회', async () => {
    // Arrange — 과거 만료 시각 (codex M-3: expiresAt < now 정정)
    const testNow = new Date('2026-05-15T10:00:00Z');
    const past = new Date(testNow.getTime() - 1);
    const aggregate = createCreatedAggregate({
      expiresAt: past,
      pairingToken: 'expired-token',
    });
    (sessionRepository.findByPairingToken as jest.Mock).mockResolvedValue(
      aggregate
    );
    (sessionRepository.save as jest.Mock).mockResolvedValue(aggregate);

    // Act
    const res = await request(app)
      .post('/api/sessions/expired-token/pair')
      .set('Authorization', 'Bearer test-token');

    // Assert — 401 + 한국어 메시지
    expect(res.status).toBe(401);
    expect(res.body.message).toBe(
      '페어링 토큰이 만료되었습니다. 다시 시도해주세요.'
    );

    // EXPIRED 영속화 확인
    expect(sessionRepository.save).toHaveBeenCalledTimes(1);
    const savedArg = (sessionRepository.save as jest.Mock).mock.calls[0][0];
    expect(savedArg.status).toBe('EXPIRED');

    // listener 미발화 확인
    expect(firePairingCompleteListeners).not.toHaveBeenCalled();
  });
});
