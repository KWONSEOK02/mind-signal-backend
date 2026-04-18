/* eslint-disable camelcase */
/**
 * sequential-analysis.service — 통합 수준 검증 (unit-level, MongoDB 없이)
 *
 * 실제 mongoose/DB 연결 없이 소스 코드와 모듈 구조를 검증함.
 * mongodb-memory-server 미설치 환경을 고려하여 정적 소스 검증 + Zod 런타임 검증만 수행함.
 *
 * 검증 항목:
 *   - SEQUENTIAL 파이프라인 service + proxy 연계 구조 확인
 *   - similarity_features round-trip 에서 Zod 스키마 파싱 확인
 *   - DB 레이어 분리: 에러 전파 구조 확인
 */

import * as fs from 'fs';
import * as path from 'path';

describe('sequential-analysis.service + engine-proxy 통합 구조 검증', () => {
  let serviceSource: string;
  let proxySource: string;

  beforeAll(() => {
    serviceSource = fs.readFileSync(
      path.resolve(__dirname, 'sequential-analysis.service.ts'),
      'utf-8'
    );
    proxySource = fs.readFileSync(
      path.resolve(__dirname, '../../engine/services/engine-proxy.service.ts'),
      'utf-8'
    );
  });

  it('service가 proxy의 analyzeSequentialPipeline을 호출함', () => {
    expect(serviceSource).toContain('analyzeSequentialPipeline');
    expect(proxySource).toContain('analyzeSequentialPipeline');
  });

  it('proxy가 SEQUENTIAL mode와 algorithm을 DE에 전달함', () => {
    expect(proxySource).toContain("'SEQUENTIAL'");
    expect(proxySource).toContain("['algorithm']");
    expect(proxySource).toContain('/api/analyze/pipeline');
  });

  it('service가 DE 응답에서 similarity_features를 추출함', () => {
    // camelCase 변환 후 similarityFeatures 키로 접근함 (toCamelCaseKeys)
    expect(serviceSource).toContain('similarityFeatures');
  });

  it('service가 AnalysisResult.create에 올바른 필드를 전달함', () => {
    expect(serviceSource).toContain('analysis_mode');
    expect(serviceSource).toContain('similarity_features');
    expect(serviceSource).toContain('synchronyScore: null');
    expect(serviceSource).toContain('yScore: null');
  });

  it('service가 엔진 실패 시 EegRecord 롤백 후 에러를 전파함', () => {
    expect(serviceSource).toContain('findByIdAndDelete');
    expect(serviceSource).toContain('throw err');
  });
});

describe('AnalysisResult 스키마: SEQUENTIAL + similarity_features 필드 round-trip 검증 (정적)', () => {
  let schemaSource: string;

  beforeAll(() => {
    schemaSource = fs.readFileSync(
      path.resolve(
        __dirname,
        '../../../06-entities/analysis-results/model/analysis-result.schema.ts'
      ),
      'utf-8'
    );
  });

  it('analysis_mode 필드가 스키마에 존재함', () => {
    expect(schemaSource).toContain('analysis_mode');
  });

  it('similarity_features 필드가 Schema.Types.Mixed로 존재함', () => {
    expect(schemaSource).toContain('similarity_features');
    expect(schemaSource).toContain('Schema.Types.Mixed');
  });

  it('AnalysisResult 인터페이스에 두 신규 필드가 optional로 선언됨', () => {
    expect(schemaSource).toContain('analysis_mode?:');
    expect(schemaSource).toContain('similarity_features?:');
  });
});

describe('Zod similarity 스키마: cosine_pearson_faa round-trip 검증', () => {
  it('유효한 cosine_pearson_faa 결과가 Zod 파싱을 통과함', () => {
    const {
      cosinePearsonFAASchema,
    } = require('../../../07-shared/schemas/similarity/cosine_pearson_faa.schema');
    const mockDEResponse = {
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
    const result = cosinePearsonFAASchema.safeParse(mockDEResponse);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.similarity_score).toBe(0.73);
      expect(result.data.algorithm).toBe('cosine_pearson_faa');
    }
  });

  it('Mixed type 중첩 객체가 보존됨 (Zod parse 후 동일 구조)', () => {
    const {
      cosinePearsonFAASchema,
    } = require('../../../07-shared/schemas/similarity/cosine_pearson_faa.schema');
    const nested = {
      algorithm: 'cosine_pearson_faa',
      similarity_score: 0.5,
      overall_cosine: 0.6,
      band_ratio_diff: {
        alpha: 0.1,
        beta: 0.2,
        delta: 0.0,
        theta: 0.3,
        gamma: 0.1,
      },
      faa_absolute_diff: null,
    };
    const result = cosinePearsonFAASchema.safeParse(nested);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.band_ratio_diff).toEqual(nested.band_ratio_diff);
      expect(result.data.faa_absolute_diff).toBeNull();
    }
  });

  it('DE 500 응답 시나리오: similarity_score 미포함 응답은 Zod 검증 실패함', () => {
    const {
      cosinePearsonFAASchema,
    } = require('../../../07-shared/schemas/similarity/cosine_pearson_faa.schema');
    const errorResponse = {
      error: 'Internal server error',
      detail: 'CSV not found',
    };
    const result = cosinePearsonFAASchema.safeParse(errorResponse);
    expect(result.success).toBe(false);
  });
});

describe('similaritySchemaRegistry: 레지스트리 조회 검증', () => {
  it("'cosine_pearson_faa' 키로 스키마 조회 성공함", () => {
    const {
      getSimilaritySchema,
    } = require('../../../07-shared/schemas/similarity/index');
    const schema = getSimilaritySchema('cosine_pearson_faa');
    expect(schema).toBeDefined();
  });

  it("'default' 키로 스키마 조회 성공함", () => {
    const {
      getSimilaritySchema,
    } = require('../../../07-shared/schemas/similarity/index');
    const schema = getSimilaritySchema('default');
    expect(schema).toBeDefined();
  });

  it('미등록 알고리즘은 undefined 반환함', () => {
    const {
      getSimilaritySchema,
    } = require('../../../07-shared/schemas/similarity/index');
    const schema = getSimilaritySchema('unknown_algorithm_xyz');
    expect(schema).toBeUndefined();
  });
});
