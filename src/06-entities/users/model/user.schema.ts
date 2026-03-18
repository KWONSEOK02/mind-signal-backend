import { Schema, model, Model, HydratedDocument } from 'mongoose';
import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '@07-shared/config/config';

const { jwtSecret: jwtCfg } = config;

/** 1. 문서 필드 타입 */
export interface User {
  email: string;
  password?: string;
  name: string;
  brainType: string;
  loginType: 'local' | 'google' | 'kakao';
  membershipLevel: string;
  providerId?: string | null;
}

/** 2. 인스턴스 메서드 타입 */
export interface UserMethods {
  generateToken(): string;
}

/** 3. Mongoose 편의 타입 */
export type UserDoc = HydratedDocument<User, UserMethods>;
export type UserModel = Model<User, {}, UserMethods>;

/** 4. 스키마 정의 */
const userSchema = new Schema<User, UserModel, UserMethods>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // local 로그인 시에만 필수, 소셜 로그인 시 불필요
    password: {
      type: String,
      required: function (this: { loginType: string }) {
        return this.loginType === 'local';
      },
    },
    name: { type: String, required: true },
    brainType: { type: String, default: 'PENDING' },
    loginType: {
      type: String,
      enum: ['local', 'google', 'kakao'],
      default: 'local',
    },
    membershipLevel: { type: String, default: 'BASIC' },
    // 소셜 로그인 공급자 고유 ID
    providerId: { type: String, default: null },
  },
  {
    timestamps: true, //
    collection: 'users',
  }
);

/** 5. JSON 변환 로직 (추출 방식 적용) */
userSchema.methods.toJSON = function () {
  const obj = this.toObject() as any;
  obj.id = obj._id; // _id를 id로 노출
  delete obj._id;
  delete obj.password; // 보안 필드 삭제
  delete obj.updatedAt;
  delete obj.createdAt;
  delete obj.__v;
  return obj;
};

/** 6. JWT 토큰 생성 로직 (타입 오류 해결) */
userSchema.methods.generateToken = function (this: UserDoc): string {
  if (!jwtCfg.secret) {
    throw new Error('JWT secret is not defined in config');
  }
  // jwt.sign의 세 번째 인자가 SignOptions로 정확히 인식되도록 캐스팅
  return jwt.sign({ id: this._id.toString() }, jwtCfg.secret as string, {
    expiresIn: jwtCfg.expiresIn as SignOptions['expiresIn'],
  });
};

const User = model<User, UserModel>('User', userSchema);
export default User;
