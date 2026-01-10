import { Request, Response, NextFunction } from 'express';
import * as surveyService from '@05-features/surveys/services/survey.service';
import { AuthedRequest } from '@07-shared/types';

//모든 설문 문항 조회
export const getQuestions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const questions = await surveyService.getSurveyQuestions();

    res.status(200).json({
      status: 'success',
      data: questions,
    });
  } catch (err) {
    next(err); // 서비스에서 던진 AppError(404 등)가 중앙 핸들러로 전달됨
  }
};

export const submitResponses = async (
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id; // 인증 미들웨어에서 주입됨
    const result = await surveyService.saveSurveyResponses(userId, req.body);

    res.status(201).json({
      status: 'success',
      data: { count: result.length },
    });
  } catch (err) {
    next(err);
  }
};

//내 설문 응답 조회
export const getUserResponses = async (
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const responses = await surveyService.getUserResponses(userId);

    res.status(200).json({
      status: 'success',
      data: responses,
    });
  } catch (err) {
    next(err);
  }
};
