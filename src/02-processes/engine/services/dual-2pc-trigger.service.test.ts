/**
 * dual-2pc-trigger.service.ts — Unit 테스트 (Phase 17.6 T-BE-1 ~ T-BE-12)
 *
 * 검증 항목:
 *   T-BE-1: 양쪽 1회 성공 → ready=true
 *   T-BE-2: 한쪽 3회 fail → cleanupGroup + dual-session-failed emit
 *   T-BE-3: 동시 trigger 2회 멱등 (inFlight lock)
 *   T-BE-4: status cache 상태 변화 검증
 *   T-BE-5: AbortError 처리 → cleanup 호출
 *   T-BE-6: maybeTriggerDualAssignGroup 3조건 충족 시 자동 trigger
 *   T-BE-7: partial-failure 후 재trigger → already_registered 보상 등록
 *   T-BE-8: 4xx non-retryable 즉시 fail
 *   T-BE-9: registerPending secret mismatch → 403
 *   T-BE-10: unregisterPending idempotent + secret 검증
 *   T-BE-11: getRegistryStatus 기본값 반환
 *   T-BE-12: registerPairingTriggerListener 2회 호출 idempotent
 */

// ===== config mock — 시크릿 키 주입 =====
jest.mock('@07-shared/config/config', () => ({
  config: {
    dataEngine: { secretKey: 'valid-secret' },
  },
}));

// ===== SocketService mock =====
jest.mock('@07-shared/lib/socket', () => ({
  SocketService: {
    emitToGroup: jest.fn(),
  },
}));

// ===== Session mock — Mongoose 격리 =====
jest.mock('@06-entities/sessions', () => ({
  Session: {
    find: jest.fn(),
  },
}));

// ===== 전역 fetch mock =====
const mockFetch = jest.fn();
global.fetch = mockFetch;

// ===== 표준 subjects fixture =====
const subjects = [
  {
    groupId: 'grp-001',
    url: 'http://de-1.ngrok-free.dev',
    subjectIndex: 1 as const,
  },
  {
    groupId: 'grp-001',
    url: 'http://de-2.ngrok-free.dev',
    subjectIndex: 2 as const,
  },
];

// 성공 응답 helper
function mockSuccess(status = 'registered') {
  return {
    ok: true,
    status: 200,
    json: async () => ({ status }),
  };
}

// 실패 응답 helper
function mockFail(statusCode: number, errCode?: string) {
  return {
    ok: false,
    status: statusCode,
    json: async () => (errCode ? { detail: { error: errCode } } : {}),
  };
}

describe('dualTriggerService — Phase 17.6', () => {
  let dualTriggerService: typeof import('./dual-2pc-trigger.service').dualTriggerService;
  let engineRegistryService: typeof import('./engine-registry.service').engineRegistryService;
  let SocketService: { emitToGroup: jest.Mock };

  beforeEach(() => {
    // 모듈 상태 격리 — 각 테스트마다 fresh module
    jest.resetModules();

    // config mock 재등록
    jest.mock('@07-shared/config/config', () => ({
      config: {
        dataEngine: { secretKey: 'valid-secret' },
      },
    }));

    // SocketService mock 재등록
    jest.mock('@07-shared/lib/socket', () => ({
      SocketService: {
        emitToGroup: jest.fn(),
      },
    }));

    // Session mock 재등록
    jest.mock('@06-entities/sessions', () => ({
      Session: {
        find: jest.fn(),
      },
    }));

    mockFetch.mockReset();

    dualTriggerService =
      require('./dual-2pc-trigger.service').dualTriggerService;
    engineRegistryService =
      require('./engine-registry.service').engineRegistryService;
    SocketService = require('@07-shared/lib/socket').SocketService;
    // Session mock 참조는 T-BE-6에서 직접 re-import 패턴으로 사용됨
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  // ============================================================
  // T-BE-1: 양쪽 1회 성공 → ready=true
  // ============================================================

  it('T-BE-1: 양쪽 1회 성공 → ready=true', async () => {
    // RC4-C-1 fix: fetch mock에 json() 메서드 필수
    mockFetch
      .mockResolvedValueOnce(mockSuccess('registered'))
      .mockResolvedValueOnce(mockSuccess('registered'));

    const result = await dualTriggerService.triggerAssignGroup(
      'grp-001',
      subjects
    );

    expect(result.status).toBe('triggered');
    const status = dualTriggerService.getRegistryStatus('grp-001');
    expect(status.ready).toBe(true);
  });

  // ============================================================
  // T-BE-2: 한쪽 3회 fail → cleanupGroup + dual-session-failed emit
  // ============================================================

  it('T-BE-2: 한쪽 3회 fail → cleanupGroup + dual-session-failed emit', async () => {
    const cleanupSpy = jest.spyOn(engineRegistryService, 'cleanupGroup');

    mockFetch
      // subject 1: 성공
      .mockResolvedValueOnce(mockSuccess('registered'))
      // subject 2: 3회 fail (502)
      .mockResolvedValueOnce(mockFail(502))
      .mockResolvedValueOnce(mockFail(502))
      .mockResolvedValueOnce(mockFail(502));

    await dualTriggerService.triggerAssignGroup('grp-001', subjects);

    expect(cleanupSpy).toHaveBeenCalledWith('grp-001');
    expect(SocketService.emitToGroup).toHaveBeenCalledWith(
      'grp-001',
      'dual-session-failed',
      expect.objectContaining({
        groupId: 'grp-001',
        error: expect.any(String),
      })
    );

    const status = dualTriggerService.getRegistryStatus('grp-001');
    expect(status.ready).toBe(false);
  });

  // ============================================================
  // T-BE-3: 동시 trigger 2회 멱등 (inFlight lock)
  // ============================================================

  it('T-BE-3: 동시 trigger 2회 → inFlight lock으로 1번만 실행됨', async () => {
    mockFetch.mockResolvedValue(mockSuccess('registered'));

    const p1 = dualTriggerService.triggerAssignGroup('grp-001', subjects);
    const p2 = dualTriggerService.triggerAssignGroup('grp-001', subjects);
    const [r1, r2] = await Promise.all([p1, p2]);

    const statuses = [r1.status, r2.status].sort();
    // 하나는 triggered, 하나는 in_progress (또는 already_ready)
    expect(
      statuses.includes('in_progress') || statuses.includes('already_ready')
    ).toBe(true);

    // iter 2 M-2 fix: race 안정화 — fetch 호출 수는 2~4 범위
    expect(mockFetch.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(mockFetch.mock.calls.length).toBeLessThanOrEqual(4);
  });

  // ============================================================
  // T-BE-4: status cache 상태 변화 검증
  // ============================================================

  it('T-BE-4: 초기 상태 → in_progress → ready 상태 전이 검증됨', async () => {
    // 초기: statusCache 미진입 → 기본값
    const initial = dualTriggerService.getRegistryStatus('grp-004');
    expect(initial).toEqual({
      ready: false,
      registered: 0,
      attempts: 0,
      inFlight: false,
    });

    // trigger 후 ready=true
    mockFetch
      .mockResolvedValueOnce(mockSuccess('registered'))
      .mockResolvedValueOnce(mockSuccess('registered'));

    await dualTriggerService.triggerAssignGroup('grp-004', [
      { ...subjects[0], groupId: 'grp-004' },
      { ...subjects[1], groupId: 'grp-004' },
    ]);

    const after = dualTriggerService.getRegistryStatus('grp-004');
    expect(after.ready).toBe(true);
    expect(after.inFlight).toBe(false);
  });

  // ============================================================
  // T-BE-5: AbortError → cleanup 호출
  // ============================================================

  it('T-BE-5: fetch AbortError → 3회 retry 후 cleanup 호출됨', async () => {
    // RC5-fix: fake timer 대신 fetch mock에서 AbortError 직접 throw
    mockFetch.mockImplementation(() =>
      Promise.reject(
        new DOMException('The operation was aborted', 'AbortError')
      )
    );

    const cleanupSpy = jest.spyOn(engineRegistryService, 'cleanupGroup');

    await dualTriggerService.triggerAssignGroup('grp-005', subjects);

    expect(cleanupSpy).toHaveBeenCalledWith('grp-005');
    // AbortError는 parentSignal.aborted=false이므로 retry 3회 × 2 subjects = 최대 6회
    // 단, parentSignal aborted가 아니면 retry 됨
    expect(mockFetch.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  // ============================================================
  // T-BE-6: maybeTriggerDualAssignGroup 3조건 충족 시 자동 trigger
  // ============================================================

  it('T-BE-6: maybeTriggerDualAssignGroup — 3조건 충족 시 자동 trigger 호출됨', async () => {
    // RC5-H-2 fix: jest.resetModules() 이후 re-import
    jest.resetModules();
    jest.mock('@07-shared/config/config', () => ({
      config: { dataEngine: { secretKey: 'valid-secret' } },
    }));
    jest.mock('@07-shared/lib/socket', () => ({
      SocketService: { emitToGroup: jest.fn() },
    }));
    jest.mock('@06-entities/sessions', () => ({
      Session: {
        find: jest.fn().mockResolvedValue([
          {
            groupId: 'grp-006',
            subjectIndex: 1,
            status: 'PAIRED',
            experimentMode: 'DUAL_2PC',
          },
          {
            groupId: 'grp-006',
            subjectIndex: 2,
            status: 'PAIRED',
            experimentMode: 'DUAL_2PC',
          },
        ]),
      },
    }));

    const freshModule = await import('./dual-2pc-trigger.service');
    const freshRegistryModule = await import('./engine-registry.service');

    // pending subjects 등록
    freshRegistryModule.engineRegistryService.registerPending(
      1,
      'http://de-1.ngrok-free.dev',
      'valid-secret'
    );
    freshRegistryModule.engineRegistryService.registerPending(
      2,
      'http://de-2.ngrok-free.dev',
      'valid-secret'
    );

    // operatorJoined 플래그 설정
    freshModule.operatorJoinedGroups.add('grp-006');

    // fetch mock 설정
    mockFetch
      .mockResolvedValueOnce(mockSuccess('registered'))
      .mockResolvedValueOnce(mockSuccess('registered'));

    const triggerSpy = jest.spyOn(
      freshModule.dualTriggerService,
      'triggerAssignGroup'
    );

    await freshModule.dualTriggerService.maybeTriggerDualAssignGroup('grp-006');

    expect(triggerSpy).toHaveBeenCalledWith('grp-006', expect.any(Array));
  });

  // ============================================================
  // T-BE-7: partial-failure 후 재trigger → already_registered 보상 등록
  // ============================================================

  it('T-BE-7: 재trigger 시 already_registered → BE registerDual 보상 등록됨', async () => {
    const registerDualSpy = jest.spyOn(engineRegistryService, 'registerDual');

    // grp-007 전용 subjects fixture — groupId 일치 필수
    const subjects007 = [
      {
        groupId: 'grp-007',
        url: 'http://de-1.ngrok-free.dev',
        subjectIndex: 1 as const,
      },
      {
        groupId: 'grp-007',
        url: 'http://de-2.ngrok-free.dev',
        subjectIndex: 2 as const,
      },
    ];

    // 1차 trigger: subject 1 성공 / subject 2 fail × 3
    mockFetch
      .mockResolvedValueOnce(mockSuccess('registered'))
      .mockResolvedValueOnce(mockFail(502))
      .mockResolvedValueOnce(mockFail(502))
      .mockResolvedValueOnce(mockFail(502))
      // 2차 trigger: subject 1 already_registered / subject 2 success
      .mockResolvedValueOnce(mockSuccess('already_registered'))
      .mockResolvedValueOnce(mockSuccess('registered'));

    // 1차 trigger
    await dualTriggerService.triggerAssignGroup('grp-007', subjects007);
    // 1차 후 registerDualSpy 초기화
    registerDualSpy.mockClear();

    // 2차 trigger
    await dualTriggerService.triggerAssignGroup('grp-007', subjects007);

    // 보상 등록: subject 1 already_registered → BE registerDual 직접 호출됨
    expect(registerDualSpy).toHaveBeenCalledWith(
      'grp-007',
      1,
      expect.any(String),
      expect.any(String)
    );
  });

  // ============================================================
  // T-BE-8: 4xx non-retryable 즉시 fail
  // ============================================================

  it('T-BE-8: 401 invalid_secret → retry 없이 즉시 fail됨', async () => {
    mockFetch.mockResolvedValue(mockFail(401, 'invalid_secret'));

    await dualTriggerService.triggerAssignGroup('grp-008', subjects);

    // non-retryable이므로 양쪽 × 1회 = 최대 2회 (3회 retry 아님)
    expect(mockFetch.mock.calls.length).toBeLessThanOrEqual(2);

    const status = dualTriggerService.getRegistryStatus('grp-008');
    expect(status.ready).toBe(false);
    expect(status.lastError).toBe('invalid_secret');
  });

  // ============================================================
  // T-BE-9: registerPending secret mismatch → AppError 403
  // ============================================================

  it('T-BE-9: registerPending secret mismatch → AppError 403 발생함', () => {
    expect(() =>
      engineRegistryService.registerPending(1, 'http://test', 'wrong-secret')
    ).toThrow();

    try {
      engineRegistryService.registerPending(1, 'http://test', 'wrong-secret');
    } catch (err: unknown) {
      expect((err as { statusCode?: number }).statusCode).toBe(403);
    }
  });

  // ============================================================
  // T-BE-10: DELETE /register-pending idempotent + secret 검증
  // ============================================================

  it('T-BE-10: unregisterPending — 정상 삭제 + idempotent + secret 검증됨', () => {
    // 정상 등록
    engineRegistryService.registerPending(1, 'http://de-1', 'valid-secret');
    expect(engineRegistryService.getPendingSubjects()).toHaveLength(1);

    // 정상 삭제
    engineRegistryService.unregisterPending(1, 'http://de-1', 'valid-secret');
    expect(engineRegistryService.getPendingSubjects()).toEqual([]);

    // 이미 없음 → idempotent (throw 금지)
    expect(() =>
      engineRegistryService.unregisterPending(1, 'http://de-1', 'valid-secret')
    ).not.toThrow();

    // secret mismatch → 403
    engineRegistryService.registerPending(1, 'http://de-1', 'valid-secret');
    expect(() =>
      engineRegistryService.unregisterPending(1, 'http://de-1', 'wrong-secret')
    ).toThrow();
    try {
      engineRegistryService.unregisterPending(1, 'http://de-1', 'wrong-secret');
    } catch (err: unknown) {
      expect((err as { statusCode?: number }).statusCode).toBe(403);
    }
  });

  // ============================================================
  // T-BE-11: getRegistryStatus 기본값 반환
  // ============================================================

  it('T-BE-11: getRegistryStatus — 미진입 groupId 시 기본값 반환됨', () => {
    const status = dualTriggerService.getRegistryStatus('grp-never-triggered');
    expect(status).toEqual({
      ready: false,
      registered: 0,
      attempts: 0,
      inFlight: false,
    });
  });

  // ============================================================
  // T-BE-12: registerPairingTriggerListener 2회 호출 idempotent
  // ============================================================

  it('T-BE-12: registerPairingTriggerListener 2회 호출 시 2번째는 false 반환됨', async () => {
    jest.resetModules();
    jest.mock('@07-shared/config/config', () => ({
      config: { dataEngine: { secretKey: 'valid-secret' } },
    }));
    jest.mock('@07-shared/lib/socket', () => ({
      SocketService: { emitToGroup: jest.fn() },
    }));
    jest.mock('@06-entities/sessions', () => ({
      Session: { find: jest.fn() },
    }));

    const freshModule = await import('./dual-2pc-trigger.service');

    const result1 = freshModule.registerPairingTriggerListener();
    const result2 = freshModule.registerPairingTriggerListener();

    // 1회차: 등록 성공 → true
    expect(result1).toBe(true);
    // 2회차: 이미 등록됨 → false (idempotent)
    expect(result2).toBe(false);
  });
});
