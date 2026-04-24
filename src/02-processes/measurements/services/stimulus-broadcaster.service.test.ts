/**
 * stimulus-broadcaster.service.ts — Unit 테스트 (BE-4)
 *
 * 검증 항목:
 *   - broadcast(groupId) 호출 시 SocketService.emitToGroup이
 *     (groupId, 'stimulus_start', { groupId, timestamp_ms }) 인자로 호출됨
 *   - timestamp_ms가 서버 Date.now() 기반 숫자임
 */

import { stimulusBroadcasterService } from './stimulus-broadcaster.service';

// SocketService 모킹 — 실제 Socket.io 초기화 없이 호출 인자 검증
jest.mock('@07-shared/lib/socket', () => ({
  SocketService: {
    emitToGroup: jest.fn(),
  },
}));

import { SocketService } from '@07-shared/lib/socket';

const mockEmitToGroup = SocketService.emitToGroup as jest.Mock;

describe('stimulusBroadcasterService.broadcast — BE-4', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("emitToGroup(groupId, 'stimulus_start', { groupId, timestamp_ms }) 호출됨", async () => {
    // Arrange
    const groupId = 'grp-test-001';
    const before = Date.now();

    // Act
    await stimulusBroadcasterService.broadcast(groupId);

    const after = Date.now();

    // Assert
    expect(mockEmitToGroup).toHaveBeenCalledTimes(1);

    const [calledGroupId, calledEvent, calledPayload] =
      mockEmitToGroup.mock.calls[0];
    expect(calledGroupId).toBe(groupId);
    expect(calledEvent).toBe('stimulus_start');
    expect(calledPayload.groupId).toBe(groupId);
    expect(typeof calledPayload.timestamp_ms).toBe('number');
    // timestamp_ms가 호출 시각 범위 내임 (서버 Date.now() 기반)
    expect(calledPayload.timestamp_ms).toBeGreaterThanOrEqual(before);
    expect(calledPayload.timestamp_ms).toBeLessThanOrEqual(after);
  });

  it('서로 다른 groupId에 대해 각각 별도 emitToGroup 호출됨', async () => {
    // Arrange
    const groupId1 = 'grp-001';
    const groupId2 = 'grp-002';

    // Act
    await stimulusBroadcasterService.broadcast(groupId1);
    await stimulusBroadcasterService.broadcast(groupId2);

    // Assert
    expect(mockEmitToGroup).toHaveBeenCalledTimes(2);
    expect(mockEmitToGroup.mock.calls[0][0]).toBe(groupId1);
    expect(mockEmitToGroup.mock.calls[1][0]).toBe(groupId2);
  });

  it('payload의 timestamp_ms는 숫자형임 (ADR-004 서버 타임스탬프 단일 진실)', async () => {
    // Act
    await stimulusBroadcasterService.broadcast('grp-any');

    // Assert
    const [, , payload] = mockEmitToGroup.mock.calls[0];
    expect(Number.isInteger(payload.timestamp_ms)).toBe(true);
  });
});
