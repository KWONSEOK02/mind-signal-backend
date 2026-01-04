import User, { UserDoc } from '../model/user.schema';

export type CreateUserInput = {
  email: string;
  name: string;
  password: string;
  brainType?: string;
  loginType?: 'local' | 'google';
  membershipLevel?: string;
};

/** * 이메일로 사용자 조회
 */
async function findByEmail(email: string): Promise<UserDoc | null> {
  // 결과값을 'as UserDoc | null'로 캐스팅하여 메서드 타입 충돌 해결
  return (await User.findOne({ email }).select('+password')) as UserDoc | null;
}

/** * 새로운 사용자 생성
 */
async function create(input: CreateUserInput): Promise<UserDoc> {
  // 생성된 결과물도 'as UserDoc'으로 캐스팅
  const doc = await User.create(input);
  return doc as UserDoc;
}

/** * 사용자 ID로 조회
 */
async function findById(id: string): Promise<UserDoc | null> {
  return (await User.findById(id)) as UserDoc | null;
}

export const userRepository = {
  findByEmail,
  create,
  findById,
};
