/* eslint-disable camelcase */
/**
 * analysis-result.schema.ts — analysis_mode + similarity_features 필드 검증
 *
 * 검증 항목:
 *   - analysis_mode 필드가 스키마에 정의됨
 *   - similarity_features 필드가 Mixed 타입으로 정의됨
 *   - 기존 생성 경로(bti-analysis, post-measurement)에서 analysis_mode 미지정 시
 *     Mongoose default 'DUAL'이 적용됨 (정적 소스 검증)
 */

import * as fs from 'fs';
import * as path from 'path';

describe('analysis-result.schema.ts: analysis_mode 필드가 올바르게 추가됨', () => {
  let source: string;

  beforeAll(() => {
    const filePath = path.resolve(__dirname, 'analysis-result.schema.ts');
    source = fs.readFileSync(filePath, 'utf-8');
  });

  it('AnalysisResult 인터페이스에 analysis_mode 필드가 존재함', () => {
    expect(source).toContain('analysis_mode');
  });

  it("인터페이스 analysis_mode에 'DUAL' | 'SEQUENTIAL' | 'BTI' 유니온이 포함됨", () => {
    expect(source).toContain('DUAL');
    expect(source).toContain('SEQUENTIAL');
    expect(source).toContain('BTI');
  });

  it('Mongoose 스키마에 analysis_mode 필드 정의가 존재함', () => {
    expect(source).toContain('analysis_mode:');
  });

  it("스키마 analysis_mode enum에 'DUAL', 'SEQUENTIAL', 'BTI'가 포함됨", () => {
    expect(source).toContain("'DUAL'");
    expect(source).toContain("'SEQUENTIAL'");
    expect(source).toContain("'BTI'");
  });

  it("스키마 analysis_mode default가 'DUAL'로 설정됨", () => {
    expect(source).toMatch(/default:\s*['"]DUAL['"]/);
  });

  it('인터페이스에 similarity_features 필드가 존재함', () => {
    expect(source).toContain('similarity_features');
  });

  it('스키마에 similarity_features가 Schema.Types.Mixed로 정의됨', () => {
    expect(source).toContain('Schema.Types.Mixed');
  });

  it('기존 AnalysisResult.create 호출 시 analysis_mode 미지정이 허용됨 (optional 또는 default)', () => {
    // analysis_mode는 인터페이스에서 optional(?)이거나 Mongoose default로 채워짐
    // 인터페이스 필드에 '?'(optional) 또는 default 선언 확인함
    const hasOptionalInInterface = source.match(/analysis_mode\s*\?:/);
    const hasDefaultInSchema = source.match(
      /analysis_mode:[\s\S]*?default:\s*['"]DUAL['"]/
    );
    expect(hasOptionalInInterface || hasDefaultInSchema).toBeTruthy();
  });
});

describe('cosine_pearson_faa.schema.ts: Zod 스키마 검증', () => {
  let cosinePearsonFAASchema: ReturnType<typeof import('zod').z.object>;

  beforeAll(() => {
    const schemaPath = path.resolve(
      __dirname,
      '../../../07-shared/schemas/similarity/cosine_pearson_faa.schema.ts'
    );
    const hasFile = fs.existsSync(schemaPath);
    expect(hasFile).toBe(true);
    if (!hasFile) return;
    ({
      cosinePearsonFAASchema,
    } = require('../../../07-shared/schemas/similarity/cosine_pearson_faa.schema'));
  });

  it('유효한 payload를 올바르게 파싱함', () => {
    if (!cosinePearsonFAASchema) return;
    const validPayload = {
      algorithm: 'cosine_pearson_faa',
      similarity_score: 0.73,
      overall_cosine: 0.85,
      band_ratio_diff: {
        delta: 0.1,
        theta: 0.2,
        alpha: 0.05,
        beta: 0.15,
        gamma: 0.08,
      },
      faa_absolute_diff: 0.2,
    };
    const result = cosinePearsonFAASchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('similarity_score가 범위 초과(1.5)면 파싱 실패함', () => {
    if (!cosinePearsonFAASchema) return;
    const invalidPayload = {
      algorithm: 'cosine_pearson_faa',
      similarity_score: 1.5,
      overall_cosine: 0.85,
      band_ratio_diff: {},
      faa_absolute_diff: null,
    };
    const result = cosinePearsonFAASchema.safeParse(invalidPayload);
    expect(result.success).toBe(false);
  });

  it('algorithm 필드 누락 시 파싱 실패함', () => {
    if (!cosinePearsonFAASchema) return;
    const invalidPayload = {
      similarity_score: 0.5,
      overall_cosine: 0.7,
      band_ratio_diff: {},
      faa_absolute_diff: null,
    };
    const result = cosinePearsonFAASchema.safeParse(invalidPayload);
    expect(result.success).toBe(false);
  });

  it('faa_absolute_diff가 null이어도 파싱 성공함', () => {
    if (!cosinePearsonFAASchema) return;
    const payload = {
      algorithm: 'cosine_pearson_faa',
      similarity_score: 0.5,
      overall_cosine: 0.6,
      band_ratio_diff: { alpha: 0.1 },
      faa_absolute_diff: null,
    };
    const result = cosinePearsonFAASchema.safeParse(payload);
    expect(result.success).toBe(true);
  });
});
