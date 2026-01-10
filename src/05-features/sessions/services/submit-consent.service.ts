import { Session } from '@06-entities/sessions';
import { Consent } from '@06-entities/consents';
import { AppError } from '@07-shared/errors';

/**
 * Phase 1.5: 동의서 제출 및 스냅샷 생성
 * 1. 세션 상태 확인 (PAIRED 상태여야 함)
 * 2. Consent 레코드 생성 (Note B 규칙: 이후 모든 데이터는 이 consentId를 참조)
 */
export const submitConsentProcess = async (params: {
  sessionId: string;
  userId: string;
  versionId: string;
  isResearchAgreed: boolean;
}) => {
  const { sessionId, userId, versionId, isResearchAgreed } = params;

  // 1. 세션 존재 및 상태 확인
  const session = await Session.findById(sessionId);
  if (!session) throw new AppError('세션을 찾을 수 없습니다.', 404);
  if (session.status !== 'PAIRED') {
    throw new AppError(
      '페어링되지 않은 세션에서는 동의를 진행할 수 없습니다.',
      400
    );
  }

  // 2. Consent 레코드 생성 (스냅샷)
  const newConsent = new Consent({
    userId,
    versionId,
    isResearchAgreed,
  });

  await newConsent.save();

  // (선택) 동의 완료 후 세션 상태를 다음 단계(예: READY 또는 MEASURING 준비)로 관리할 수 있음
  return newConsent;
};
