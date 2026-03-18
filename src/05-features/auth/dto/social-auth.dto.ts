import { z } from 'zod';

// 소셜 로그인 요청 본문 검증 스키마
export const socialLoginSchema = z.object({
  code: z.string().min(1, { message: '인증 코드는 필수입니다.' }),
  codeVerifier: z
    .string()
    .min(43, { message: 'PKCE code_verifier는 필수입니다.' }),
  redirectUri: z
    .string()
    .url({ message: '유효한 URL이어야 합니다.' })
    .optional(),
});

// 소셜 로그인 공급자 파라미터 검증 스키마
export const socialProviderSchema = z.object({
  provider: z.enum(['google', 'kakao'], {
    error: '지원하는 공급자는 google 또는 kakao입니다.',
  }),
});

// 소셜 로그인 Access Token 직접 수신 스키마
export const socialTokenSchema = z.object({
  accessToken: z.string().min(10, { message: 'Access Token은 필수입니다.' }),
});

export type SocialLoginDto = z.infer<typeof socialLoginSchema>;
export type SocialProviderDto = z.infer<typeof socialProviderSchema>;
export type SocialTokenDto = z.infer<typeof socialTokenSchema>;
