/**
 * Bug C — Wrong Python entry point spawned
 *
 * measurement.service.ts line 42 spawns:
 *   python -m core.streamer
 *
 * core/streamer.py contains only a class definition (MindSignalStreamer).
 * There is NO `if __name__ == "__main__"` block, so running it as a module
 * causes Python to import the file and exit immediately — no streaming happens.
 *
 * The correct entry point is core/main.py which:
 *   - Reads sys.argv[1] (groupId) and sys.argv[2] (subjectIndex)
 *   - Instantiates MindSignalStreamer with those arguments
 *   - Calls streamer.open() to start the EEG stream
 *
 * Correct spawn call:
 *   spawn('python', ['-m', 'core.main', groupId, subjectIndex], { cwd: enginePath })
 *
 * Additionally, the current spawn passes SESSION_ID via env but core.main expects
 * groupId and subjectIndex as positional argv arguments, not env vars.
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Bug C: Wrong Python entry point spawned in measurement.service.ts', () => {
  let serviceSource: string;
  let streamerSource: string;
  let mainSource: string;

  beforeAll(() => {
    const servicePath = path.resolve(__dirname, 'measurement.service.ts');
    serviceSource = fs.readFileSync(servicePath, 'utf-8');

    // Resolve the data-engine path relative to this test file.
    // __dirname = .../Team-project/mind-signal-backend/src/02-processes/measurements/services
    // 5 levels up  = .../Team-project
    // then step into the sibling mind-signal-data-engine folder
    const engineRoot = path.resolve(__dirname, '..', '..', '..', '..', '..', 'mind-signal-data-engine');
    streamerSource = fs.readFileSync(
      path.join(engineRoot, 'core', 'streamer.py'),
      'utf-8',
    );
    mainSource = fs.readFileSync(
      path.join(engineRoot, 'core', 'main.py'),
      'utf-8',
    );
  });

  it('CONFIRMS BUG: service spawns core.streamer (wrong module)', () => {
    expect(serviceSource).toContain("'core.streamer'");
  });

  it('CONFIRMS BUG: core/streamer.py has no __main__ block — exits immediately when run as module', () => {
    expect(streamerSource).not.toContain('__main__');
  });

  it('core/main.py HAS a __main__ block — it is the correct entry point', () => {
    expect(mainSource).toContain('__main__');
  });

  it('core/main.py requires groupId and subjectIndex as positional argv arguments', () => {
    expect(mainSource).toContain('sys.argv[1]');
    expect(mainSource).toContain('sys.argv[2]');
  });

  it('service does NOT pass groupId or subjectIndex to the spawned process', () => {
    // The current spawn only passes SESSION_ID via env, but core.main
    // expects groupId/subjectIndex as argv — so even if the module were
    // corrected, the arguments would still be missing.
    expect(serviceSource).toContain('SESSION_ID');
    expect(serviceSource).not.toContain('groupId');
    expect(serviceSource).not.toContain('subjectIndex');
  });

  it('documents the required fix', () => {
    /**
     * In measurement.service.ts, replace:
     *
     *   const pythonProcess = spawn('python', ['-m', 'core.streamer'], {
     *     cwd: enginePath,
     *     env: { ...process.env, SESSION_ID: sessionId.toString() },
     *   });
     *
     * With (where groupId and subjectIndex come from the session document):
     *
     *   const pythonProcess = spawn(
     *     'python',
     *     ['-m', 'core.main', session.groupId, String(session.subjectIndex)],
     *     { cwd: enginePath, env: { ...process.env } },
     *   );
     *
     * And the Redis subscribe channel must also change to match (see Bug A fix).
     */
    expect(true).toBe(true);
  });
});
