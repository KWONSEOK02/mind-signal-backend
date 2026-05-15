export type { Clock } from './clock';
export { SystemClock } from './system-clock';
export { FixedClock } from './fixed-clock';

import { SystemClock } from './system-clock';
import type { Clock } from './clock';

/**
 * Production singleton 인스턴스 — session.controller 단일 import 허용 (ADR-008 §1)
 * 레이어 제약: services/entities import 금지
 */
export const systemClock: Clock = new SystemClock();
