import { Schema, model, Model, HydratedDocument, Types } from 'mongoose';

/** * 1. 문서 필드 타입 정의
 * ERD(image_9869e2.png)의 필드와 Note A 규칙을 반영함
 */
export interface Session {
  pairingToken: string; // 고유 페어링 토큰
  userId: Types.ObjectId | null; // 초기에는 null이며 페어링 성공 시 업데이트
  status:
    | 'CREATED'
    | 'PAIRED'
    | 'MEASURING'
    | 'COMPLETED'
    | 'EXPIRED'
    | 'CANCELLED';
  pairedAt: Date | null; // 페어링 완료 시점
  expiresAt: Date; // 토큰 만료 시점
}

/** 2. 인스턴스 메서드 타입 정의 */
export interface SessionMethods {
  isExpired(): boolean;
}

/** 3. Mongoose 편의 타입 */
export type SessionDoc = HydratedDocument<Session, SessionMethods>;
export type SessionModel = Model<Session, {}, SessionMethods>;

/** * 4. 스키마 정의
 */
const sessionSchema = new Schema<Session, SessionModel, SessionMethods>(
  {
    pairingToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: [
        'CREATED',
        'PAIRED',
        'MEASURING',
        'COMPLETED',
        'EXPIRED',
        'CANCELLED',
      ],
      default: 'CREATED',
    },
    pairedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true, // createdAt(생성일) 포함
    collection: 'sessions', // 컬렉션 명은 복수형
  }
);

/** * 5. JSON 변환 로직 (일관성 유지)
 */
sessionSchema.methods.toJSON = function () {
  const obj = this.toObject() as any;
  obj.id = obj._id;
  delete obj.updatedAt;
  delete obj.createdAt;
  delete obj.__v;
  return obj;
};

/** * 6. 인스턴스 메서드 구현: 만료 여부 확인 (Note A-1 규칙)
 * 비즈니스 로직은 서비스에서 처리하는 것이 좋으나, 간단한 상태 확인은 메서드로 구현 가능합니다.
 */
sessionSchema.methods.isExpired = function (this: SessionDoc): boolean {
  return this.expiresAt < new Date();
};

/** 7. 모델 생성 및 수출 */
export const Session = model<Session, SessionModel>('Session', sessionSchema);
export default Session;
