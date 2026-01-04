import { z } from 'zod';

// 회원가입 DTO (런타임 검증 + 타입 추론)
export const signUpSchema = z
  .object({
    email: z.email({ message: '유효한 이메일을 입력하세요.' }),
    password: z
      .string()
      .min(6, { message: '비밀번호는 최소 6자 이상이어야 합니다.' }),
    passwordConfirm: z
      .string()
      .min(6, { message: '비밀번호 확인을 입력해주세요.' }),
    name: z.string().min(1, { message: '이름은 필수입니다.' }),

    // 선택: 기본값은 모델에서 customer/local
    loginType: z.enum(['local', 'google']).optional(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: '비밀번호가 일치하지 않습니다.',
    path: ['passwordConfirm'],
  });

export type SignUpDto = z.infer<typeof signUpSchema>;

// 로그인 DTO
export const loginSchema = z.object({
  email: z.email({ message: '유효한 이메일을 입력하세요.' }),
  password: z
    .string()
    .min(6, { message: '비밀번호는 최소 6자 이상이어야 합니다.' }),
});

export type LoginDto = z.infer<typeof loginSchema>;
