/**
 * session.types.ts — 세션 도메인 순수 타입 정의
 *
 * Mongoose / Redis / Socket.io 등 외부 의존 0건.
 * depcruise R-DDD-1 차단 대상 외 (정규식이 .schema$만 매칭하므로 .types$ 통과).
 *
 * - SessionStatus: 본 파일에서 단일 정의
 * - ExperimentMode: @07-shared/constants/experiment를 single source로 유지 (re-export만 제공, drift 회피)
 */

/** 세션 상태 6종 union — CLAUDE.md §7 박제 + session.schema.ts 정합 */
export type SessionStatus =
  | 'CREATED'
  | 'PAIRED'
  | 'MEASURING'
  | 'COMPLETED'
  | 'EXPIRED'
  | 'CANCELLED';

/**
 * ExperimentMode re-export — @07-shared/constants/experiment가 single source.
 * 본 파일은 도메인 layer가 동일 타입을 import할 때 경로 정합을 제공함.
 */
export type { ExperimentMode } from '@07-shared/constants/experiment';
