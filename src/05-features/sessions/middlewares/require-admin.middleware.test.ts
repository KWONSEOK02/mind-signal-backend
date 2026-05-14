import { Response, NextFunction } from 'express';

jest.mock('@07-shared/config/config', () => ({
  config: { adminEmails: ['admin@example.com'] },
}));

const mockFindById = jest.fn();
jest.mock('@06-entities/users/model/user.schema', () => ({
  __esModule: true,
  default: {
    findById: (...args: unknown[]) => mockFindById(...args),
  },
}));

import { requireAdmin } from './require-admin.middleware';
import { AppError } from '@07-shared/errors';

const makeReq = (userId?: string) =>
  ({
    user: userId ? { id: userId } : undefined,
  }) as Parameters<typeof requireAdmin>[0];

const res = {} as Response;

describe('requireAdmin middleware', () => {
  let next: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFindById.mockReset();
    next = jest.fn();
  });

  // M-1
  it('M-1: admin email allowlist 통과 → next() 호출됨', async () => {
    mockFindById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ email: 'admin@example.com' }),
    });
    await requireAdmin(makeReq('admin-id'), res, next as NextFunction);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  // M-2
  it('M-2: req.user.id 누락 → 401', async () => {
    await requireAdmin(makeReq(undefined), res, next as NextFunction);
    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const err = next.mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(401);
  });

  // M-3
  it('M-3: DB stale (findById 결과 null) → 401', async () => {
    mockFindById.mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    });
    await requireAdmin(makeReq('stale-id'), res, next as NextFunction);
    const err = next.mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(401);
  });

  // M-4
  it('M-4: user email이 allowlist 미포함 → 403', async () => {
    mockFindById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ email: 'normal@user.com' }),
    });
    await requireAdmin(makeReq('user-id'), res, next as NextFunction);
    const err = next.mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(403);
  });

  // M-5
  it('M-5: findById 호출 시 projection {email:1} 적용됨', async () => {
    mockFindById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ email: 'admin@example.com' }),
    });
    await requireAdmin(makeReq('admin-id'), res, next as NextFunction);
    expect(mockFindById).toHaveBeenCalledWith('admin-id', { email: 1 });
  });
});
