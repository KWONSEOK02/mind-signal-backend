import type { Clock } from './clock';

/**
 * Test adapter — 생성자 주입 Date를 호출마다 동일하게 반환함.
 *
 * Scenario 4 (Clock seam race) + Scenario 5 (single observed now) 결정성 보장에 필수임.
 * invalid Date 주입 시 TypeError를 즉시 throw하여 호출부 `toISOString()` 시점 RangeError
 * 전파를 차단함.
 */
export class FixedClock implements Clock {
  constructor(private readonly fixed: Date) {
    if (Number.isNaN(fixed.getTime())) {
      throw new TypeError('FixedClock requires a valid Date');
    }
  }

  now(): Date {
    return this.fixed;
  }
}
