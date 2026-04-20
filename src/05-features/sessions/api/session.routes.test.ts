/**
 * session.routes.ts — validate 미들웨어 Zod 스키마 검증
 *
 * 검증 항목:
 *   - createSessionSchema: groupId 선택(ObjectId 정규식), body 누락 시 {} 대체 처리함
 *   - F8-bis 패턴: .default({}) 적용 — undefined 입력 시 safeParse 성공 처리함
 */

import { createSessionSchema } from './session.schema';

describe('createSessionSchema 검증 (POST / — 세션 생성)', () => {
  it('body 전체 누락(undefined) 시 검증 통과함 (F8-bis .default({}) 적용)', () => {
    // Express에서 body 없는 요청은 req.body === undefined
    // .default({})가 undefined를 빈 객체로 대체하여 safeParse 성공 처리함
    const result = createSessionSchema.safeParse(undefined);
    expect(result.success).toBe(true);
    expect(result.data).toEqual({});
  });

  it('빈 객체 body 시 검증 통과함', () => {
    const result = createSessionSchema.safeParse({});
    expect(result.success).toBe(true);
    expect(result.data).toEqual({});
  });

  it('유효한 ObjectId groupId 포함 시 검증 통과함', () => {
    const result = createSessionSchema.safeParse({
      groupId: '65c9f0b2a1b2c3d4e5f67800',
    });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ groupId: '65c9f0b2a1b2c3d4e5f67800' });
  });

  it('groupId 생략 시 검증 통과함', () => {
    const result = createSessionSchema.safeParse({ groupId: undefined });
    expect(result.success).toBe(true);
  });

  it('groupId가 ObjectId 형식이 아니면 검증 실패함', () => {
    const result = createSessionSchema.safeParse({
      groupId: 'not-an-objectid',
    });
    expect(result.success).toBe(false);
  });

  it('groupId가 23자리(짧음)이면 검증 실패함', () => {
    const result = createSessionSchema.safeParse({
      groupId: '65c9f0b2a1b2c3d4e5f6780', // 23자리
    });
    expect(result.success).toBe(false);
  });

  it('groupId가 25자리(긺)이면 검증 실패함', () => {
    const result = createSessionSchema.safeParse({
      groupId: '65c9f0b2a1b2c3d4e5f678000', // 25자리
    });
    expect(result.success).toBe(false);
  });

  it('groupId가 숫자 타입이면 검증 실패함', () => {
    const result = createSessionSchema.safeParse({ groupId: 12345 });
    expect(result.success).toBe(false);
  });
});
