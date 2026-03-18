import bcrypt from 'bcryptjs';
import { userRepository, UserDoc } from '@06-entities/users';
import User from '@06-entities/users/model/user.schema';
import { AppError } from '@07-shared/errors';
import { AuthProviderRegistry } from './providers/auth-provider.registry';

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
    throw new AppError('아이디 또는 비밀번호가 일치하지 않습니다.', 401);
  }

  // 3) 토큰 발급
  const token: string = await user.generateToken();

  return { user, token };
}

// 소셜 로그인: 공급자 어댑터로 사용자 정보 조회 후 JWT 발급
async function socialLogin(
  provider: string,
  code: string,
  codeVerifier: string,
  redirectUri?: string
): Promise<AuthResult> {
  // 1) 공급자 어댑터 조회
  const adapter = AuthProviderRegistry.get(provider);

  // 2) 인증 코드 + PKCE code_verifier + redirectUri 전달함
  const socialUser = await adapter.getUserInfo(code, codeVerifier, redirectUri);

  // 3) 이메일로 기존 사용자 조회
  let user = await userRepository.findByEmail(socialUser.email);

  if (user) {
    // 4) 기존 사용자가 다른 로그인 방식으로 가입된 경우 충돌 처리
    if (user.loginType !== provider) {
      throw new AppError(
        `해당 이메일은 이미 ${user.loginType} 방식으로 가입되어 있습니다`,
        409
      );
    }
  } else {
    // 5) 신규 사용자 생성 (소셜 로그인은 비밀번호 없음)
    user = await userRepository.create({
      email: socialUser.email,
      name: socialUser.name,
      loginType: provider as 'google' | 'kakao',
      providerId: socialUser.providerId,
      membershipLevel: 'BASIC',
    });
  }

  // 6) JWT 토큰 발급
  const token: string = await user.generateToken();

  return { user, token };
}

// Access Token으로 소셜 로그인 처리함 (모바일 SDK 플로우용)
async function socialLoginWithToken(
  provider: string,
  accessToken: string
): Promise<AuthResult> {
  // 1) 공급자 어댑터 조회
  const adapter = AuthProviderRegistry.get(provider);

  // 2) Access Token으로 사용자 정보 직접 조회함
  const socialUser = await adapter.getUserInfoByToken(accessToken);

  // 3) 이메일로 기존 사용자 조회
  let user = await userRepository.findByEmail(socialUser.email);

  if (user) {
    // 4) 기존 사용자가 다른 로그인 방식으로 가입된 경우 충돌 처리
    if (user.loginType !== provider) {
      throw new AppError(
        `해당 이메일은 이미 ${user.loginType} 방식으로 가입되어 있습니다`,
        409
      );
    }
  } else {
    // 5) 신규 사용자 생성 (소셜 로그인은 비밀번호 없음)
    user = await userRepository.create({
      email: socialUser.email,
      name: socialUser.name,
      loginType: provider as 'google' | 'kakao',
      providerId: socialUser.providerId,
      membershipLevel: 'BASIC',
    });
  }

  // 6) JWT 토큰 발급
  const token: string = await user.generateToken();

  return { user, token };
}

const authService = {
  register,
  loginWithEmail,
  socialLogin,
  socialLoginWithToken,
};

export default authService;
