import { Schema, model, Model, HydratedDocument, Types } from 'mongoose';

/** 1. 문서 필드 타입 정의 */
export interface Consent {
  userId: Types.ObjectId; // User 엔티티 참조
  versionId: string; // ConsentVersion의 versionId 참조
  isResearchAgreed: boolean; // 연구 활용 동의 여부
  withdrawnAt: Date | null; // 동의 철회 시점
}

export interface ConsentMethods {}

export type ConsentDoc = HydratedDocument<Consent, ConsentMethods>;
export type ConsentModel = Model<Consent, {}, ConsentMethods>;

/** 2. 스키마 정의 */
const consentSchema = new Schema<Consent, ConsentModel, ConsentMethods>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    // versionId는 ObjectId가 아닌 ConsentVersion의 커스텀 ID를 참조함
    versionId: { type: String, required: true },
    isResearchAgreed: { type: Boolean, default: false },
    withdrawnAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: 'consents', // 복수형
  }
);

/** 3. JSON 변환 로직 */
consentSchema.methods.toJSON = function () {
  const obj = this.toObject() as any;
  obj.id = obj._id;
  delete obj.updatedAt;
  delete obj.createdAt;
  delete obj.__v;
  return obj;
};

export const Consent = model<Consent, ConsentModel>('Consent', consentSchema);
export default Consent;
