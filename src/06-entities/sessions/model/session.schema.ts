import { Schema, model, Model, HydratedDocument, Types } from 'mongoose';

/** * 1. 문서 필드 타입 정의
 * ERD의 필드와 Note A 규칙을 반영함
 */
export interface Session {
  groupId: string; // 추가: 동일 실험 세션을 묶어주는 그룹 고유 식별자임
  subjectIndex: number | null; // 추가: 해당 그룹 내 피실험자 할당 번호(1 또는 2)임
  pairingToken: string; // 고유 페어링 토큰임
  userId: Types.ObjectId | null; // 페어링 성공 시 바인딩되는 사용자 ID임
  status:
    | 'CREATED'
    | 'PAIRED'
    | 'MEASURING'
    | 'COMPLETED'
    | 'EXPIRED'
    | 'CANCELLED';
  pairedAt: Date | null; // 페어링 완료 시점
  expiresAt: Date; // 토큰 만료 시점
  measuredAt: Date | null; // 측정 시작 시점
}

/** 2. 인스턴스 메서드 타입 정의 */
export interface SessionMethods {
  isExpired(): boolean;
  canTransitionTo(nextStatus: Session['status']): boolean;
}

/** 3. Mongoose 편의 타입 */
export type SessionDoc = HydratedDocument<Session, SessionMethods>;
export type SessionModel = Model<Session, {}, SessionMethods>;

/** * 4. 스키마 정의
 */
const sessionSchema = new Schema<Session, SessionModel, SessionMethods>(
  {
    groupId: {
      type: String,
      required: true,
      index: true, // 그룹 단위 상태 조회를 위한 인덱스 생성함
    },
    subjectIndex: {
      type: Number,
      default: null, // 페어링 프로세스 중 서비스 로직에서 할당함
    },
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
    measuredAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt 자동 생성
    collection: 'sessions', // 컬렉션 명은 복수형
  }
);

/** * 5. JSON 변환 로직 (일관성 유지)
 */
sessionSchema.methods.toJSON = function () {
  const obj = this.toObject() as any;
  obj.id = obj._id;
  delete obj._id;
  delete obj.updatedAt;
  delete obj.createdAt;
  delete obj.__v;
  return obj;
};

/** 6. 인스턴스 메서드 구현 */
sessionSchema.methods.isExpired = function (this: SessionDoc): boolean {
  return this.expiresAt < new Date();
};

sessionSchema.methods.canTransitionTo = function (
  this: SessionDoc,
  nextStatus: Session['status']
): boolean {
  const current = this.status;

  // 1. 만료된 경우 EXPIRED 외에는 전이 불가 (Note A-1)
  if (this.isExpired() && current === 'CREATED') {
    return nextStatus === 'EXPIRED';
  }

  // 2. 상태별 전이 규칙 (Note A-2)
  const transitions: Record<Session['status'], Session['status'][]> = {
    CREATED: ['PAIRED', 'EXPIRED', 'CANCELLED'],
    PAIRED: ['MEASURING', 'CANCELLED'],
    MEASURING: ['COMPLETED', 'CANCELLED'],
    COMPLETED: [], // 측정 종료 요청
    EXPIRED: [], // 유효 시간 초과
    CANCELLED: [], // 통신 오류 또는 강제 종료
  };

  return transitions[current].includes(nextStatus);
};

/** 7. 모델 생성 및 수출 */
export const Session = model<Session, SessionModel>('Session', sessionSchema);
export default Session;
