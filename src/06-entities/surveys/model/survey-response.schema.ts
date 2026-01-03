import { Schema, model, Model, HydratedDocument, Types } from 'mongoose';

/** 1. 문서 필드 타입 정의 */
export interface SurveyResponse {
  userId: Types.ObjectId; // 답변을 제출한 유저 참조
  questionId: Types.ObjectId; // 답변한 문항 참조
  answerValue: any; // 답변 값
}

export interface SurveyResponseMethods {}

export type SurveyResponseDoc = HydratedDocument<
  SurveyResponse,
  SurveyResponseMethods
>;
export type SurveyResponseModel = Model<
  SurveyResponse,
  {},
  SurveyResponseMethods
>;

/** 2. 스키마 정의 */
const surveyResponseSchema = new Schema<
  SurveyResponse,
  SurveyResponseModel,
  SurveyResponseMethods
>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    questionId: {
      type: Schema.Types.ObjectId,
      ref: 'SurveyQuestion',
      required: true,
    },
    answerValue: { type: Schema.Types.Mixed, required: true }, // 다양한 형식의 답변 수용
  },
  {
    timestamps: true, // createdAt 기록
    collection: 'surveyResponses', // 복수형
  }
);

/** 3. JSON 변환 로직 */
surveyResponseSchema.methods.toJSON = function () {
  const obj = this.toObject() as any;
  obj.id = obj._id;
  delete obj.updatedAt;
  delete obj.createdAt;
  delete obj.__v;
  return obj;
};

export const SurveyResponse = model<SurveyResponse, SurveyResponseModel>(
  'SurveyResponse',
  surveyResponseSchema
);
export default SurveyResponse;
