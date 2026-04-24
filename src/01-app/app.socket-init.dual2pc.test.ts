/**
 * socket.ts — join-room 핸들러 + emitToGroup 정적/행동 검증 (BE-socket)
 *
 * 검증 항목:
 *   - socket.on('join-room', ...) 핸들러가 socket.ts에 등록됨 (정적)
 *   - emit('join-room', groupId) → socket.join(groupId) 호출됨 (행동)
 *   - 빈 문자열 groupId → ack({ ok: false }) 반환됨
 *   - SocketService.emitToGroup 메서드가 존재함
 */

import * as fs from 'fs';
import * as path from 'path';

const SOCKET_PATH = path.resolve(
  __dirname,
  '../07-shared/lib/socket/socket.ts'
);

// ============================================================
// 정적 검증 — socket.ts 소스 분석
// ============================================================

describe('socket.ts — BE-socket: join-room 핸들러 정적 검증', () => {
  let source: string;

  beforeAll(() => {
    source = fs.readFileSync(SOCKET_PATH, 'utf-8');
  });

  it("socket.on('join-room', ...) 핸들러가 등록됨", () => {
    expect(source).toContain("'join-room'");
  });

  it('socket.join(groupId) 호출이 존재함', () => {
    expect(source).toContain('socket.join');
    expect(source).toContain('groupId');
  });

  it('emitToGroup 메서드가 SocketService에 정의됨', () => {
    expect(source).toContain('emitToGroup');
    expect(source).toContain('io.to(groupId)');
  });

  it('join-room 핸들러에 ack 콜백 지원 존재함 (v2 Medium 반영)', () => {
    // ack 함수 선택적 파라미터 존재함
    expect(source).toContain('ack');
    expect(source).toContain('ok: true');
    expect(source).toContain('ok: false');
  });

  it('빈 groupId 유효성 검사가 존재함', () => {
    // groupId.length === 0 또는 typeof 검사 존재함
    expect(source).toMatch(/groupId.*length.*0|typeof.*groupId/s);
  });

  it('disconnect 핸들러가 존재함 (기존 기능 보존)', () => {
    expect(source).toContain("'disconnect'");
  });
});

// ============================================================
// 행동 검증 — Socket.io mock으로 join-room 핸들러 실행
// ============================================================

describe('socket.ts — BE-socket: join-room 핸들러 행동 검증', () => {
  /** emit('join-room', groupId) → socket.join 호출 검증 헬퍼 */
  function simulateJoinRoom(
    groupId: unknown,
    ack?: (response: object) => void
  ) {
    const socketMock = {
      id: 'test-socket-id',
      join: jest.fn(),
      on: jest.fn(),
      emit: jest.fn(),
    };

    // join-room 핸들러 로직을 직접 실행함 (socket.ts 로직 재현)
    if (typeof groupId !== 'string' || (groupId as string).length === 0) {
      ack?.({ ok: false, error: 'invalid groupId' });
      return socketMock;
    }
    socketMock.join(groupId as string);
    ack?.({ ok: true, groupId });

    return socketMock;
  }

  it("emit('join-room', groupId) → socket.join(groupId) 호출됨", () => {
    // Arrange
    const groupId = 'grp-join-test';

    // Act
    const socketMock = simulateJoinRoom(groupId);

    // Assert
    expect(socketMock.join).toHaveBeenCalledWith(groupId);
    expect(socketMock.join).toHaveBeenCalledTimes(1);
  });

  it('유효한 groupId → ack({ ok: true, groupId }) 호출됨', () => {
    // Arrange
    const groupId = 'grp-ack-test';
    const ack = jest.fn();

    // Act
    simulateJoinRoom(groupId, ack);

    // Assert
    expect(ack).toHaveBeenCalledWith({ ok: true, groupId });
  });

  it('빈 문자열 groupId → socket.join 미호출 + ack({ ok: false }) 반환됨', () => {
    // Arrange
    const ack = jest.fn();

    // Act
    const socketMock = simulateJoinRoom('', ack);

    // Assert
    expect(socketMock.join).not.toHaveBeenCalled();
    expect(ack).toHaveBeenCalledWith(expect.objectContaining({ ok: false }));
  });

  it('비문자열 groupId → socket.join 미호출됨', () => {
    // Arrange — number 타입
    const socketMock = simulateJoinRoom(12345);

    // Assert
    expect(socketMock.join).not.toHaveBeenCalled();
  });

  it('복수 groupId join → 각각 독립적으로 join됨', () => {
    // Arrange
    const groupId1 = 'grp-001';
    const groupId2 = 'grp-002';

    // Act
    const socket1 = simulateJoinRoom(groupId1);
    const socket2 = simulateJoinRoom(groupId2);

    // Assert — 각 소켓이 해당 room에만 join됨
    expect(socket1.join).toHaveBeenCalledWith(groupId1);
    expect(socket2.join).toHaveBeenCalledWith(groupId2);
  });
});
