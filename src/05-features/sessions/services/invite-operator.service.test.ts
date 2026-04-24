/**
 * invite-operator.service.ts — Unit 테스트
 *
 * 검증 항목:
 *   - 유효한 groupId → JWT 토큰 + expiresAt 반환함
 *   - 존재하지 않는 groupId → AppError 404 발생함
 *   - 토큰 payload에 groupId, type: 'operator_invite' 포함됨
 *   - expiresAt이 현재 시각 기준 약 5분 후임
 */

import jwt from 'jsonwebtoken';
import { createOperatorInviteToken } from './invite-operator.service';

// Session 모델 모킹 — MongoDB 의존 제거함
jest.mock('@06-entities/sessions', () => ({
  Session: {
    find: jest.fn(),
    updateMany: jest.fn(),
  },
}));

// config 모킹 — 테스트 전용 JWT 시크릿 주입함
jest.mock('@07-shared/config/config', () => ({
  config: {
    jwtSecret: { secret: 'test-secret-key', expiresIn: '5m' },
    dataEngine: { secretKey: 'engine-secret' },
  },
}));

import { Session } from '@06-entities/sessions';

const mockSession = Session as jest.Mocked<typeof Session>;

describe('createOperatorInviteToken — invite-operator.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('유효한 groupId 시 token과 expiresAt 반환함', async () => {
    // Arrange
    (mockSession.find as jest.Mock).mockResolvedValue([
      { groupId: 'group-abc', experimentMode: 'DUAL' },
    ]);
    (mockSession.updateMany as jest.Mock).mockResolvedValue({
      modifiedCount: 1,
    });

    // Act
    const before = Date.now();
    const result = await createOperatorInviteToken('group-abc');
    const after = Date.now();

    // Assert
    expect(result).toHaveProperty('token');
    expect(result).toHaveProperty('expiresAt');
    expect(typeof result.token).toBe('string');
    expect(result.expiresAt).toBeGreaterThanOrEqual(
      before + 5 * 60 * 1000 - 50
    );
    expect(result.expiresAt).toBeLessThanOrEqual(after + 5 * 60 * 1000 + 50);
  });

  it('JWT payload에 groupId와 type: operator_invite 포함됨', async () => {
    // Arrange
    (mockSession.find as jest.Mock).mockResolvedValue([
      { groupId: 'group-xyz' },
    ]);
    (mockSession.updateMany as jest.Mock).mockResolvedValue({});

    // Act
    const result = await createOperatorInviteToken('group-xyz');
    const decoded = jwt.decode(result.token) as jwt.JwtPayload;

    // Assert
    expect(decoded.groupId).toBe('group-xyz');
    expect(decoded.type).toBe('operator_invite');
  });

  it('존재하지 않는 groupId 시 AppError 404 발생함', async () => {
    // Arrange — 빈 배열 반환으로 세션 없음 시뮬레이션
    (mockSession.find as jest.Mock).mockResolvedValue([]);

    // Act & Assert
    await expect(
      createOperatorInviteToken('nonexistent-group')
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('groupId 존재 시 Session.updateMany가 DUAL_2PC로 호출됨', async () => {
    // Arrange
    (mockSession.find as jest.Mock).mockResolvedValue([
      { groupId: 'group-abc' },
    ]);
    (mockSession.updateMany as jest.Mock).mockResolvedValue({});

    // Act
    await createOperatorInviteToken('group-abc');

    // Assert
    expect(mockSession.updateMany).toHaveBeenCalledWith(
      { groupId: 'group-abc' },
      { experimentMode: 'DUAL_2PC' }
    );
  });
});
