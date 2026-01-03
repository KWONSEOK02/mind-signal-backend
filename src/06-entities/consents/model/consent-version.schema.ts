import { Schema, model, Model, HydratedDocument } from 'mongoose';

/** 1. 문서 필드 타입 정의 (I 제거) */
export interface ConsentVersion {
  versionId: string; // 버전 식별자 (예: 'v1.0')
  requiredUrl: string; // 필수 약관 URL
  optionalUrl: string; // 선택 약관 URL
  termsHash: string; // 약관 내용의 무결성 검증용 해시
  effectiveAt: Date; // 약관 발효 시점
}

export interface ConsentVersionMethods {}

export type ConsentVersionDoc = HydratedDocument<
  ConsentVersion,
  ConsentVersionMethods
>;
export type ConsentVersionModel = Model<
  ConsentVersion,
  {},
  ConsentVersionMethods
>;

/** 2. 스키마 정의 */
const consentVersionSchema = new Schema<
  ConsentVersion,
  ConsentVersionModel,
  ConsentVersionMethods
>(
  {
    versionId: { type: String, required: true, unique: true },
    requiredUrl: { type: String, required: true },
    optionalUrl: { type: String, required: true },
    termsHash: { type: String, required: true },
    effectiveAt: { type: Date, required: true },
  },
  {
    timestamps: true,
    collection: 'consentVersions', // 복수형 camelCase
  }
);

/** 3. JSON 변환 로직 */
consentVersionSchema.methods.toJSON = function () {
  const obj = this.toObject() as any;
  obj.id = obj._id;
  delete obj.updatedAt;
  delete obj.createdAt;
  delete obj.__v;
  return obj;
};

export const ConsentVersion = model<ConsentVersion, ConsentVersionModel>(
  'ConsentVersion',
  consentVersionSchema
);
export default ConsentVersion;
