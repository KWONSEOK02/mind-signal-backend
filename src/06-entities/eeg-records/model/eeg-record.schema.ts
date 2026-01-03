import { Schema, model, Model, HydratedDocument, Types } from 'mongoose';

/** * 1. 문서 필드 타입 정의
 * ERD(image_98627f.png)의 필드를 바탕으로 구성함
 */
export interface EegRecord {
  userId: Types.ObjectId; // User 엔티티 참조
  sessionId: Types.ObjectId; // Session 엔티티 참조
  consentId: Types.ObjectId; // Consent 엔티티 참조
  rawDataPath: string; // 원천 데이터 파일 경로
  eegSummary: Record<string, any>; // 추출된 뇌파 특징 데이터
  measuredAt: Date; // 측정 시점
}

/** 2. 인스턴스 메서드 타입 정의 (필요 시 추가) */
export interface EegRecordMethods {}

/** 3. Mongoose 편의 타입 */
export type EegRecordDoc = HydratedDocument<EegRecord, EegRecordMethods>;
export type EegRecordModel = Model<EegRecord, {}, EegRecordMethods>;

/** * 4. 스키마 정의
 */
const eegRecordSchema = new Schema<EegRecord, EegRecordModel, EegRecordMethods>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sessionId: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
    consentId: { type: Schema.Types.ObjectId, ref: 'Consent', required: true },
    rawDataPath: { type: String, required: true },
    eegSummary: { type: Object, default: {} },
    measuredAt: { type: Date, required: true, default: Date.now },
  },
  {
    timestamps: true, // createdAt, updatedAt 자동 생성
    collection: 'eegRecords', // 컬렉션 명은 camelCase 복수형
  }
);

/** * 5. JSON 변환 로직 (User 스키마와 동일한 방식 적용)
 */
eegRecordSchema.methods.toJSON = function () {
  const obj = this.toObject() as any;
  obj.id = obj._id; // 외부 노출용 id 필드 추가
  delete obj.updatedAt;
  delete obj.createdAt;
  delete obj.__v;
  return obj;
};

/** 6. 모델 생성 및 수출 */
export const EegRecord = model<EegRecord, EegRecordModel>(
  'EegRecord',
  eegRecordSchema
);
export default EegRecord;
