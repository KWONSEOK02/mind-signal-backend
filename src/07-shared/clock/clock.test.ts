import { SystemClock, FixedClock } from './index';

describe('SystemClock', () => {
  it('호출 결과가 valid Date 인스턴스임', () => {
    const result = new SystemClock().now();
    expect(result).toBeInstanceOf(Date);
    expect(Number.isNaN(result.getTime())).toBe(false);
  });

  it('호출 직전 wall clock 이상의 시각 반환함', () => {
    const before = Date.now();
    const result = new SystemClock().now();
    expect(result.getTime()).toBeGreaterThanOrEqual(before);
  });
});

describe('FixedClock', () => {
  const fixed = new Date('2026-05-13T10:00:00.000Z');

  it('생성자 주입 Date를 N회 호출에서 동일 객체로 반환함 (참조 동등성)', () => {
    const clock = new FixedClock(fixed);
    expect(clock.now()).toBe(fixed);
    expect(clock.now()).toBe(fixed);
    expect(clock.now().toISOString()).toBe('2026-05-13T10:00:00.000Z');
  });

  it('invalid Date 주입 시 TypeError throw — plan-review I-5', () => {
    expect(() => new FixedClock(new Date('invalid'))).toThrow(TypeError);
    expect(() => new FixedClock(new Date('invalid'))).toThrow(
      'FixedClock requires a valid Date'
    );
  });
});
