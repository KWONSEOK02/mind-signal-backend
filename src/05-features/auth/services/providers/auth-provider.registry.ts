import { AppError } from '@07-shared/errors';
import { IAuthProvider } from './auth-provider.interface';
import { GoogleAuthAdapter } from './google-auth.adapter';
import { KakaoAuthAdapter } from './kakao-auth.adapter';

// 소셜 인증 공급자 레지스트리 — 공급자 어댑터 등록 및 조회 담당
export class AuthProviderRegistry {
  // 등록된 공급자 맵
  private static providers: Map<string, IAuthProvider> = new Map();

  // Google, Kakao 어댑터 초기화 및 등록
  static initialize(): void {
    const google = new GoogleAuthAdapter();
    const kakao = new KakaoAuthAdapter();

    AuthProviderRegistry.providers.set(google.getProviderName(), google);
    AuthProviderRegistry.providers.set(kakao.getProviderName(), kakao);

    console.log('소셜 인증 공급자 초기화 완료');
  }

  // 공급자 이름으로 어댑터 조회
  static get(providerName: string): IAuthProvider {
    const provider = AuthProviderRegistry.providers.get(providerName);
    if (!provider) {
      throw new AppError(
        `지원하지 않는 소셜 로그인 공급자입니다: ${providerName}`,
        400
      );
    }
    return provider;
  }
}
