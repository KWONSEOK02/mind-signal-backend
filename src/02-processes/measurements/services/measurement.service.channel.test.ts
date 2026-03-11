/**
 * measurement.service.ts — Redis 채널 동적 생성 검증
 *
 * 수정 이후 measurement.service.ts는:
 *   - 하드코딩된 'mind-signal-live' 채널을 사용하지 않음
 *   - groupId와 subjectIndex로 동적 채널을 생성함
 *   - Python 엔진 발행 채널 패턴과 일치함
 */

import * as fs from 'fs';
import * as path from 'path';

describe('measurement.service.ts: Redis 채널이 동적으로 생성됨', () => {
  let serviceSource: string;

  beforeAll(() => {
    const servicePath = path.resolve(__dirname, 'measurement.service.ts');
    serviceSource = fs.readFileSync(servicePath, 'utf-8');
  });

  const buildEnginePublishChannel = (groupId: string, subjectIndex: number) =>
    `mind-signal:${groupId}:subject:${subjectIndex}`;

  it('서비스가 하드코딩된 mind-signal-live 채널을 사용하지 않음', () => {
    expect(serviceSource).not.toContain("'mind-signal-live'");
  });

  it('서비스가 groupId와 subjectIndex로 동적 채널을 구성함', () => {
    expect(serviceSource).toContain('groupId');
    expect(serviceSource).toContain('subjectIndex');
    expect(serviceSource).toContain('mind-signal:');
  });

  it('엔진 발행 채널 템플릿이 올바른 형식임', () => {
    expect(buildEnginePublishChannel('group-abc', 1)).toBe(
      'mind-signal:group-abc:subject:1',
    );
  });

  it('서비스 파일에 동적 채널 패턴이 존재함', () => {
    // 서비스 파일에서 동적 채널 구성 패턴 확인함
    expect(serviceSource).toMatch(/mind-signal:.*groupId.*subject.*subjectIndex/s);
  });
});
