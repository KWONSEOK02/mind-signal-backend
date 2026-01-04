import bcrypt from 'bcryptjs';
import { userRepository, UserDoc } from '@06-entities/users';
import User from '@06-entities/users/model/user.schema';
import { AppError } from '@07-shared/errors';

// 반환 타입: 유저 + 토큰
type AuthResult = {
  user: UserDoc;
  token: string;
};

type LoginWithEmailParams = {
  email: string;
  password: string;
};

const SALT_ROUNDS = 10;

// 회원가입: 유저 생성 + 토큰 발급
async function register(createUserData: any): Promise<AuthResult> {
  const { passwordConfirm, ...userData } = createUserData;
  const { email, password, name } = userData;

  // 1) 필수값 체크
  if (!email || !password || !name) {
    throw new AppError(
      '필수 입력 정보(이메일, 이름, 비밀번호)가 누락되었습니다',
      400
    );
  }

  // 2) 비밀번호 확인
  //  클라이언트가 보내는 passwordConfirm을 검증
  if (passwordConfirm !== undefined && password !== passwordConfirm) {
    throw new AppError('비밀번호 확인이 일치하지 않습니다', 400);
  }

  // 3) 중복 이메일 확인
  const exists = await userRepository.findByEmail(email);
  if (exists) {
    throw new AppError('이미 가입된 이메일입니다', 409);
  }

  // 4) 비밀번호 해시
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // 5) 저장
  const newUser = await userRepository.create({
    ...userData,
    email,
    name,
    password: hashedPassword,
    membershipLevel: userData.membershipLevel ?? 'BASIC',
    loginType: userData.loginType ?? 'local',
  } as any);

  // 6) 토큰 발급
  const token: string = await newUser.generateToken();

  return { user: newUser, token };
}

// 로그인: 이메일/비밀번호 검증 + 토큰 발급
async function loginWithEmail({
  email,
  password,
}: LoginWithEmailParams): Promise<AuthResult> {
  // 1) 비밀번호 포함 조회 (Mongoose select("+password") 전제)
  const user = await User.findOne({ email }).select('+password');

  // 2) 사용자 없음 / 비밀번호 불일치
  if (!user || !(await bcrypt.compare(password, (user as any).password))) {
    throw new AppError('아이디 또는 비밀번호가 일치하지 않습니다', 401);
  }

  // 3) 토큰 발급
  const token: string = await user.generateToken();

  return { user, token };
}

const authService = {
  register,
  loginWithEmail,
};

export default authService;
