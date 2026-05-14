/**
 * Clock port — 시간 관찰 seam.
 *
 * SessionAggregate.isExpired/pair 및 PairSubjectService.execute가 직접 `Date.now()` /
 * `new Date()`를 호출하지 않고 본 인터페이스를 통해 시간을 관찰함. 한 `execute()` 호출
 * 단위 내 시간 결정성 보장 + test에서 FixedClock 주입을 통해 시간 분기 결정적 재현 가능.
 *
 * 출처: ADR-007 (Phase H deep-module-poc A-7 race 후속, 이슈 #52).
 */
export interface Clock {
  /** 현재 시각을 Date 객체로 반환함 */
  now(): Date;
}
