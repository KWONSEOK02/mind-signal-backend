/**
 * errors.ts — 세션 도메인 전용 에러 클래스 정의
 *
 * Mongoose / Redis / Socket.io 등 외부 의존 0건 (순수 도메인 layer).
 * 응용 서비스(PairSubjectService)가 본 에러를 잡아 AppError로 매핑함.
 */

import type { SessionStatus } from '../types/session.types';

/**
 * InvariantViolationError — 단일 Session 도큐먼트 차원의 불변식이 깨졌을 때 발생함.
 *
 * 예시: SessionAggregate.create() 호출 시 pairingToken === '' 또는 subjectIndex < 1.
 * 그룹 단위 invariant(같은 groupId의 subjectIndex unique)는 본 에러 책임 외 — Mongoose 인덱스가 enforce함.
 */
export class InvariantViolationError extends Error {
  public readonly name = 'InvariantViolationError';

  constructor(reason: string) {
    super(`Session aggregate invariant violated: ${reason}`);
    Object.setPrototypeOf(this, InvariantViolationError.prototype);
  }
}

/**
 * InvalidStatusTransitionError — 허용되지 않은 상태 전이를 시도했을 때 발생함.
 *
 * 예시: COMPLETED에서 markMeasuring() 호출 / 만료된 CREATED에서 PAIRED 전이 시도.
 * 응용 서비스가 본 에러를 잡아 만료 시 AppError 401, 그 외 전이 불가 시 AppError 400으로 매핑함.
 */
export class InvalidStatusTransitionError extends Error {
  public readonly name = 'InvalidStatusTransitionError';
  public readonly from: SessionStatus;
  public readonly to: SessionStatus;

  constructor(from: SessionStatus, to: SessionStatus) {
    super(`Invalid status transition: ${from} -> ${to}`);
    this.from = from;
    this.to = to;
    Object.setPrototypeOf(this, InvalidStatusTransitionError.prototype);
  }
}
