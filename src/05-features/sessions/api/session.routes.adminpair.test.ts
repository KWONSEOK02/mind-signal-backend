import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

// env는 모듈 로딩 전에 설정 — config.ts 초기 평가에 영향
process.env.JWT_SECRET_KEY = 'test-secret';
process.env.JWT_EXPIRES_IN = '1h';
process.env.ADMIN_EMAILS = 'admin-test@example.com';

// hoist-safe — factory 내부는 리터럴만 사용
jest.mock('@06-entities/users/model/user.schema', () => {
  const ChainedQuery = (resolveValue: unknown) => ({
    lean: jest.fn().mockResolvedValue(resolveValue),
  });
  return {
    __esModule: true,
    default: {
      findById: jest.fn((id: string) => {
        if (id === 'ADMIN_ID_LITERAL') {
          return ChainedQuery({ email: 'admin-test@example.com' });
        }
        if (id === 'NON_ADMIN_ID_LITERAL') {
          return ChainedQuery({ email: 'normal@user.com' });
        }
        return ChainedQuery(null);
      }),
      findOne: jest.fn((filter: { email: string }) => {
        if (filter.email === 'target@example.com') {
          return {
            lean: jest.fn().mockResolvedValue({
              _id: new Types.ObjectId('507f191e810c19729de860ea'),
            }),
          };
        }
        return { lean: jest.fn().mockResolvedValue(null) };
      }),
    },
  };
});

jest.mock('@05-features/sessions/services/pairing.service', () => ({
  pairDeviceProcess: jest.fn().mockResolvedValue({
    _id: 'sess-int-1',
    groupId: 'g-int',
    subjectIndex: 1,
    status: 'PAIRED',
  }),
  addPairingCompleteListener: jest.fn(),
  pairingListeners: new Set(),
}));

import sessionRoutes from './session.routes';
import { AppError } from '@07-shared/errors';

// bare Express app — mongoose connect 없음, app.ts side-effect 회피
const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/sessions', sessionRoutes);
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        status: err.statusCode >= 500 ? 'error' : 'fail',
        message: err.message,
      });
    }
    return res.status(500).json({ status: 'error', message: 'internal' });
  });
  return app;
};

const makeToken = (userId: string) =>
  jwt.sign({ id: userId }, 'test-secret', { expiresIn: '1h' });

describe('POST /api/sessions/:pairingToken/admin-pair (integration)', () => {
  const app = buildApp();

  // I-1
  it('I-1: Happy path — admin JWT + valid target email → 200 + session', async () => {
    const res = await request(app)
      .post('/api/sessions/token-1/admin-pair')
      .set('Authorization', `Bearer ${makeToken('ADMIN_ID_LITERAL')}`)
      .send({ email: 'target@example.com' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: 'success',
      data: expect.objectContaining({ _id: 'sess-int-1' }),
    });
  });

  // I-2
  it('I-2: non-admin JWT → 403', async () => {
    const res = await request(app)
      .post('/api/sessions/token-1/admin-pair')
      .set('Authorization', `Bearer ${makeToken('NON_ADMIN_ID_LITERAL')}`)
      .send({ email: 'target@example.com' });

    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({
      status: 'fail',
      message: expect.stringContaining('관리자'),
    });
  });

  // I-3
  it('I-3: JWT missing → 401', async () => {
    const res = await request(app)
      .post('/api/sessions/token-1/admin-pair')
      .send({ email: 'target@example.com' });

    expect(res.status).toBe(401);
  });

  // I-4 — route 미등록 404 vs service 404 구분
  it('I-4: target email 미존재 → 404 + service-level 메시지', async () => {
    const res = await request(app)
      .post('/api/sessions/token-1/admin-pair')
      .set('Authorization', `Bearer ${makeToken('ADMIN_ID_LITERAL')}`)
      .send({ email: 'missing@example.com' });

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      status: 'fail',
      message: expect.stringContaining('대상 사용자'),
    });
  });

  // I-5 — Zod strict mass-assignment 방어
  it('I-5: body에 추가 필드 → 400', async () => {
    const res = await request(app)
      .post('/api/sessions/token-1/admin-pair')
      .set('Authorization', `Bearer ${makeToken('ADMIN_ID_LITERAL')}`)
      .send({ email: 'target@example.com', isAdmin: true });

    expect(res.status).toBe(400);
  });

  // I-6 — email normalize (대소문자/공백)
  it('I-6: body email 대소문자/공백 → normalize 후 200', async () => {
    const res = await request(app)
      .post('/api/sessions/token-1/admin-pair')
      .set('Authorization', `Bearer ${makeToken('ADMIN_ID_LITERAL')}`)
      .send({ email: '  TARGET@example.com  ' });

    expect(res.status).toBe(200);
  });
});
