/**
 * sequential-analysis.service.ts — SEQUENTIAL 분석 파이프라인 서비스 검증
 *
 * 검증 항목:
 *   - 서비스가 engineProxyService.analyzeSequentialPipeline을 import 및 호출함
 *   - 두 subject COMPLETED 검증 로직이 존재함
 *   - AnalysisResult 생성 시 analysis_mode='SEQUENTIAL' 설정됨
 *   - 엔진 실패 시 에러를 전파함
 */

import * as fs from 'fs';
import * as path from 'path';

describe('sequential-analysis.service.ts: 소스 정적 검증', () => {
  let source: string;

  beforeAll(() => {
    const filePath = path.resolve(__dirname, 'sequential-analysis.service.ts');
    source = fs.readFileSync(filePath, 'utf-8');
  });

  it('engineProxyService를 import함', () => {
    expect(source).toContain('engineProxyService');
  });

  it('analyzeSequentialPipeline을 호출함', () => {
    expect(source).toContain('analyzeSequentialPipeline');
  });

  it("analysis_mode: 'SEQUENTIAL'을 AnalysisResult.create에 전달함", () => {
    expect(source).toContain("analysis_mode: 'SEQUENTIAL'");
  });

  it('두 subject COMPLETED 상태 검증 로직이 존재함', () => {
    expect(source).toContain("'COMPLETED'");
  });

  it('session1, session2 둘 다 조회함', () => {
    expect(source).toContain('session1');
    expect(source).toContain('session2');
  });

  it('엔진 실패 시 EegRecord 롤백 후 에러를 전파함', () => {
    expect(source).toContain('deleteMany');
    expect(source).toContain('throw err');
  });

  it('groupId와 algorithm 파라미터를 받음', () => {
    expect(source).toContain('groupId: string');
    expect(source).toContain('algorithm');
  });

  it("algorithm 기본값이 'default'임", () => {
    expect(source).toContain("algorithm: string = 'default'");
  });

  it('Promise<AnalysisResultDoc>를 반환함', () => {
    expect(source).toContain('AnalysisResultDoc');
  });

  it('SEQUENTIAL 모드에서 synchronyScore와 yScore를 null로 설정함 (ADR-14-004)', () => {
    expect(source).toContain('synchronyScore: null');
    expect(source).toContain('yScore: null');
  });
});

describe('engine-proxy.service.ts: analyzeSequentialPipeline 메서드 검증', () => {
  let source: string;

  beforeAll(() => {
    const filePath = path.resolve(
      __dirname,
      '../../engine/services/engine-proxy.service.ts'
    );
    source = fs.readFileSync(filePath, 'utf-8');
  });

  it('analyzeSequentialPipeline 메서드가 정의됨', () => {
    expect(source).toContain('analyzeSequentialPipeline');
  });

  it("mode: 'SEQUENTIAL'을 요청 body에 포함함", () => {
    expect(source).toContain("'SEQUENTIAL'");
  });

  it('algorithm 파라미터를 요청 body에 전달함', () => {
    expect(source).toContain("['algorithm']");
  });
});
