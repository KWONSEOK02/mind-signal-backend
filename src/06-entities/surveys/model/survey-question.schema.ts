import { Schema, model, Model, HydratedDocument } from 'mongoose';

/** 1. 문서 필드 타입 정의 (I 제거) */
export interface SurveyQuestion {
  category: string; // 문항 카테고리 (예: 'personality', 'interest')
  questionText: string; // 질문 내용
  answerType: string; // 답변 형식 (예: 'scale', 'choice')
}

export interface SurveyQuestionMethods {}

export type SurveyQuestionDoc = HydratedDocument<
  SurveyQuestion,
  SurveyQuestionMethods
>;
export type SurveyQuestionModel = Model<
  SurveyQuestion,
  {},
  SurveyQuestionMethods
>;

/** 2. 스키마 정의 */
const surveyQuestionSchema = new Schema<
  SurveyQuestion,
  SurveyQuestionModel,
  SurveyQuestionMethods
>(
  {
    category: { type: String, required: true },
    questionText: { type: String, required: true },
    answerType: { type: String, required: true },
  },
  {
    timestamps: true,
    collection: 'surveyQuestions', // 복수형 camelCase
  }
);

/** 3. JSON 변환 로직 */
surveyQuestionSchema.methods.toJSON = function () {
  const obj = this.toObject() as any;
  obj.id = obj._id;
  delete obj.updatedAt;
  delete obj.createdAt;
  delete obj.__v;
  return obj;
};

export const SurveyQuestion = model<SurveyQuestion, SurveyQuestionModel>(
  'SurveyQuestion',
  surveyQuestionSchema
);
export default SurveyQuestion;
