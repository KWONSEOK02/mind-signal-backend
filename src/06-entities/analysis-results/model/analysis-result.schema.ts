import { Schema, model, Model, HydratedDocument, Types } from 'mongoose';

/** 1. 문서 필드 타입 정의 */
export interface AnalysisResult {
  userId: Types.ObjectId;      // User 참조
  recordId: Types.ObjectId;    // EegRecord 참조
  sessionId: Types.ObjectId;   // Session 참조
  consentId: Types.ObjectId;   // Consent 참조
  surveySummary: string;       // 설문 요약 내용
  matchingScore: number;       // 매칭 점수 (0-100)
  aiComment: string;           // AI 분석 코멘트
}

export interface AnalysisResultMethods {}

export type AnalysisResultDoc = HydratedDocument<AnalysisResult, AnalysisResultMethods>;
export type AnalysisResultModel = Model<AnalysisResult, {}, AnalysisResultMethods>;

/** 2. 스키마 정의 */
const analysisResultSchema = new Schema<AnalysisResult, AnalysisResultModel, AnalysisResultMethods>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recordId: { type: Schema.Types.ObjectId, ref: 'EegRecord', required: true },
    sessionId: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
    consentId: { type: Schema.Types.ObjectId, ref: 'Consent', required: true },
    surveySummary: { type: String, required: true },
    matchingScore: { type: Number, required: true, min: 0, max: 100 },
    aiComment: { type: String, required: true },
  },
  { 
    timestamps: true, // createdAt 기록
    collection: 'analysisResults' 
  }
);

/** 3. JSON 변환 로직 */
analysisResultSchema.methods.toJSON = function () {
  const obj = this.toObject() as any;
  obj.id = obj._id;
  delete obj.updatedAt;
  delete obj.createdAt;
  delete obj.__v;
  return obj;
};

export const AnalysisResult = model<AnalysisResult, AnalysisResultModel>('AnalysisResult', analysisResultSchema);
export default AnalysisResult;