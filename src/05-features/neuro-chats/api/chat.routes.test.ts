/**
 * chat.routes.ts — validate 미들웨어 Zod 스키마 검증
 *
 * 검증 항목:
 *   - chatMessageSchema: message 필수, groupId 선택(ObjectId 정규식)
 *   - chatAskSchema: email 형식, message 필수
 *   - 유효하지 않은 입력 시 safeParse 실패함
 */

import { chatMessageSchema, chatAskSchema } from './chat.schema';

describe('chatMessageSchema 검증', () => {
  it('message 있으면 검증 통과함', () => {
    const result = chatMessageSchema.safeParse({
      message: '소개 어디서 봐요?',
    });
    expect(result.success).toBe(true);
  });

  it('message와 groupId(ObjectId) 함께 있으면 검증 통과함', () => {
    const result = chatMessageSchema.safeParse({
      message: '소개 어디서 봐요?',
      groupId: '507f1f77bcf86cd799439011',
    });
    expect(result.success).toBe(true);
  });

  it('message 빈 문자열이면 검증 실패함', () => {
    const result = chatMessageSchema.safeParse({ message: '' });
    expect(result.success).toBe(false);
  });

  it('message 누락 시 검증 실패함', () => {
    const result = chatMessageSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('message 1000자 초과 시 검증 실패함', () => {
    const result = chatMessageSchema.safeParse({ message: 'a'.repeat(1001) });
    expect(result.success).toBe(false);
  });

  it('groupId가 ObjectId 형식이 아니면 검증 실패함', () => {
    const result = chatMessageSchema.safeParse({
      message: '안녕',
      groupId: 'not-an-objectid',
    });
    expect(result.success).toBe(false);
  });
});

describe('chatAskSchema 검증', () => {
  it('email, message 모두 유효하면 검증 통과함', () => {
    const result = chatAskSchema.safeParse({
      email: 'user@example.com',
      message: '문의드립니다.',
    });
    expect(result.success).toBe(true);
  });

  it('email 형식 잘못되면 검증 실패함', () => {
    const result = chatAskSchema.safeParse({
      email: 'not-an-email',
      message: '문의드립니다.',
    });
    expect(result.success).toBe(false);
  });

  it('message 빈 문자열이면 검증 실패함', () => {
    const result = chatAskSchema.safeParse({
      email: 'user@example.com',
      message: '',
    });
    expect(result.success).toBe(false);
  });

  it('message 2000자 초과 시 검증 실패함', () => {
    const result = chatAskSchema.safeParse({
      email: 'user@example.com',
      message: 'a'.repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it('email 누락 시 검증 실패함', () => {
    const result = chatAskSchema.safeParse({ message: '문의드립니다.' });
    expect(result.success).toBe(false);
  });

  it('message 누락 시 검증 실패함', () => {
    const result = chatAskSchema.safeParse({ email: 'user@example.com' });
    expect(result.success).toBe(false);
  });
});
