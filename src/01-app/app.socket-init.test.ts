/**
 * Bug B — SocketService.init() is never called in app.ts
 *
 * app.ts calls `app.listen(PORT)` directly on the Express app, which means
 * no `http.Server` instance is created and passed to SocketService.init().
 * As a result Socket.io is never attached to the HTTP server, and every call
 * to SocketService.emitLiveEvent() silently does nothing (the private `io`
 * field stays undefined; the guard `if (this.io)` short-circuits without error).
 *
 * This test confirms the bug by reading the actual app startup code and
 * verifying that SocketService.init is not invoked.
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Bug B: SocketService.init() never called in app.ts', () => {
  let appSource: string;

  beforeAll(() => {
    const appPath = path.resolve(__dirname, 'app.ts');
    appSource = fs.readFileSync(appPath, 'utf-8');
  });

  it('CONFIRMS BUG: app.ts does NOT import SocketService', () => {
    // SocketService must be imported before it can be initialized.
    expect(appSource).not.toContain('SocketService');
  });

  it('CONFIRMS BUG: app.ts does NOT call SocketService.init()', () => {
    expect(appSource).not.toContain('SocketService.init');
  });

  it('CONFIRMS BUG: app.ts calls app.listen() directly instead of server.listen()', () => {
    // Direct `app.listen()` produces a plain net.Server that never gets
    // attached to Socket.io.
    expect(appSource).toContain('app.listen(');
  });

  it('CONFIRMS BUG: app.ts does NOT create an http.createServer() instance', () => {
    // The fix requires: const server = http.createServer(app)
    expect(appSource).not.toContain('createServer');
  });

  it('documents the required fix', () => {
    /**
     * Required changes to app.ts:
     *
     * 1. Add:  import http from 'http';
     * 2. Add:  import { SocketService } from '@07-shared/lib/socket';
     * 3. Replace:
     *      app.listen(PORT, '0.0.0.0', () => { ... });
     *    With:
     *      const server = http.createServer(app);
     *      SocketService.init(server);
     *      server.listen(PORT, '0.0.0.0', () => { ... });
     */
    expect(true).toBe(true); // placeholder assertion — intent is in the comment above
  });
});
