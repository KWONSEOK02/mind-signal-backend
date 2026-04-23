/**
 * timestamp-aligner.service.ts
 *
 * 두 subject EEG 샘플을 서버 ingest 타임스탬프 기준으로 정렬하는
 * 모듈 레벨 레지스트리 (Phase 16 Wave 1 skeleton).
 *
 * Wave 2 BE-dispatch-agent: ingest / flush 본 구현 담당.
 * flush 호출 주체 (v9 R9-H-2): subscribeWithAligner(groupId) 내부
 * setInterval(() => timestampAlignerRegistry.flush(groupId), 100) 기동,
 * unsubscribeGroupChannels(groupId) 헬퍼에서 clearInterval 처리.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * 단일 EEG 주파수 대역 파워 값.
 * TODO Wave 2: 기존 타입 정의 발견 시 해당 import로 교체할 것.
 */
export interface WavePower {
  delta: number;
  theta: number;
  alpha: number;
  beta: number;
  gamma: number;
}

/**
 * 두 subject 샘플이 타임스탬프 기준으로 정렬된 쌍.
 * v7 H-PREP-1 / v8 H-1: subjectIndex 1-based 통일.
 */
export interface AlignedSample {
  groupId: string;
  timestamp_ms: number;
  subject_1: WavePower | null;
  subject_2: WavePower | null;
}

// ---------------------------------------------------------------------------
// Internal class
// ---------------------------------------------------------------------------

/**
 * 단일 groupId 전용 타임스탬프 정렬기.
 * ingest / flush 본 구현은 Wave 2 BE-dispatch-agent 담당.
 */
class TimestampAligner {
  /** subjectIndex(1 또는 2) 별 미처리 샘플 버퍼 */
  private buffer: Map<number, Array<{ ts: number; sample: WavePower }>> =
    new Map();

  /**
   * @param toleranceMs - 두 subject 타임스탬프 허용 오차(ms). 기본 200ms (plan-review M-4)
   */
  constructor(private toleranceMs: number) {}

  /**
   * 단일 subject 샘플을 버퍼에 적재함.
   * Wave 2 구현: subjectIndex(1 또는 2) 별 buffer push.
   *
   * @param subjectIndex - 1 또는 2 (1-based)
   * @param sample - EEG 주파수 대역 파워 값
   * @param serverTimestamp - BE ingest 시각 (Date.now())
   */
  ingest(
    subjectIndex: number,
    sample: WavePower,
    serverTimestamp: number
  ): void {
    // TODO Wave 2 BE-dispatch-agent: subjectIndex 별 buffer push 구현
    void subjectIndex;
    void sample;
    void serverTimestamp;
    void this.toleranceMs;
    void this.buffer;
  }

  /**
   * 버퍼 스캔 후 정렬 가능한 쌍 반환함.
   * Wave 2 구현: |ts_1 - ts_2| ≤ toleranceMs 쌍 → AlignedSample 배열 반환.
   *
   * @returns 정렬된 AlignedSample 배열 (Wave 2 이전은 빈 배열)
   */
  flush(): AlignedSample[] {
    // TODO Wave 2 BE-dispatch-agent:
    //   - subjectIndex=1, 2 buffer 스캔
    //   - |ts_1 - ts_2| ≤ toleranceMs 인 쌍 생성
    //   - AlignedSample.subject_1 / subject_2 필드로 매핑
    //   - 매칭 실패 샘플 Date.now() - ts > 500ms 시 drop
    //   - 정렬된 쌍 SocketService.emitToGroup(groupId, 'aligned_pair', sample) 전송
    return [];
  }
}

// ---------------------------------------------------------------------------
// Module-level registry (plan-review H-4)
// Redis 콜백 외부 참조 가능, multi-group 동시성 지원.
// ---------------------------------------------------------------------------

const registry = new Map<string, TimestampAligner>();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const timestampAlignerRegistry = {
  /**
   * groupId 에 대한 TimestampAligner 를 가져오거나 새로 생성함.
   *
   * @param groupId - 실험 그룹 ID
   * @param toleranceMs - 타임스탬프 허용 오차 (기본 200ms)
   * @returns TimestampAligner 인스턴스
   */
  getOrCreate(groupId: string, toleranceMs: number): TimestampAligner {
    const existing = registry.get(groupId);
    if (existing) return existing;
    const aligner = new TimestampAligner(toleranceMs);
    registry.set(groupId, aligner);
    return aligner;
  },

  /**
   * 단일 subject 샘플을 해당 group 의 aligner 버퍼에 적재함.
   * Wave 2 구현: 내부 TimestampAligner.ingest() 위임.
   *
   * @param groupId - 실험 그룹 ID
   * @param subjectIndex - 1 또는 2 (1-based)
   * @param sample - EEG 주파수 대역 파워 값
   * @param serverTimestamp - BE ingest 시각 (Date.now())
   */
  ingest(
    groupId: string,
    subjectIndex: number,
    sample: WavePower,
    serverTimestamp: number
  ): void {
    // TODO Wave 2 BE-dispatch-agent: getOrCreate 후 aligner.ingest() 호출
    void groupId;
    void subjectIndex;
    void sample;
    void serverTimestamp;
  },

  /**
   * 해당 group 의 버퍼를 스캔하여 정렬된 쌍을 반환함.
   * flush 호출 주체 (v9 R9-H-2): subscribeWithAligner 내부 setInterval(100).
   *
   * @param groupId - 실험 그룹 ID
   * @returns 정렬된 AlignedSample 배열 (Wave 2 이전은 빈 배열)
   */
  flush(groupId: string): AlignedSample[] {
    // TODO Wave 2 BE-dispatch-agent: aligner.flush() 호출 후 결과 반환
    void groupId;
    return [];
  },

  /**
   * groupId 에 해당하는 aligner 를 레지스트리에서 제거하고 리소스 해제함.
   * stopMeasurementService 에서 DUAL_2PC allCompleted 시 호출됨.
   *
   * @param groupId - 실험 그룹 ID
   */
  cleanup(groupId: string): void {
    registry.delete(groupId);
  },

  /**
   * 테스트 격리용 — 전역 registry 전체 초기화함 (v2 Med-1).
   * Jest beforeEach 에서만 호출할 것. 프로덕션 코드에서 호출 금지.
   *
   * @example
   * ```ts
   * beforeEach(() => timestampAlignerRegistry.__resetForTest__());
   * ```
   */
  __resetForTest__(): void {
    registry.clear();
  },
};
