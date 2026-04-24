import { SocketService } from '@07-shared/lib/socket';

/**
 * DUAL_2PC 모드 자극 시작 이벤트 브로드캐스트 서비스 (plan-review H-2, v7 C-2 경로).
 * groupId room에 `stimulus_start` 이벤트 전송 + 서버 타임스탬프 포함함.
 */
export const stimulusBroadcasterService = {
  /**
   * groupId room에 stimulus_start 이벤트 브로드캐스트함.
   * 서버 측 `Date.now()`를 timestamp_ms로 사용하여 단일 진실 기준 보장함 (ADR-004).
   * payload 필드명 timestamp_ms는 FE Socket.io 계약 (snake_case 유지 필수).
   *
   * @param groupId - 대상 실험 그룹 ID
   */
  async broadcast(groupId: string): Promise<void> {
    // eslint-disable-next-line camelcase
    const timestamp_ms = Date.now();
    SocketService.emitToGroup(groupId, 'stimulus_start', {
      groupId,
      // eslint-disable-next-line camelcase
      timestamp_ms,
    });
  },
};
