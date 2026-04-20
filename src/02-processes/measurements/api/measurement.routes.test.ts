/**
 * measurement.routes.ts — validateParams 보강 검증
 *
 * 검증 항목:
 *   - measurementStartParamsSchema가 소스에 import됨
 *   - validateParams가 라우트 미들웨어 체인에 포함됨
 *   - 유효한 ObjectId는 스키마 검증을 통과함
 *   - 유효하지 않은 sessionId(비-ObjectId)는 검증 실패함
 */

import * as fs from 'fs';
import * as path from 'path';
import { measurementStartParamsSchema } from './measurement.schema';

describe('measurement.routes.ts: validateParams 정적 구조 검증', () => {
  let source: string;

  beforeAll(() => {
    const filePath = path.resolve(__dirname, 'measurement.routes.ts');
    source = fs.readFileSync(filePath, 'utf-8');
  });

  it('validateParams가 import됨', () => {
    expect(source).toContain('validateParams');
  });

  it('measurementStartParamsSchema가 import됨', () => {
    expect(source).toContain('measurementStartParamsSchema');
  });

  it('라우트 체인에 validateParams(measurementStartParamsSchema)가 포함됨', () => {
    expect(source).toContain('validateParams(measurementStartParamsSchema)');
  });
});

describe('measurement.routes.ts: measurementStartParamsSchema Zod 런타임 검증', () => {
  it('유효한 24자리 hex ObjectId는 검증을 통과함', () => {
    const result = measurementStartParamsSchema.safeParse({
      sessionId: '65c9f0b2a1b2c3d4e5f67890',
    });
    expect(result.success).toBe(true);
  });

  it('소문자 24자리 hex ObjectId도 검증을 통과함', () => {
    const result = measurementStartParamsSchema.safeParse({
      sessionId: 'aabbccddeeff001122334455',
    });
    expect(result.success).toBe(true);
  });

  it('23자리 짧은 문자열은 검증 실패함', () => {
    const result = measurementStartParamsSchema.safeParse({
      sessionId: '65c9f0b2a1b2c3d4e5f6789',
    });
    expect(result.success).toBe(false);
  });

  it('비-hex 문자 포함 시 검증 실패함', () => {
    const result = measurementStartParamsSchema.safeParse({
      sessionId: 'zzzzzzzzzzzzzzzzzzzzzzzz',
    });
    expect(result.success).toBe(false);
  });

  it('빈 문자열은 검증 실패함', () => {
    const result = measurementStartParamsSchema.safeParse({ sessionId: '' });
    expect(result.success).toBe(false);
  });

  it('sessionId 누락 시 검증 실패함', () => {
    const result = measurementStartParamsSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
