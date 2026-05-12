/**
 * session.aggregate.test.ts — SessionAggregate 단위 테스트
 *
 * Mongoose / Redis / mongodb-memory-server 의존 0건 — 순수 도메인 단위 테스트.
 * DOMAIN-MODEL-NOTES §3.1 정합 / PLAN rev.3 §6.2 시나리오 8건.
 */

import { SessionAggregate } from './session.aggregate';
import {
  InvariantViolationError,
  InvalidStatusTransitionError,
} from './errors';

describe('SessionAggregate', () => {
  const baseParams = (
    override: Partial<Parameters<typeof SessionAggregate.create>[0]> = {}
  ) => ({
    id: 'session-id-1',
    groupId: 'A1B2C3D4',
    subjectIndex: 1,
    pairingToken: 'TOK001',
    operatorId: 'operator-1',
    mode: 'SEQUENTIAL' as const,
    expiresAt: new Date(Date.now() + 60_000), // 1분 뒤 만료
    ...override,
  });

  describe('create()', () => {
    test('1. happy path — SEQUENTIAL 모드 + 유효 인자 → 상태 CREATED', () => {
      const aggregate = SessionAggregate.create(baseParams());
      expect(aggregate.status).toBe('CREATED');
      expect(aggregate.id).toBe('session-id-1');
      expect(aggregate.groupId).toBe('A1B2C3D4');
      expect(aggregate.subjectIndex).toBe(1);
      expect(aggregate.pairingToken).toBe('TOK001');
      expect(aggregate.operatorId).toBe('operator-1');
      expect(aggregate.mode).toBe('SEQUENTIAL');
      expect(aggregate.userId).toBeNull();
      expect(aggregate.pairedAt).toBeNull();
    });

    test('2. invariant 위반 — empty pairingToken → InvariantViolationError', () => {
      expect(() =>
        SessionAggregate.create(baseParams({ pairingToken: '' }))
      ).toThrow(InvariantViolationError);
    });

    test('3. invariant 위반 — subjectIndex < 1 → InvariantViolationError', () => {
      expect(() =>
        SessionAggregate.create(baseParams({ subjectIndex: 0 }))
      ).toThrow(InvariantViolationError);
      expect(() =>
        SessionAggregate.create(baseParams({ subjectIndex: -1 }))
      ).toThrow(InvariantViolationError);
    });
  });

  describe('pair()', () => {
    test('4. happy path — CREATED + 미만료 → PAIRED + userId 바인딩', () => {
      const aggregate = SessionAggregate.create(baseParams());
      const userId = 'user-bob';
      const before = Date.now();
      aggregate.pair(userId);
      const after = Date.now();

      expect(aggregate.status).toBe('PAIRED');
      expect(aggregate.userId).toBe(userId);
      expect(aggregate.pairedAt).not.toBeNull();
      const pairedTime = aggregate.pairedAt!.getTime();
      expect(pairedTime).toBeGreaterThanOrEqual(before);
      expect(pairedTime).toBeLessThanOrEqual(after);
    });

    test('5. 실패 — isExpired() === true → InvalidStatusTransitionError', () => {
      const aggregate = SessionAggregate.create(
        baseParams({ expiresAt: new Date(Date.now() - 1000) }) // 이미 만료됨
      );
      expect(() => aggregate.pair('user-bob')).toThrow(
        InvalidStatusTransitionError
      );
      // 상태는 그대로 CREATED (만료 처리는 별도 expire() 호출 책임)
      expect(aggregate.status).toBe('CREATED');
    });

    test('6. 실패 — status === PAIRED에서 재호출 → InvalidStatusTransitionError', () => {
      const aggregate = SessionAggregate.create(baseParams());
      aggregate.pair('user-bob');
      expect(() => aggregate.pair('user-charlie')).toThrow(
        InvalidStatusTransitionError
      );
      // userId는 첫 페어링 그대로 유지됨
      expect(aggregate.userId).toBe('user-bob');
    });
  });

  describe('markMeasuring() & cancel()', () => {
    test('7. markMeasuring() 실패 — CREATED에서 호출 → InvalidStatusTransitionError', () => {
      const aggregate = SessionAggregate.create(baseParams());
      expect(() => aggregate.markMeasuring()).toThrow(
        InvalidStatusTransitionError
      );
      expect(aggregate.status).toBe('CREATED');
    });

    test('8. cancel() happy — PAIRED에서 CANCELLED 전이', () => {
      const aggregate = SessionAggregate.create(baseParams());
      aggregate.pair('user-bob');
      aggregate.cancel('ManualEarly');
      expect(aggregate.status).toBe('CANCELLED');
    });
  });
});
