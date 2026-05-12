/**
 * pair-subject.service.ts — 피실험자 페어링 응용 서비스 (Application Service)
 *
 * Phase G strangler 패턴 — 기존 pairing.service.ts::pairDeviceProcess(pairingToken, userId)와
 * 병렬 존재함. 동일 시그니처 + Repository 어댑터 경유 + 도메인 invariant 강제.
 *
 * execute({pairingToken, userId}) 5단계 흐름 (pairing.service.ts:83-138 정합):
 *   1. Types.ObjectId.isValid(userId) 형식 검증 → 실패 시 AppError 400
 *   2. repository.findByPairingToken(pairingToken) — 미존재 시 AppError 404
 *   3. aggregate.pair(userId) — 만료 시 expire() + save + AppError 401 / 전이 불가 시 AppError 400
 *   4. repository.save(aggregate) — 영속화
 *   5. SessionPairedEvent 메모리 기록 (recordedEvents)
 *
 * NOTE — 기존 pairingListeners (LD-12 대안 D) 통합 호출은 본 단계에서 제외함.
 *   이유: 기존 pairing.service.ts 수정 0건 의무 (G9) 보존 — listener Set을 외부 노출하려면
 *         기존 파일 수정 필요. 후속 controller 통합 PR에서 별도 결정 (헬퍼 export 또는
 *         controller 레벨에서 양쪽 fire).
 *   영향: 본 PairSubjectService를 직접 호출하는 경로(BDD 테스트)에서는 listener 미발화.
 *         기존 HTTP 라우트는 여전히 pairDeviceProcess 사용 — listener 발화 동작 보존.
 */

import { Types } from 'mongoose';
import {
  SessionRepository,
  SessionAggregate,
  InvalidStatusTransitionError,
} from '@06-entities/sessions';
import type { SessionPairedEvent } from '@06-entities/sessions';
import { AppError } from '@07-shared/errors';

/** PairSubjectService.execute() 입력 인자 */
export interface PairSubjectInput {
  pairingToken: string;
  userId: string;
}

/** PairSubjectService.execute() 결과 */
export interface PairSubjectResult {
  session: SessionAggregate;
  event: SessionPairedEvent;
}

export class PairSubjectService {
  private readonly repo: SessionRepository;
  private recordedEvents: SessionPairedEvent[] = [];

  constructor(repo?: SessionRepository) {
    this.repo = repo ?? new SessionRepository();
  }

  /**
   * 피실험자 페어링 한 번의 시도를 실행함.
   *
   * @throws AppError 400 — userId 형식 부정합 또는 status 전이 불가
   * @throws AppError 401 — 토큰 만료
   * @throws AppError 404 — 토큰 없음
   */
  async execute(input: PairSubjectInput): Promise<PairSubjectResult> {
    // 1. userId 형식 검증 (기존 pairDeviceProcess L88-90 정합)
    if (!Types.ObjectId.isValid(input.userId)) {
      throw new AppError('유효하지 않은 사용자 ID 형식입니다', 400);
    }

    // 2. 토큰으로 직접 조회 (기존 Session.findOne({pairingToken}) 어댑터)
    const aggregate = await this.repo.findByPairingToken(input.pairingToken);
    if (!aggregate) {
      throw new AppError('존재하지 않거나 유효하지 않은 토큰입니다', 404);
    }

    // 3. 도메인 메서드 호출 — 만료/전이 invariant 강제
    try {
      aggregate.pair(input.userId);
    } catch (err) {
      if (err instanceof InvalidStatusTransitionError) {
        // 만료 시 EXPIRED 영속화 + 401 throw (기존 pairing.service.ts L101-105 정합)
        if (aggregate.isExpired()) {
          aggregate.expire();
          await this.repo.save(aggregate);
          throw new AppError(
            '페어링 토큰이 만료되었습니다. 다시 시도해주세요.',
            401
          );
        }
        // 그 외 전이 불가 (이미 PAIRED 등) → 400 (기존 L108-112 정합)
        throw new AppError(
          `현재 세션 상태(${aggregate.status})에서는 페어링할 수 없습니다.`,
          400
        );
      }
      throw err;
    }

    // 4. 영속화
    await this.repo.save(aggregate);

    // 5. 도메인 이벤트 메모리 기록 (LD-12 listener 통합은 후속 controller 통합 PR로 분리함)
    const event: SessionPairedEvent = {
      type: 'SessionPaired',
      sessionId: aggregate.id,
      userId: input.userId,
      occurredAt: new Date().toISOString(),
      groupId: aggregate.groupId,
      subjectIndex: aggregate.subjectIndex,
      mode: aggregate.mode,
    };
    this.recordedEvents.push(event);

    return { session: aggregate, event };
  }

  /** 기록된 도메인 이벤트 목록을 반환하고 내부 버퍼를 비움 — 테스트 검증용 */
  drainRecordedEvents(): ReadonlyArray<SessionPairedEvent> {
    const events = [...this.recordedEvents];
    this.recordedEvents = [];
    return events;
  }
}
