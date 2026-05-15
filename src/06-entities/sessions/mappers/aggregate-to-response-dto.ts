import type { SessionAggregate } from '../domain/session.aggregate';

/**
 * 페어링 응답 DTO — 기존 Mongoose toJSON shape와 1:1 호환 매핑함.
 *
 * 매핑 규칙 (DISCUSS rev.3 Q3 매핑 테이블 정합):
 * - operatorId → creatorId (필드명 변환, string | null 보존)
 * - mode → experimentMode (필드명 변환)
 * - createdAt/updatedAt/__v 제외 (기존 toJSON hook 정합)
 * - measuredAt/stopReason/measuredDurationSeconds는 페어링 시점 null
 */
export interface PairingResponseDto {
  id: string;
  groupId: string;
  subjectIndex: number;
  pairingToken: string;
  creatorId: string | null;
  experimentMode: string;
  expiresAt: Date;
  status: string;
  userId: string | null;
  pairedAt: Date | null;
  measuredAt: null;
  stopReason: null;
  measuredDurationSeconds: null;
}

/**
 * SessionAggregate → PairingResponseDto 변환함.
 *
 * @param aggregate - 변환 대상 세션 통합체
 * @returns 페어링 응답 DTO — Mongoose toJSON shape 1:1 호환
 */
export function aggregateToPairingResponseDto(
  aggregate: SessionAggregate
): PairingResponseDto {
  return {
    id: aggregate.id,
    groupId: aggregate.groupId,
    subjectIndex: aggregate.subjectIndex,
    pairingToken: aggregate.pairingToken,
    creatorId: aggregate.operatorId,
    experimentMode: aggregate.mode,
    expiresAt: aggregate.expiresAt,
    status: aggregate.status,
    userId: aggregate.userId,
    pairedAt: aggregate.pairedAt,
    measuredAt: null,
    stopReason: null,
    measuredDurationSeconds: null,
  };
}
