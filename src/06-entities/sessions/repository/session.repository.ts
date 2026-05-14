/**
 * session.repository.ts — SessionAggregate ↔ Mongoose Session 도큐먼트 양방향 변환 어댑터
 *
 * Stemmler 2019 "How to Design & Persist Aggregates" strangler 패턴 적용함.
 * 도메인 통합체(순수 클래스)와 Mongoose Model(DB 영속) 사이의 단일 변환 지점.
 * 응용 서비스(PairSubjectService)가 본 Repository만 호출 — Mongoose Model 직접 사용 0건.
 *
 * FSD 06-entities 레이어 — domain/ 으로의 import 0건 (역방향 import 금지, depcruise 통과).
 */

import { Types } from 'mongoose';
import { Session } from '../model/session.schema';
import { SessionAggregate } from '../domain/session.aggregate';
import type { SessionDoc, SessionStatus } from '../model/session.schema';

export class SessionRepository {
  /**
   * ID로 세션 조회 후 SessionAggregate로 변환함.
   * @returns 미존재 시 null 반환
   */
  async findById(id: string): Promise<SessionAggregate | null> {
    const doc = await Session.findById(id);
    return doc ? this.toAggregate(doc) : null;
  }

  /**
   * 페어링 토큰으로 세션 조회 후 SessionAggregate로 변환함.
   * 기존 pairing.service.ts::pairDeviceProcess L94의 Session.findOne({pairingToken}) 어댑터.
   * @returns 미존재 시 null 반환
   */
  async findByPairingToken(token: string): Promise<SessionAggregate | null> {
    const doc = await Session.findOne({ pairingToken: token });
    return doc ? this.toAggregate(doc) : null;
  }

  /**
   * 통합체의 현재 상태를 DB에 영속화함 (기존 도큐먼트 갱신).
   * 신규 도큐먼트 생성은 saveNew()를 사용함.
   */
  async save(aggregate: SessionAggregate): Promise<void> {
    const fields = this.toDocumentFields(aggregate);
    await Session.findByIdAndUpdate(aggregate.id, fields, { upsert: false });
  }

  /** 새 통합체를 DB에 신규 저장함 (Session.create()). */
  async saveNew(aggregate: SessionAggregate): Promise<void> {
    const fields = this.toDocumentFields(aggregate);
    await Session.create({
      _id: this.toObjectId(aggregate.id),
      pairingToken: aggregate.pairingToken,
      expiresAt: aggregate.expiresAt,
      experimentMode: aggregate.mode,
      ...fields,
    });
  }

  /** Mongoose 도큐먼트 → SessionAggregate 변환함 */
  private toAggregate(doc: SessionDoc): SessionAggregate {
    return SessionAggregate.fromDocument({
      _id: String(doc._id),
      groupId: doc.groupId,
      subjectIndex: doc.subjectIndex ?? 0,
      pairingToken: doc.pairingToken,
      creatorId: doc.creatorId ? String(doc.creatorId) : null,
      experimentMode: doc.experimentMode,
      expiresAt: doc.expiresAt,
      status: doc.status,
      userId: doc.userId ? String(doc.userId) : null,
      pairedAt: doc.pairedAt,
    });
  }

  /**
   * SessionAggregate → Mongoose 도큐먼트 갱신 필드로 변환함.
   * save()는 본 결과만, saveNew()는 본 결과 + pairingToken/expiresAt/experimentMode 추가.
   */
  private toDocumentFields(aggregate: SessionAggregate): {
    groupId: string;
    subjectIndex: number;
    creatorId: Types.ObjectId | null;
    status: SessionStatus;
    userId: Types.ObjectId | null;
    pairedAt: Date | null;
  } {
    return {
      groupId: aggregate.groupId,
      subjectIndex: aggregate.subjectIndex,
      creatorId: aggregate.operatorId
        ? this.toObjectId(aggregate.operatorId)
        : null,
      status: aggregate.status,
      userId: aggregate.userId ? this.toObjectId(aggregate.userId) : null,
      pairedAt: aggregate.pairedAt,
    };
  }

  /** 문자열 ID → Mongoose ObjectId 변환함 (유효성 검증은 호출 측 책임) */
  private toObjectId(id: string): Types.ObjectId {
    return new Types.ObjectId(id);
  }
}
