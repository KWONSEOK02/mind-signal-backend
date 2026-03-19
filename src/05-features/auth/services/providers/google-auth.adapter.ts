import { config } from '@07-shared/config/config';
import { AppError } from '@07-shared/errors';
import { IAuthProvider, SocialUserInfo } from './auth-provider.interface';

// Google OAuth2 토큰 응답 타입
interface GoogleTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

// Google 사용자 정보 응답 타입
interface GoogleUserInfoResponse {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

// Google OAuth2 인증 어댑터
export class GoogleAuthAdapter implements IAuthProvider {
  // 공급자 이름 반환
  getProviderName(): string {
    return 'google';
  }

  // 인증 코드 + PKCE code_verifier로 사용자 정보 조회
  async getUserInfo(
    code: string,
    codeVerifier: string,
    redirectUri?: string
  ): Promise<SocialUserInfo> {
    const clientId = config.googleClientId;
    const clientSecret = config.googleClientSecret;
    const configRedirectUri = config.googleRedirectUri;

    if (!clientId || !clientSecret || !configRedirectUri) {
      throw new AppError('Google OAuth 설정이 누락되었습니다', 500);
    }

    // 요청으로 전달된 redirectUri 우선 사용, 없으면 설정값 사용
    const effectiveRedirectUri = redirectUri || configRedirectUri;

    // 1) 인증 코드로 액세스 토큰 교환
    let tokenRes: Response;
    try {
      tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams([
          ['code', code],
          ['client_id', clientId],
          ['client_secret', clientSecret],
          ['redirect_uri', effectiveRedirectUri],
          ['grant_type', 'authorization_code'],
          ['code_verifier', codeVerifier],
        ]),
      });
    } catch {
      throw new AppError('Google 토큰 서버에 연결할 수 없습니다', 502);
    }

    if (!tokenRes.ok) {
      throw new AppError('Google 액세스 토큰 발급 실패', 401);
    }

    const tokenData = (await tokenRes.json()) as GoogleTokenResponse;
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      throw new AppError(
        'Google 토큰 응답에 access_token이 누락되었습니다',
        502
      );
    }

    // 2) 액세스 토큰으로 사용자 정보 조회
    let userInfoRes: Response;
    try {
      userInfoRes = await fetch(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
    } catch {
      throw new AppError('Google 사용자 정보 서버에 연결할 수 없습니다', 502);
    }

    if (!userInfoRes.ok) {
      throw new AppError('Google 사용자 정보 조회 실패', 401);
    }

    const userInfo = (await userInfoRes.json()) as GoogleUserInfoResponse;

    return {
      email: userInfo.email,
      name: userInfo.name,
      provider: 'google',
      providerId: userInfo.id,
      profileImage: userInfo.picture,
    };
  }

  // Access Token으로 직접 사용자 정보 조회함 (Google OAuth 모바일 플로우용)
  async getUserInfoByToken(accessToken: string): Promise<SocialUserInfo> {
    let userInfoRes: Response;
    try {
      userInfoRes = await fetch(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
    } catch {
      throw new AppError('Google 사용자 정보 서버에 연결할 수 없습니다', 502);
    }

    if (!userInfoRes.ok) {
      throw new AppError('Google 사용자 정보 조회 실패', 401);
    }

    const userInfo = (await userInfoRes.json()) as GoogleUserInfoResponse;

    return {
      email: userInfo.email,
      name: userInfo.name,
      provider: 'google',
      providerId: userInfo.id,
      profileImage: userInfo.picture,
    };
  }
}
