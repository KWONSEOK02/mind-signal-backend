/**
 * session.event.ts — 세션 도메인 이벤트 타입 정의
 *
 * Mongoose / Redis / Socket.io 등 외부 의존 0건 (순수 타입).
 * 발행 큐(pullDomainEvents) 미채택 (Phase E TS-Q17 A3 LOCK 정합).
 * 응용 서비스가 메모리 내 배열에 기록 + 기존 pairingListeners 호출 (LD-12 대안 D 통합)함.
 */

import type { ExperimentMode } from '../types/session.types';

/**
 * SessionPairedEvent — 피실험자가 세션에 합류했다는 사실을 표현함.
 *
 * 기존 pairing.service.ts pairingListeners callback({groupId, subjectIndex})와 정보 통합됨.
 */
export type SessionPairedEvent = {
  type: 'SessionPaired';
  sessionId: string;
  userId: string; // 페어링한 Subject의 userId (subjectId 명칭 미사용 — mind-signal 컨벤션)
  occurredAt: string; // ISO 8601
  groupId: string;
  subjectIndex: number;
  mode: ExperimentMode;
};
