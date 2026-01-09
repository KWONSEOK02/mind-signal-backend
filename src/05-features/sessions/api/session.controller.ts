import { Request, Response, NextFunction } from 'express';
import { pairDeviceProcess } from '@05-features/sessions/services/pairing.service';
import { submitConsentProcess } from '@05-features/sessions/services/submit-consent.service';
import { AppError } from '@07-shared/errors';
import { pairDeviceSchema } from '@05-features/sessions/dto/session.dto'; //DTO 임포트
import { submitConsentSchema } from '@05-features/sessions/dto/session.dto';
import { Session } from '@06-entities/sessions';
import crypto from 'crypto';

export const createSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 6자리 혹은 특정 길이의 무작위 토큰 생성
    const pairingToken = crypto.randomBytes(3).toString('hex').toUpperCase();

    const newSession = new Session({
      pairingToken,
      status: 'CREATED',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5분 유효
    });

    await newSession.save();

    res.status(201).json({
      success: true,
      data: {
        pairingToken: newSession.pairingToken,
        sessionId: newSession._id,
        expiresAt: newSession.expiresAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const pairDevice = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('Current User Check:', req.user);
    //DTO를 사용한 입력값 검증 (Zod 활용)
    // req.params가 스키마에 정의된 형식을 따르는지 확인한다.
    const validatedRequest = pairDeviceSchema.parse({ params: req.params });
    const { pairingToken } = validatedRequest.params;

    // 3. 유저 존재 여부 체크 (Type Guard)
    if (!req.user || !req.user.id) {
      throw new AppError('인증이 필요한 서비스입니다.', 401);
    }

    const userId = req.user.id;

    // 4. 비즈니스 프로세스 호출
    const session = await pairDeviceProcess(pairingToken, userId);

    res.status(200).json({
      success: true,
      data: session,
    });
  } catch (error) {
    // Zod 검증 에러 등은 전역 에러 핸들러에서 400 에러로 처리하도록 넘긴다.
    next(error);
  }
};

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

    res.status(201).json({ success: true, data: consent });
  } catch (error) {
    next(error);
  }
};
