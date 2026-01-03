import { Schema, model, Model, HydratedDocument, Types } from 'mongoose';

/** 1. 문서 필드 타입 정의 */
export interface NeuroChat {
  analysisId: Types.ObjectId; // 상담의 근거가 되는 분석 결과 참조
  sender: 'user' | 'ai'; // 발신자 구분
  message: string; // 대화 내용
}

export interface NeuroChatMethods {}

export type NeuroChatDoc = HydratedDocument<NeuroChat, NeuroChatMethods>;
export type NeuroChatModel = Model<NeuroChat, {}, NeuroChatMethods>;

/** 2. 스키마 정의 */
const neuroChatSchema = new Schema<NeuroChat, NeuroChatModel, NeuroChatMethods>(
  {
    analysisId: {
      type: Schema.Types.ObjectId,
      ref: 'AnalysisResult',
      required: true,
    },
    sender: {
      type: String,
      enum: ['user', 'ai'],
      required: true,
    },
    message: { type: String, required: true },
  },
  {
    timestamps: true, // createdAt 기록
    collection: 'neuroChats',
  }
);

/** 3. JSON 변환 로직 */
neuroChatSchema.methods.toJSON = function () {
  const obj = this.toObject() as any;
  obj.id = obj._id;
  delete obj.updatedAt;
  delete obj.createdAt;
  delete obj.__v;
  return obj;
};

export const NeuroChat = model<NeuroChat, NeuroChatModel>(
  'NeuroChat',
  neuroChatSchema
);
export default NeuroChat;
