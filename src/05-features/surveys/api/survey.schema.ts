import { z } from 'zod';

// 실제 shape: survey.service.ts 17~20행 확인 — { questionId, answerValue }
// answerValue는 Mongoose Mixed 타입 수용 — 문자열/숫자/문자열 배열 허용함
const surveyAnswerSchema = z.object({
  questionId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, '유효한 문항 ID가 아닙니다.'),
  answerValue: z.union([z.string(), z.number(), z.array(z.string())]),
});

// POST /responses — 설문 응답 일괄 저장 요청 스키마
export const submitResponsesSchema = z.object({
  responses: z
    .array(surveyAnswerSchema)
    .min(1, '제출할 응답 데이터가 없습니다.'),
});

export type SubmitResponsesInput = z.infer<typeof submitResponsesSchema>;
