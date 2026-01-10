import { SurveyQuestion } from '@06-entities/surveys';
import { SurveyResponse } from '@06-entities/surveys';
import { CreateSurveyResponsesDto } from '@05-features/surveys/dto/survey.dto';
import { AppError } from '@07-shared/errors';

/**
 * 설문 응답을 벌크 인서트로 저장한다.
 */
export const saveSurveyResponses = async (
  userId: string,
  data: CreateSurveyResponsesDto
) => {
  if (!data.responses || data.responses.length === 0) {
    throw new AppError('제출할 응답 데이터가 없습니다.', 400); // 400 에러 명시
  }
  const responsesToSave = data.responses.map((resp) => ({
    userId,
    questionId: resp.questionId,
    answerValue: resp.answerValue,
  }));

  // 2. 벌크 인서트 수행
  return await SurveyResponse.insertMany(responsesToSave);
};

/**
 * 모든 설문 문항 목록을 조회한다.
 */
export const getSurveyQuestions = async () => {
  const questions = await SurveyQuestion.find().sort({ createdAt: 1 });
  if (!questions || questions.length === 0) {
    throw new AppError('등록된 설문 문항을 찾을 수 없습니다.', 404); // 404 에러 명시
  }
  return questions;
};

/**
 * 특정 유저의 설문 응답 내역을 조회한다.
 */
export const getUserResponses = async (userId: string) => {
  const responses = await SurveyResponse.find({ userId }).populate(
    'questionId'
  );
  if (!responses || responses.length === 0) {
    throw new AppError('사용자의 설문 응답 내역이 존재하지 않습니다.', 404);
  }
  return responses;
};
