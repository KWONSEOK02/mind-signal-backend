import { Schema, model, Model, HydratedDocument, Types } from 'mongoose';

/** 1. 문서 필드 타입 정의 */
export interface MatchingPool {
  user1Id: Types.ObjectId; // 첫 번째 사용자 참조
  user2Id: Types.ObjectId; // 두 번째 사용자 참조
  analysisId: Types.ObjectId | null; // 근거가 되는 AnalysisResult 참조 (PENDING 시 null)
  groupId: string; // 그룹 역추적 + 멱등성 가드 키
  matchingScore: number; // 비정규화된 매칭 점수 (0-100)
  status: 'PENDING' | 'COMPLETED'; // 분석 진행 상태
}

export interface MatchingPoolMethods {}

export type MatchingPoolDoc = HydratedDocument<
  MatchingPool,
  MatchingPoolMethods
>;
export type MatchingPoolModel = Model<MatchingPool, {}, MatchingPoolMethods>;

/** 2. 스키마 정의 */
const matchingPoolSchema = new Schema<
  MatchingPool,
  MatchingPoolModel,
  MatchingPoolMethods
>(
  {
    user1Id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    user2Id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    analysisId: {
      type: Schema.Types.ObjectId,
      ref: 'AnalysisResult',
      default: null,
    },
    groupId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    matchingScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED'],
      default: 'PENDING',
    },
  },
  {
    timestamps: true, // createdAt 기록
    collection: 'matchingPools',
  }
);

/** 3. JSON 변환 로직 */
matchingPoolSchema.methods.toJSON = function () {
  const obj = this.toObject() as any;
  obj.id = obj._id;
  delete obj._id;
  delete obj.updatedAt;
  delete obj.createdAt;
  delete obj.__v;
  return obj;
};

export const MatchingPool = model<MatchingPool, MatchingPoolModel>(
  'MatchingPool',
  matchingPoolSchema
);
export default MatchingPool;
