/**
 * app.ts — SocketService.init() 정상 호출 검증
 *
 * 수정 이후 app.ts는:
 *   - http.createServer()로 서버 인스턴스를 생성함
 *   - SocketService.init(server)을 호출함
 *   - server.listen()으로 서버를 시작함
 *   - app.listen()을 직접 호출하지 않음
 */

import * as fs from 'fs';
import * as path from 'path';

describe('app.ts: SocketService.init()이 올바르게 호출됨', () => {
  let appSource: string;

  beforeAll(() => {
    const appPath = path.resolve(__dirname, 'app.ts');
    appSource = fs.readFileSync(appPath, 'utf-8');
  });

  it('app.ts가 SocketService를 임포트함', () => {
    expect(appSource).toContain('SocketService');
  });

  it('app.ts가 SocketService.init()을 호출함', () => {
    expect(appSource).toContain('SocketService.init');
  });

  it('app.ts가 app.listen()을 직접 호출하지 않음', () => {
    expect(appSource).not.toContain('app.listen(');
  });

  it('app.ts가 http.createServer()로 서버 인스턴스를 생성함', () => {
    expect(appSource).toContain('createServer');
  });

  it('app.ts가 server.listen()으로 서버를 시작함', () => {
    expect(appSource).toContain('server.listen(');
  });
});
