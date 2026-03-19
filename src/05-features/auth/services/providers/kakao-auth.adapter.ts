import { config } from '@07-shared/config/config';
import { AppError } from '@07-shared/errors';
import { IAuthProvider, SocialUserInfo } from './auth-provider.interface';

// Kakao OAuth 토큰 응답 타입
interface KakaoTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

// Kakao 사용자 정보 응답 타입
interface KakaoUserInfoResponse {
  id: number;
  kakao_account?: {
    email?: string;
    profile?: {
      nickname?: string;
      profile_image_url?: string;
    };
  };
}

// Kakao OAuth 인증 어댑터
export class KakaoAuthAdapter implements IAuthProvider {
  // 공급자 이름 반환
  getProviderName(): string {
    return 'kakao';
  }

  // 인증 코드 + PKCE code_verifier로 사용자 정보 조회
  async getUserInfo(
    code: string,
    codeVerifier: string,
    redirectUri?: string
  ): Promise<SocialUserInfo> {
    const clientId = config.kakaoClientId;
    const clientSecret = config.kakaoClientSecret;
    const configRedirectUri = config.kakaoRedirectUri;

    if (!clientId || !configRedirectUri) {
      throw new AppError('Kakao OAuth 설정이 누락되었습니다', 500);
    }

    // 요청으로 전달된 redirectUri 우선 사용, 없으면 설정값 사용
    const effectiveRedirectUri = redirectUri || configRedirectUri;

    // 1) 인증 코드 + PKCE code_verifier로 액세스 토큰 교환
    const params = new URLSearchParams([
      ['code', code],
      ['client_id', clientId],
      ['redirect_uri', effectiveRedirectUri],
      ['grant_type', 'authorization_code'],
      ['code_verifier', codeVerifier],
    ]);

    if (clientSecret) {
      params.append('client_secret', clientSecret);
    }

    let tokenRes: Response;
    try {
      tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params,
      });
    } catch {
      throw new AppError('Kakao 토큰 서버에 연결할 수 없습니다', 502);
    }

    if (!tokenRes.ok) {
      throw new AppError('Kakao 액세스 토큰 발급 실패', 401);
    }

    const tokenData = (await tokenRes.json()) as KakaoTokenResponse;
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      throw new AppError(
        'Kakao 토큰 응답에 access_token이 누락되었습니다',
        502
      );
    }

    // 2) 액세스 토큰으로 사용자 정보 조회
    let userInfoRes: Response;
    try {
      userInfoRes = await fetch('https://kapi.kakao.com/v2/user/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch {
      throw new AppError('Kakao 사용자 정보 서버에 연결할 수 없습니다', 502);
    }

    if (!userInfoRes.ok) {
      throw new AppError('Kakao 사용자 정보 조회 실패', 401);
    }

    const userInfo = (await userInfoRes.json()) as KakaoUserInfoResponse;

    const email = userInfo.kakao_account?.email;
    const name = userInfo.kakao_account?.profile?.nickname;
    const profileImage = userInfo.kakao_account?.profile?.profile_image_url;

    if (!email) {
      throw new AppError(
        'Kakao 계정에서 이메일 정보를 가져올 수 없습니다',
        400
      );
    }

    if (!name) {
      throw new AppError(
        'Kakao 계정에서 닉네임 정보를 가져올 수 없습니다',
        400
      );
    }

    return {
      email,
      name,
      provider: 'kakao',
      providerId: String(userInfo.id),
      profileImage,
    };
  }

  // Access Token으로 직접 사용자 정보 조회함 (Kakao SDK 모바일 플로우용)
  async getUserInfoByToken(accessToken: string): Promise<SocialUserInfo> {
    let userInfoRes: Response;
    try {
      userInfoRes = await fetch('https://kapi.kakao.com/v2/user/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch {
      throw new AppError('Kakao 사용자 정보 서버에 연결할 수 없습니다', 502);
    }

    if (!userInfoRes.ok) {
      throw new AppError('Kakao 사용자 정보 조회 실패', 401);
    }

    const userInfo = (await userInfoRes.json()) as KakaoUserInfoResponse;

    const email = userInfo.kakao_account?.email;
    const name = userInfo.kakao_account?.profile?.nickname;
    const profileImage = userInfo.kakao_account?.profile?.profile_image_url;

    if (!email) {
      throw new AppError(
        'Kakao 계정에서 이메일 정보를 가져올 수 없습니다',
        400
      );
    }

    if (!name) {
      throw new AppError(
        'Kakao 계정에서 닉네임 정보를 가져올 수 없습니다',
        400
      );
    }

    return {
      email,
      name,
      provider: 'kakao',
      providerId: String(userInfo.id),
      profileImage,
    };
  }
}
