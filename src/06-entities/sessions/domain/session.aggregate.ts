/**
 * session.aggregate.ts — Session 도메인 통합체 (Aggregate Root)
 *
 * Vernon 2011 "Effective Aggregate Design Part I" 단일 aggregate 패턴 적용함.
 * 단일 Session 도큐먼트 = 1 aggregate = 1 트랜잭션 단위.
 * 그룹 invariant(groupId+subjectIndex unique)는 본 클래스 책임 외 — Mongoose 인덱스가 enforce함.
 *
 * Pure TypeScript — Mongoose / Redis / Socket.io 의존 0건 (depcruise R-DDD-1/R-DDD-2 통과).
 * SessionStatus는 ../types/session.types에서 import (schema 직접 import 0건).
 */

import type { SessionStatus, ExperimentMode } from '../types/session.types';
import {
  InvariantViolationError,
  InvalidStatusTransitionError,
} from './errors';

/** SessionAggregate.create() factory 입력 인자 7종 */
export interface SessionAggregateCreateParams {
  id: string;
  groupId: string;
  subjectIndex: number;
  pairingToken: string;
  operatorId: string | null;
  mode: ExperimentMode;
  expiresAt: Date;
}

/** SessionAggregate.fromDocument() 입력 인자 (DB 도큐먼트 → 통합체 변환용) */
export interface SessionAggregateDocumentFields {
  _id: string;
  groupId: string;
  subjectIndex: number | null; // DB legacy 도큐먼트 null 허용 — fromDocument에서 invariant 검증함
  pairingToken: string;
  creatorId: string | null;
  experimentMode: ExperimentMode;
  expiresAt: Date;
  status: SessionStatus;
  userId: string | null;
  pairedAt: Date | null;
}

/** 세션 취소 사유 (Session schema stopReason 정합) */
export type CancelReason =
  | 'Natural'
  | 'ManualEarly'
  | 'HeadsetLost'
  | 'ProcessError';

export class SessionAggregate {
  private constructor(
    private readonly _id: string,
    private readonly _groupId: string,
    private readonly _subjectIndex: number,
    private readonly _pairingToken: string,
    private readonly _operatorId: string | null,
    private readonly _mode: ExperimentMode,
    private readonly _expiresAt: Date,
    private _status: SessionStatus,
    private _userId: string | null,
    private _pairedAt: Date | null
  ) {}

  /**
   * Static factory — invariant 검증 강제함.
   *
   * @throws InvariantViolationError pairingToken === '' 또는 subjectIndex < 1
   */
  static create(params: SessionAggregateCreateParams): SessionAggregate {
    if (!params.pairingToken) {
      throw new InvariantViolationError('empty pairing token');
    }
    if (params.subjectIndex < 1) {
      throw new InvariantViolationError(
        `subjectIndex must be >= 1, got ${params.subjectIndex}`
      );
    }
    return new SessionAggregate(
      params.id,
      params.groupId,
      params.subjectIndex,
      params.pairingToken,
      params.operatorId,
      params.mode,
      params.expiresAt,
      'CREATED',
      null,
      null
    );
  }

  /** DB 도큐먼트 → 통합체 변환 — Repository 내부에서만 호출함 */
  static fromDocument(doc: SessionAggregateDocumentFields): SessionAggregate {
    if (!doc.pairingToken) {
      throw new InvariantViolationError('empty pairing token');
    }
    if (doc.subjectIndex == null || doc.subjectIndex < 1) {
      throw new InvariantViolationError(
        `subjectIndex must be >= 1, got ${doc.subjectIndex}`
      );
    }
    return new SessionAggregate(
      doc._id,
      doc.groupId,
      doc.subjectIndex,
      doc.pairingToken,
      doc.creatorId,
      doc.experimentMode,
      doc.expiresAt,
      doc.status,
      doc.userId,
      doc.pairedAt
    );
  }

  /**
   * 피실험자를 세션에 연결함 — CREATED → PAIRED 전이.
   *
   * 호출자는 `now` Date를 1회 관찰하여 본 메서드 + `isExpired` + event timestamp에
   * 동일 Date를 전달함. ADR-007 정합 — race condition 차단을 위해 한 호출 단위 내
   * 시간 결정성 유지함.
   *
   * @param userId 페어링할 피실험자 ID
   * @param now 호출자가 1회 관찰한 현재 시각
   * @throws InvalidStatusTransitionError 만료(isExpired) 또는 status !== 'CREATED'
   */
  pair(userId: string, now: Date): void {
    if (this.isExpired(now)) {
      throw new InvalidStatusTransitionError(this._status, 'EXPIRED');
    }
    if (this._status !== 'CREATED') {
      throw new InvalidStatusTransitionError(this._status, 'PAIRED');
    }
    this._status = 'PAIRED';
    this._userId = userId;
    this._pairedAt = now;
  }

  /** PAIRED → MEASURING — 본 단계 시연 외, 메서드 골조만 */
  markMeasuring(): void {
    if (this._status !== 'PAIRED') {
      throw new InvalidStatusTransitionError(this._status, 'MEASURING');
    }
    this._status = 'MEASURING';
  }

  /** MEASURING → COMPLETED — 본 단계 시연 외 */
  complete(): void {
    if (this._status !== 'MEASURING') {
      throw new InvalidStatusTransitionError(this._status, 'COMPLETED');
    }
    this._status = 'COMPLETED';
  }

  /** CREATED → EXPIRED — 만료 처리, PairSubjectService 흐름에서 호출함 */
  expire(): void {
    if (this._status !== 'CREATED') {
      throw new InvalidStatusTransitionError(this._status, 'EXPIRED');
    }
    this._status = 'EXPIRED';
  }

  /** * → CANCELLED — 종착 상태에서는 호출 불가 */
  cancel(_reason: CancelReason): void {
    if (
      this._status === 'COMPLETED' ||
      this._status === 'EXPIRED' ||
      this._status === 'CANCELLED'
    ) {
      throw new InvalidStatusTransitionError(this._status, 'CANCELLED');
    }
    this._status = 'CANCELLED';
  }

  /**
   * 만료 여부 — expiresAt < 주입된 시각.
   *
   * 호출자가 1회 관찰한 `now`를 전달함. SA가 자체 `Date.now()`를 호출하지 않으므로
   * 호출 단위 내 시간 결정성 보장 + test에서 FixedClock 주입으로 분기 결정적 재현 가능.
   */
  isExpired(now: Date): boolean {
    return this._expiresAt.getTime() < now.getTime();
  }

  // ===== getters =====
  get id(): string {
    return this._id;
  }
  get groupId(): string {
    return this._groupId;
  }
  get subjectIndex(): number {
    return this._subjectIndex;
  }
  get pairingToken(): string {
    return this._pairingToken;
  }
  get operatorId(): string | null {
    return this._operatorId;
  }
  get mode(): ExperimentMode {
    return this._mode;
  }
  get expiresAt(): Date {
    return this._expiresAt;
  }
  get status(): SessionStatus {
    return this._status;
  }
  get userId(): string | null {
    return this._userId;
  }
  get pairedAt(): Date | null {
    return this._pairedAt;
  }
}
