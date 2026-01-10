export interface SurveyAnswerDto {
  questionId: string;
  answerValue: any; // 스키마의 Mixed 타입 수용
}

export interface CreateSurveyResponsesDto {
  responses: SurveyAnswerDto[];
}
