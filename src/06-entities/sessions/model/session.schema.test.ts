/**
 * session.schema.ts — experimentMode 필드 추가 검증
 *
 * 검증 항목:
 *   - Session 인터페이스에 experimentMode 필드가 추가됨
 *   - Mongoose 스키마에 experimentMode 필드 정의 존재함
 *   - enum 값으로 DUAL, SEQUENTIAL, BTI가 정의됨
 *   - default 값이 'DUAL'로 설정됨
 *   - required: true가 설정됨
 */

import * as fs from 'fs';
import * as path from 'path';

describe('session.schema.ts: experimentMode 필드가 올바르게 추가됨', () => {
  let source: string;

  beforeAll(() => {
    const filePath = path.resolve(__dirname, 'session.schema.ts');
    source = fs.readFileSync(filePath, 'utf-8');
  });

  it('Session 인터페이스에 experimentMode 필드가 존재함', () => {
    expect(source).toContain('experimentMode');
  });

  it('Session 인터페이스에 DUAL | SEQUENTIAL | BTI 유니온 타입이 포함됨', () => {
    expect(source).toContain('SEQUENTIAL');
    expect(source).toContain('DUAL');
    expect(source).toContain('BTI');
  });

  it('Mongoose 스키마에 experimentMode 필드 정의가 존재함', () => {
    // 스키마 객체 내에 experimentMode 키 존재함
    expect(source).toContain('experimentMode:');
  });

  it("스키마 enum에 'SEQUENTIAL'이 포함됨", () => {
    expect(source).toContain("'SEQUENTIAL'");
  });

  it("스키마 enum에 'DUAL'이 포함됨", () => {
    // 'DUAL' 리터럴이 schema enum 배열에 존재함
    expect(source).toContain("'DUAL'");
  });

  it("스키마 enum에 'BTI'이 포함됨", () => {
    expect(source).toContain("'BTI'");
  });

  it("스키마 default가 'DUAL'로 설정됨", () => {
    // experimentMode 필드 default 값 확인함
    // "default: 'DUAL'" 또는 `default: "DUAL"` 형식으로 존재해야 함
    expect(source).toMatch(/default:\s*['"]DUAL['"]/);
  });

  it('스키마 required가 true로 설정됨', () => {
    expect(source).toContain('required: true');
  });
});
