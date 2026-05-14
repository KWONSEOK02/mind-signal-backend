import { Types } from 'mongoose';

const mockFindOne = jest.fn();
const mockPairDeviceProcess = jest.fn();

jest.mock('@06-entities/users/model/user.schema', () => ({
  __esModule: true,
  default: { findOne: (...args: unknown[]) => mockFindOne(...args) },
}));
jest.mock('./pairing.service', () => ({
  pairDeviceProcess: (...args: unknown[]) => mockPairDeviceProcess(...args),
}));

import { adminPairDeviceProcess } from './admin-pair.service';

// .lean() chain helper — Mongoose Query stub
const leanReturning = (value: unknown) => ({
  lean: jest.fn().mockResolvedValue(value),
});

const ADMIN_ID = new Types.ObjectId().toString();
const TARGET_ID = new Types.ObjectId();
const TARGET_ID_STR = TARGET_ID.toString();

describe('adminPairDeviceProcess', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  // AS-1
  it('AS-1: target email 정상 → pairDeviceProcess 호출 + success log emit', async () => {
    mockFindOne.mockReturnValue(leanReturning({ _id: TARGET_ID }));
    mockPairDeviceProcess.mockResolvedValue({
      _id: 'sess-1',
      groupId: 'g-1',
      subjectIndex: 1,
    });

    const result = await adminPairDeviceProcess(
      'token-x',
      'user@example.com',
      ADMIN_ID
    );

    expect(mockFindOne).toHaveBeenCalledWith(
      { email: 'user@example.com' },
      { _id: 1 }
    );
    expect(mockPairDeviceProcess).toHaveBeenCalledWith(
      'token-x',
      TARGET_ID_STR
    );
    expect(result._id).toBe('sess-1');
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[admin-force-pair] outcome=success')
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining(`adminId=${ADMIN_ID}`)
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining(`targetUserId=${TARGET_ID_STR}`)
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('isSelf=false')
    );
  });

  // AS-2
  it('AS-2: target email 미존재 → 404 + failure log emit', async () => {
    mockFindOne.mockReturnValue(leanReturning(null));

    await expect(
      adminPairDeviceProcess('token-x', 'missing@example.com', ADMIN_ID)
    ).rejects.toMatchObject({ statusCode: 404 });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[admin-force-pair] outcome=failure')
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('reason=target_user_not_found')
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('targetEmail=missing@example.com')
    );
    expect(mockPairDeviceProcess).not.toHaveBeenCalled();
  });

  // AS-3
  it('AS-3: isSelf=true (admin이 자기 자신 강제 페어링)', async () => {
    const sameAsAdmin = new Types.ObjectId(ADMIN_ID);
    mockFindOne.mockReturnValue(leanReturning({ _id: sameAsAdmin }));
    mockPairDeviceProcess.mockResolvedValue({
      _id: 'sess-2',
      groupId: 'g-2',
      subjectIndex: 1,
    });

    await adminPairDeviceProcess('token-y', 'admin@example.com', ADMIN_ID);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('isSelf=true')
    );
  });

  // AS-4
  it('AS-4: email normalize (대소문자 + 공백) — DB lookup은 normalized 값', async () => {
    mockFindOne.mockReturnValue(leanReturning({ _id: TARGET_ID }));
    mockPairDeviceProcess.mockResolvedValue({
      _id: 'sess-3',
      groupId: 'g-3',
      subjectIndex: 1,
    });

    await adminPairDeviceProcess('token-z', '  Admin@Example.COM  ', ADMIN_ID);

    expect(mockFindOne).toHaveBeenCalledWith(
      { email: 'admin@example.com' },
      { _id: 1 }
    );
  });
});
