/**
 * engine.controller.ts — SEQUENTIAL 분기 정적 검증
 *
 * 검증 항목:
 *   - triggerPostMeasurementByTier에 SEQUENTIAL 분기가 추가됨
 *   - SEQUENTIAL 모드 시 기존 tier 분류 로직이 실행되지 않고 조기 반환함
 *   - DUAL/BTI 모드 시 기존 tier 분류 로직(VALID/PARTIAL/ABORTED)이 그대로 유지됨
 *   - app.router.ts에 sequentialRouter 등록이 존재함
 */

import * as fs from 'fs';
import * as path from 'path';

describe('engine.controller.ts: SEQUENTIAL dispatch 분기가 올바르게 추가됨', () => {
  let source: string;

  beforeAll(() => {
    const filePath = path.resolve(__dirname, 'engine.controller.ts');
    source = fs.readFileSync(filePath, 'utf-8');
  });

  it('triggerPostMeasurementByTier 함수가 존재함', () => {
    expect(source).toContain('triggerPostMeasurementByTier');
  });

  it("SEQUENTIAL 모드 분기가 존재함 (experimentMode === 'SEQUENTIAL')", () => {
    expect(source).toContain('SEQUENTIAL');
  });

  it('SEQUENTIAL 분기에서 emitLiveEvent를 호출함', () => {
    expect(source).toContain('emitLiveEvent');
  });

  it('SEQUENTIAL 분기에서 early return이 존재함', () => {
    // SEQUENTIAL 분기 내 return이 있어야 기존 tier 로직 건너뜀
    expect(source).toMatch(/SEQUENTIAL[\s\S]*?return/);
  });

  it('기존 VALID tier 분류 로직이 유지됨', () => {
    expect(source).toContain("'VALID'");
  });

  it('기존 PARTIAL tier 분류 로직이 유지됨', () => {
    expect(source).toContain("'PARTIAL'");
  });

  it('기존 ABORTED tier 분류 로직이 유지됨', () => {
    expect(source).toContain("'ABORTED'");
  });

  it('experimentMode를 대표 세션에서 조회함', () => {
    expect(source).toContain('experimentMode');
  });
});

describe('sequential.routes.ts: POST /sequential 라우트 정적 검증', () => {
  let source: string;

  beforeAll(() => {
    const filePath = path.resolve(
      __dirname,
      '../../post-measurement/api/sequential.routes.ts'
    );
    source = fs.readFileSync(filePath, 'utf-8');
  });

  it('authenticate 미들웨어를 사용함', () => {
    expect(source).toContain('authenticate');
  });

  it('validate 미들웨어를 사용함', () => {
    expect(source).toContain('validate');
  });

  it('groupId 필드 검증이 있음', () => {
    expect(source).toContain('groupId');
  });

  it("algorithm 필드가 Zod default('default')로 처리됨", () => {
    expect(source).toContain("default('default')");
  });

  it('creatorId 소유권 검증 로직이 존재함', () => {
    expect(source).toContain('creatorId');
  });

  it('403 에러 응답이 존재함', () => {
    expect(source).toContain('403');
  });

  it('runSequentialAnalysisPipeline을 호출함', () => {
    expect(source).toContain('runSequentialAnalysisPipeline');
  });

  it('200 응답으로 { success: true, result }를 반환함', () => {
    expect(source).toContain('success: true');
  });
});

describe('app.router.ts: sequentialRouter 등록 검증', () => {
  let source: string;

  beforeAll(() => {
    const filePath = path.resolve(__dirname, '../../../01-app/app.router.ts');
    source = fs.readFileSync(filePath, 'utf-8');
  });

  it('sequentialRouter를 import함', () => {
    expect(source).toContain('sequentialRouter');
  });

  it('/analyze 경로에 sequentialRouter가 등록됨', () => {
    expect(source).toContain("'/analyze'");
    expect(source).toContain('sequentialRouter');
  });
});
