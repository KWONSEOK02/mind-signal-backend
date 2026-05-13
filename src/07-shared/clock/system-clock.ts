import type { Clock } from './clock';

/**
 * Production adapter — wall clock 기반 Date 반환함.
 *
 * 호출 시점 시각을 `new Date()`로 반환하므로 호출 간 시각이 진행함.
 * test에서는 본 클래스를 사용하지 말 것 — FixedClock으로 결정성 확보 필요.
 */
export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
