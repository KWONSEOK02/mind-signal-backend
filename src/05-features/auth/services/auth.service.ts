import bcrypt from 'bcryptjs';
import { userRepository, User, UserDoc } from '@06-entities/users'; // 경로 추상화 적용
import AppError from '@07-shared/errors/app.error';

const SALT_ROUNDS = 10;

async function register(params: Partial<User>): Promise<UserDoc> {
  const { email, password, name } = params;

  // 1. 필수 필드 검증 (타입 가드)
  // 여기서 undefined 여부를 체크해야 아래에서 빨간 줄이 사라집니다.
  if (!email || !password || !name) {
    throw new AppError(
      '필수 입력 정보(이메일, 이름, 비밀번호)가 누락되었습니다',
      400
    );
  }

  // 2. 중복 확인
  const exists = await userRepository.findByEmail(email);
  if (exists) {
    throw new AppError('이미 가입된 이메일입니다', 409);
  }

  // 3. 암호화
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // 4. 저장 (확실히 string임을 검증했으므로 안전하게 전달 가능)
  const newUser = await userRepository.create({
    ...params,
    email, // 명시적으로 필수 값 전달
    name,
    password: hashedPassword,
    membershipLevel: params.membershipLevel ?? 'BASIC',
    loginType: params.loginType ?? 'local',
  } as any); // 만약 타입 정의가 여전히 복잡하다면 일시적으로 as any 사용 후 조율

  return newUser;
}

export const authService = { register };
