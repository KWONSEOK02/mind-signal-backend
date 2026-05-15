export * from './model/session.schema';
export { SessionAggregate } from './domain/session.aggregate';
export type {
  SessionAggregateCreateParams,
  SessionAggregateDocumentFields,
  CancelReason,
} from './domain/session.aggregate';
export type { SessionPairedEvent } from './domain/session.event';
export {
  InvariantViolationError,
  InvalidStatusTransitionError,
} from './domain/errors';
export { SessionRepository } from './repository/session.repository';

import { SessionRepository } from './repository/session.repository';

/**
 * Production singleton 인스턴스 — session.controller에서 import함 (ADR-008 §1).
 * Stateless wrapper — 인스턴스 상태 0건.
 */
export const sessionRepository = new SessionRepository();

export {
  aggregateToPairingResponseDto,
  type PairingResponseDto,
} from './mappers/aggregate-to-response-dto';
