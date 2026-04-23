/**
 * experiment.ts — 실험 모드 상수 정의
 *
 * DUAL: 2PC 동시 측정 모드 (기본값)
 * BTI: BTI 전용 측정 모드
 * SEQUENTIAL: 1PC 시분할 측정 모드 (Phase 14 P2)
 * DUAL_2PC: 2PC 타임스탬프 정렬 측정 모드 (Phase 16)
 */

export const EXPERIMENT_MODES = {
  DUAL: 'DUAL',
  BTI: 'BTI',
  SEQUENTIAL: 'SEQUENTIAL', // 시분할 측정 (1PC 환경, Phase 14 P2)
  DUAL_2PC: 'DUAL_2PC', // Phase 16
} as const;

export type ExperimentMode =
  (typeof EXPERIMENT_MODES)[keyof typeof EXPERIMENT_MODES];
