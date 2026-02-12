import { z } from 'zod';

// 회원가입 DTO (런타임 검증 + 타입 추론)
export const signUpSchema = z
  .object({
    email: z.email({ message: '유효한 이메일을 입력하세요.' }),
    password: z
      .string({ error: '비밀번호를 입력해주세요.' })
      .min(6, { message: '비밀번호는 최소 6자 이상으로 설정해주세요.' }),
    passwordConfirm: z
      .string({ error: '비밀번호 확인을 입력해주세요.' })
      .min(1, { message: '비밀번호 확인을 입력해주세요.' }),
    name: z
      .string({ error: '이름은 필수입니다.' })
      .min(1, { message: '이름은 필수입니다.' }),
    loginType: z.enum(['local', 'google']).optional(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: '비밀번호와 비밀번호 확인 값이 일치하지 않습니다.',
    path: ['passwordConfirm'],
  });

export type SignUpDto = z.infer<typeof signUpSchema>;

// 로그인 DTO
export const loginSchema = z.object({
  email: z.email({ message: '유효한 이메일을 입력하세요.' }),
  password: z
    .string({ error: '비밀번호를 입력해주세요.' })
    .min(6, { message: '비밀번호는 최소 6자 이상이어야 합니다.' }),
});

export type LoginDto = z.infer<typeof loginSchema>;
