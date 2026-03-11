/**
 * measurement.service.ts — 올바른 Python 진입점 spawn 검증
 *
 * 수정 이후 measurement.service.ts는:
 *   - core.main을 올바른 진입점으로 사용함
 *   - groupId와 subjectIndex를 위치 인수로 전달함
 *   - SESSION_ID 환경변수를 사용하지 않음
 */

import * as fs from 'fs';
import * as path from 'path';

describe('measurement.service.ts: 올바른 Python 진입점 spawn 검증', () => {
  let serviceSource: string;
  let streamerSource: string;
  let mainSource: string;

  beforeAll(() => {
    const servicePath = path.resolve(__dirname, 'measurement.service.ts');
    serviceSource = fs.readFileSync(servicePath, 'utf-8');

    // __dirname 기준으로 data-engine 경로 해석함
    const engineRoot = path.resolve(
      __dirname,
      '..',
      '..',
      '..',
      '..',
      '..',
      'mind-signal-data-engine',
    );
    streamerSource = fs.readFileSync(
      path.join(engineRoot, 'core', 'streamer.py'),
      'utf-8',
    );
    mainSource = fs.readFileSync(
      path.join(engineRoot, 'core', 'main.py'),
      'utf-8',
    );
  });

  it('서비스가 core.main을 올바른 진입점으로 사용함', () => {
    expect(serviceSource).toContain("'core.main'");
  });

  it('서비스가 core.streamer를 사용하지 않음', () => {
    expect(serviceSource).not.toContain("'core.streamer'");
  });

  it('서비스가 groupId를 위치 인수로 전달함', () => {
    expect(serviceSource).toContain('groupId');
  });

  it('서비스가 subjectIndex를 위치 인수로 전달함', () => {
    expect(serviceSource).toContain('subjectIndex');
  });

  it('서비스가 SESSION_ID 환경변수를 사용하지 않음', () => {
    expect(serviceSource).not.toContain('SESSION_ID');
  });

  it('core/streamer.py에 __main__ 블록이 없음 — 모듈로 실행 시 즉시 종료됨', () => {
    expect(streamerSource).not.toContain('__main__');
  });

  it('core/main.py에 __main__ 블록이 있음 — 올바른 진입점임', () => {
    expect(mainSource).toContain('__main__');
  });

  it('core/main.py가 sys.argv[1]로 groupId를 받음', () => {
    expect(mainSource).toContain('sys.argv[1]');
  });

  it('core/main.py가 sys.argv[2]로 subjectIndex를 받음', () => {
    expect(mainSource).toContain('sys.argv[2]');
  });
});
