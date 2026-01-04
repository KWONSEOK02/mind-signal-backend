import bcrypt from 'bcryptjs';
import { CreateUserInput, userRepository, UserDoc } from '@06-entities/users';
import User from '@06-entities/users/model/user.schema';
import { AppError } from '@07-shared/errors';

const SALT_ROUNDS = 10;

type CreateUserParams = Omit<CreateUserInput, 'password'> & {
  password: string; // 서비스에선 비번 필수
};

//데이터베이스에 새로운 사용자를 생성하고, 생성된 사용자 객체 전체를 반환합니다.
//@param params 사용자 생성에 필요한 데이터
//@returns 생성된 Mongoose User Document

async function createUser(params: CreateUserParams): Promise<UserDoc> {
  const { email, password } = params;

  if (!password) {
    throw new AppError('비밀번호를 입력해주세요', 400);
  }

  const exists = await userRepository.findByEmail(email);

  if (exists) {
    throw new AppError('이미 가입된 이메일입니다', 409);
  }

  const hash = bcrypt.hashSync(password, bcrypt.genSaltSync(SALT_ROUNDS));

  const newUser = await userRepository.create({
    ...params,
    password: hash,
    membershipLevel: params.membershipLevel ?? 'customer',
    loginType: params.loginType ?? 'local',
  });

  return newUser;
}

async function getUser(userId: string): Promise<UserDoc> {
  // DB 조회 시 비밀번호를 명시적으로 제외
  const user = await User.findById(userId).select('-password');

  if (!user) {
    throw new AppError('사용자를 찾을 수 없습니다.', 404);
  }
  return user;
}

const userService = {
  createUser,
  getUser,
};

export default userService;
