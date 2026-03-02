import { Request, Response, NextFunction } from 'express';
import {
  createGroupSessionProcess,
  pairDeviceProcess,
} from '@05-features/sessions/services/pairing.service';
import { submitConsentProcess } from '@05-features/sessions/services/submit-consent.service';
import { AppError } from '@07-shared/errors';
import {
  pairDeviceSchema,
  submitConsentSchema,
} from '@05-features/sessions/dto/session.dto';
import { Session } from '@06-entities/sessions';

/**
 * [Controller] 새로운 그룹 세션 또는 그룹 내 추가 세션 생성 수행함
 */
export const createSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { groupId } = req.body; // 기존 그룹에 추가할 경우 groupId를 본문에서 받음

    // 비즈니스 프로세스 호출하여 세션 생성 수행함
    const newSession = await createGroupSessionProcess(groupId);

    res.status(201).json({
      status: 'success',
      data: {
        groupId: newSession.groupId,
        subjectIndex: newSession.subjectIndex,
        pairingToken: newSession.pairingToken,
        sessionId: newSession._id,
        expiresAt: newSession.expiresAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * [Controller] 특정 그룹의 모든 세션 참가 상태 조회 수행함
 */
export const checkGroupStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { groupId } = req.params;

    // 해당 그룹 ID를 가진 모든 세션 조회 수행함
    const sessions = await Session.find({ groupId });

    // 프론트엔드 위젯 표시를 위한 데이터 가공 수행함
    const status = sessions.map((s) => ({
      subjectIndex: s.subjectIndex,
      status: s.status,
      guestJoined: s.status === 'PAIRED' || s.status === 'MEASURING',
    }));

    res.status(200).json({
      status: 'success',
      data: { groupId, sessions: status },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * [Controller] 모바일 기기 페어링 요청 처리함
 */
export const pairDevice = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedRequest = pairDeviceSchema.parse({ params: req.params });
    const { pairingToken } = validatedRequest.params;

    // 유저 존재 여부 체크 (Type Guard)
    if (!req.user || !req.user.id) {
      throw new AppError('인증이 필요한 서비스입니다.', 401);
    }

    const userId = req.user.id;

    // 서비스 로직 호출하여 페어링 상태 업데이트 수행함
    const session = await pairDeviceProcess(pairingToken, userId);

    res.status(200).json({
      status: 'success',
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * [Controller] 피실험자 동의서 제출 처리함
 */
export const submitConsent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validated = submitConsentSchema.parse({
      body: req.body,
      params: req.params,
    });
    const { sessionId } = validated.params;
    const { versionId, isResearchAgreed } = validated.body;

    if (!req.user) throw new AppError('인증이 필요합니다.', 401);

    const consent = await submitConsentProcess({
      sessionId,
      userId: req.user.id,
      versionId,
      isResearchAgreed,
    });

    res.status(201).json({ status: 'success', data: consent });
  } catch (error) {
    next(error);
  }
};
