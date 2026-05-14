import { z } from 'zod';

// 페어링 요청 검증 DTO
export const pairDeviceSchema = z.object({
  params: z.object({
    pairingToken: z.string().min(1, '페어링 토큰은 필수입니다.'),
  }),
});

export type PairDeviceDto = z.infer<typeof pairDeviceSchema>;

// 동의서 제출 검증 DTO
export const submitConsentSchema = z.object({
  body: z.object({
    versionId: z.string().min(1, '약관 버전 ID는 필수입니다.'),
    isResearchAgreed: z.boolean(),
  }),
  params: z.object({
    sessionId: z.string().min(1, '세션 ID는 필수입니다.'),
  }),
});

export type SubmitConsentDto = z.infer<typeof submitConsentSchema>;

// 강제 페어링 body 검증 — Zod strict() mass-assignment 방어함
// .trim() 적용으로 normalize 시나리오가 schema 차원에서 차단되지 않게 처리함
export const adminPairSchema = z
  .object({
    email: z.string().trim().email('유효한 이메일 형식이어야 합니다.'),
  })
  .strict();

export type AdminPairDto = z.infer<typeof adminPairSchema>;
