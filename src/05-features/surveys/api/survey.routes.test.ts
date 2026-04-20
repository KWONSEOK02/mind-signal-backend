/**
 * survey.routes.ts — validate 미들웨어 Zod 스키마 검증
 *
 * 검증 항목:
 *   - submitResponsesSchema: responses 필수(1개 이상), 각 항목 questionId/answerValue 필수
 *   - questionId: 24자리 hex ObjectId 정규식 검증 (비-ObjectId 값은 400 반환)
 *   - answerValue: string | number | string[] 허용함
 *   - 유효하지 않은 입력 시 safeParse 실패함
 */

import { submitResponsesSchema } from './survey.schema';

describe('submitResponsesSchema 검증', () => {
  it('answerValue가 숫자인 응답 배열이면 검증 통과함', () => {
    const result = submitResponsesSchema.safeParse({
      responses: [{ questionId: '60d5f4831a2b3c4d5e6f7890', answerValue: 4 }],
    });
    expect(result.success).toBe(true);
  });

  it('answerValue가 문자열인 응답 배열이면 검증 통과함', () => {
    const result = submitResponsesSchema.safeParse({
      responses: [
        { questionId: '60d5f4831a2b3c4d5e6f7890', answerValue: '매우 동의함' },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('answerValue가 문자열 배열이면 검증 통과함', () => {
    const result = submitResponsesSchema.safeParse({
      responses: [
        {
          questionId: '60d5f4831a2b3c4d5e6f7890',
          answerValue: ['선택1', '선택2'],
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('여러 개 응답 배열이면 검증 통과함', () => {
    const result = submitResponsesSchema.safeParse({
      responses: [
        { questionId: '60d5f4831a2b3c4d5e6f7890', answerValue: 3 },
        { questionId: 'aabbccddeeff001122334455', answerValue: '텍스트 응답' },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('responses 빈 배열이면 검증 실패함', () => {
    const result = submitResponsesSchema.safeParse({ responses: [] });
    expect(result.success).toBe(false);
  });

  it('responses 누락 시 검증 실패함', () => {
    const result = submitResponsesSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('questionId 누락 시 검증 실패함', () => {
    const result = submitResponsesSchema.safeParse({
      responses: [{ answerValue: 4 }],
    });
    expect(result.success).toBe(false);
  });

  it('answerValue 누락 시 검증 실패함', () => {
    const result = submitResponsesSchema.safeParse({
      responses: [{ questionId: 'q1' }],
    });
    expect(result.success).toBe(false);
  });

  it('questionId 빈 문자열이면 검증 실패함', () => {
    const result = submitResponsesSchema.safeParse({
      responses: [{ questionId: '', answerValue: 4 }],
    });
    expect(result.success).toBe(false);
  });

  it('answerValue가 객체이면 검증 실패함', () => {
    const result = submitResponsesSchema.safeParse({
      responses: [{ questionId: 'q1', answerValue: { nested: 'object' } }],
    });
    expect(result.success).toBe(false);
  });

  it('questionId가 비-ObjectId 문자열(q1)이면 검증 실패함', () => {
    const result = submitResponsesSchema.safeParse({
      responses: [{ questionId: 'q1', answerValue: 4 }],
    });
    expect(result.success).toBe(false);
  });
});
