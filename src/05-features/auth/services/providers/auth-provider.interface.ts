// 소셜 로그인 공급자 인터페이스 및 사용자 정보 타입 정의

// 소셜 로그인으로 가져온 사용자 정보
export interface SocialUserInfo {
  email: string;
  name: string;
  provider: string; // 'google' | 'kakao'
  providerId: string; // 공급자별 고유 ID
  profileImage?: string;
}

// 소셜 인증 공급자 인터페이스
export interface IAuthProvider {
  getProviderName(): string;
  getUserInfo(
    code: string,
    codeVerifier: string,
    redirectUri?: string
  ): Promise<SocialUserInfo>;
  getUserInfoByToken(accessToken: string): Promise<SocialUserInfo>;
}
