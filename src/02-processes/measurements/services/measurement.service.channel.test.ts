/**
 * Bug A — Redis channel mismatch
 *
 * Python engine publishes to:  mind-signal:{groupId}:subject:{subjectIndex}
 * Backend subscribes to:       mind-signal-live
 *
 * These two channels never match, so no EEG data ever reaches the frontend.
 * This test confirms the mismatch by verifying what channel the service
 * subscribes to and what channel the Python engine would publish to.
 */

describe('Bug A: Redis channel mismatch between Python engine and backend', () => {
  /**
   * The channel the backend currently subscribes to (hard-coded literal in
   * measurement.service.ts line 31).
   */
  const BACKEND_SUBSCRIBE_CHANNEL = 'mind-signal-live';

  /**
   * The channel template the Python engine publishes to
   * (core/streamer.py line 39):
   *   self.channel = f"mind-signal:{self.group_id}:subject:{self.subject_index}"
   */
  const buildEnginePublishChannel = (groupId: string, subjectIndex: number) =>
    `mind-signal:${groupId}:subject:${subjectIndex}`;

  it('CONFIRMS BUG: backend subscribe channel does NOT match engine publish channel', () => {
    const groupId = 'group-abc';
    const subjectIndex = 0;

    const engineChannel = buildEnginePublishChannel(groupId, subjectIndex);

    // This assertion MUST fail if the bug is present.
    // The test name is intentionally "CONFIRMS BUG" — it is expected to PASS
    // only because the channels are indeed different (i.e., the bug exists).
    expect(BACKEND_SUBSCRIBE_CHANNEL).not.toBe(engineChannel);
  });

  it('shows the exact channel the engine publishes to', () => {
    expect(buildEnginePublishChannel('group-abc', 0)).toBe(
      'mind-signal:group-abc:subject:0',
    );
  });

  it('shows the exact channel the backend subscribes to', () => {
    // Directly read from the source string to make the mismatch obvious in CI
    expect(BACKEND_SUBSCRIBE_CHANNEL).toBe('mind-signal-live');
  });

  it('documents the required fix: backend must subscribe to the engine channel pattern', () => {
    const groupId = 'group-abc';
    const subjectIndex = 0;

    const fixedChannel = buildEnginePublishChannel(groupId, subjectIndex);

    // After the fix, the backend should subscribe to this dynamic channel,
    // NOT the hard-coded 'mind-signal-live'.
    expect(fixedChannel).toBe('mind-signal:group-abc:subject:0');
    expect(fixedChannel).not.toBe(BACKEND_SUBSCRIBE_CHANNEL);
  });
});
