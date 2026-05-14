# PAAR — Phase G slice (deep-module PoC Step 4b — Claude 4-Lens 반박)

> 날짜: 2026-05-13
> 단계: H-deep-module-poc Step 4b (Claude 4-Lens 반박)
> 선행: `paar-2026-05-13-deep-module-poc-codex-r1.md` (Step 4a — codex 5.5 1차)
> 다음: Step 4c — codex 5.5 2차 재응답
> 검토 단위: codex r1 응답 (Q1 / Q2 / Q3) 각 항목별 4-Lens 적용 + Claude 단독 발견

---

## 0. 4-Lens 정의 (DISCUSS.md / HANDOFF.md §6 박제 정합)

| Lens | 적용 질문 | 통과 조건 |
|---|---|---|
| Lens 1 — Contract | codex 응답이 인용한 Matt Pocock 원리 (LANGUAGE.md 7 terms)가 실제 코드에 적용 가능한가? | 인용 원리가 mermaid + 코드 양쪽 정합 |
| Lens 2 — Reality | codex 응답이 mermaid 외 정보를 환각으로 추가하지 않았나? | 모든 가설이 코드 read로 검증됨 |
| Lens 3 — Completeness | codex가 놓친 shallow / seam / 후보가 있는가? | Claude 단독 후보 ≥ 1건 |
| Lens 4 — Runtime Contract | codex 제안이 Phase G BDD 3 시나리오 invariant를 깨뜨리는가? | invariant 보존 + 회귀 0 정합 |

---

## 1. Lens 1 — Contract (codex 인용 원리 정합성)

### 1.1 Q1 PS shallow 의심 — 4 원리 동시 인용
- codex: Depth + Deletion test + Locality + Adapter/Seam
- **검증**:
  - Depth: PS interface 2개 (`execute`, `drainRecordedEvents`) vs implementation 5단계 흐름 (L58-109) → 정성 비교상 Depth 후보 정합 ✅
  - Deletion test: PS 제거 시 책임 분산 가설 — PS L65, L72, L78, L94, L106 5개 호출 지점 모두 caller(controller 또는 BDD test)로 흩어질 → 정합 ✅
  - Locality: 페어링 invariant + 만료 처리 + 이벤트 기록 3개 책임이 PS에 집중 → "change concentrates at one place" 정합 ✅
  - Adapter/Seam: D-3 hypothetical seam 직접 인용 → 정합 ✅
- **결론**: 4 원리 모두 LANGUAGE.md 정합 인용 ✅

### 1.2 Q2 §2.4 D-4 value-object 권고 — 인용 원리 위치 검토
- codex 권고: `SessionId` / `ObjectIdParser` value-object
- 인용 위치: codex는 "INTERFACE-DESIGN.md §design twice" 명시 인용 없음. 일반 DDD value-object 개념으로만 제시.
- **반박**: 본 권고는 LANGUAGE.md 7 terms 영역이 아닌 INTERFACE-DESIGN.md §"design twice" 또는 DDD value-object 영역. **Pass 기준 B (adapter 후보 ≥ 3)에서는 D-4를 후보에서 제외**하는 것이 codex 응답의 함의 (codex 본인이 "adapter 누락이라고 단정하지 않음" 명시).
- **결론**: codex 응답 자체는 정합하나, B 기준 매칭에서 D-4를 제외하는 것이 더 정확 — paar-depth §4 사전 인벤토리도 D-4를 별도 port 불필요로 박제했으므로 정합 ✅

### 1.3 Lens 1 통과 ✅

---

## 2. Lens 2 — Reality (codex 환각 검증)

### 2.1 Q1 SA "isExpired interface가 시간 제어를 드러내지 못함"
- **코드 검증**: `session.aggregate.ts:162-164`
  ```typescript
  isExpired(): boolean {
    return this._expiresAt.getTime() < Date.now();
  }
  ```
- **결론**: codex 가설 정합 ✅
  - no-arg 메서드 + 내부 `Date.now()` 호출 = caller가 시간 제어 불가
  - 테스트 시 `jest.useFakeTimers` 또는 시스템 시간 조작 외 대안 없음 (port 부재)

### 2.2 Q2 §2.4 D-4 ObjectId.isValid
- **코드 검증**: `pair-subject.service.ts:60`
  ```typescript
  if (!Types.ObjectId.isValid(input.userId)) {
    throw new AppError('유효하지 않은 사용자 ID 형식입니다', 400);
  }
  ```
- **결론**: codex 가설 정합 ✅
  - `import { Types } from 'mongoose'` (L22) — feature service가 persistence library에 직접 의존
  - codex 권고대로 `SessionId` value-object 도입 시 persistence concern 격리 가능

### 2.3 Q1 PS "구현 책임이 SR, SA, D2, D3, D4로 넓게 퍼져있다"
- **코드 검증**: PS L60 (D-4) + L65 (SR.findByPairingToken) + L72 (SA.pair) + L76 (SA.isExpired 간접 D-2) + L77 (SA.expire) + L78 (SR.save) + L94 (SR.save) + L101 (`new Date()` 직접 D-2) + L106 (recordedEvents A-3 우회)
- **결론**: codex 가설 정합 ✅ — 5 의존 노드 모두 PS 본문에서 호출 확인

### 2.4 Lens 2 통과 ✅ — 환각 0건

---

## 3. Lens 3 — Completeness (codex가 놓친 Claude 단독 후보)

### 3.1 🆕 SA `cancel(_reason: CancelReason)` 파라미터 미사용
- **코드 위치**: `session.aggregate.ts:150-159`
  ```typescript
  cancel(_reason: CancelReason): void {
    if (
      this._status === 'COMPLETED' ||
      this._status === 'EXPIRED' ||
      this._status === 'CANCELLED'
    ) {
      throw new InvalidStatusTransitionError(this._status, 'CANCELLED');
    }
    this._status = 'CANCELLED';
  }
  ```
- **codex 미언급**
- **원리 위반**: LANGUAGE.md §"the interface is the test surface" — Interface가 caller에게 `reason: CancelReason`을 받지만 implementation에서 폐기 (underscore prefix `_reason`). 즉 **"Interface that lies"** 패턴.
- **분류**: Pass A 후보 추가 (A-5로 명명) — `cancel(_reason)`은 미래 확장을 위한 Sentinel signature이나 본 단계에서는 dead parameter

### 3.2 🆕 PS constructor `repo?: SessionRepository` optional default
- **코드 위치**: `pair-subject.service.ts:47-49`
  ```typescript
  constructor(repo?: SessionRepository) {
    this.repo = repo ?? new SessionRepository();
  }
  ```
- **codex 미언급**
- **원리 위반**: LANGUAGE.md §Seam + DEEPENING.md §Seam discipline — Constructor injection이 optional default fallback을 갖는다는 것은 **caller에게 "주입 안 해도 동작"이라고 신호**. Two-adapter rule 정합 (prod = `new SessionRepository()` / test = jest.mock)이지만, default fallback 자체가 seam을 약화시킴.
- **분류**: Pass A 후보 추가 (A-6) — adapter at seam이 "soft seam" (defaultable)
- **참고**: INTERFACE-DESIGN.md §"design twice"에서 권고할 수 있는 영역 (required injection vs optional fallback)

### 3.3 🆕 PS L72-91 try-catch + `isExpired()` 재호출 — Clock race
- **코드 위치**: `pair-subject.service.ts:72-83`
  ```typescript
  try {
    aggregate.pair(input.userId);
  } catch (err) {
    if (err instanceof InvalidStatusTransitionError) {
      if (aggregate.isExpired()) {  // L76 — pair()에서 isExpired 호출 후 재호출
        aggregate.expire();
        await this.repo.save(aggregate);
        throw new AppError(...401);
      }
      // ...
    }
  }
  ```
- **codex 미언급**
- **원리 위반**: LANGUAGE.md §Locality — `aggregate.pair()` 내부에서 `isExpired()` 1차 호출 (L114, throws InvalidStatusTransitionError), catch 후 PS L76에서 `isExpired()` 2차 호출. **두 시점 사이 시간 흐름** → Clock race 가능. Clock seam이 hypothetical인 직접 증거이자, Two-adapter rule 적용 시 fixedClock으로 race 제거 가능.
- **분류**: Pass A 후보 추가 (A-7) — Clock seam 부재의 직접 증거 (codex Q1 §1.2 SA 의심을 강화)

### 3.4 🆕 SA `fromDocument` invariant 검증 부재 vs `create` invariant 강제
- **코드 위치**:
  - `create()` L69-77: `pairingToken === ''` 또는 `subjectIndex < 1` 시 `InvariantViolationError` throw
  - `fromDocument()` L93-106: invariant 검증 0건. DB 도큐먼트를 그대로 신뢰
- **codex 미언급**
- **원리 위반**: LANGUAGE.md §Locality + §Depth — invariant 강제 책임이 `create` 한 곳에만 locality가 있고, `fromDocument`는 우회 통로. 즉 DB에 invariant 위반 데이터가 있으면 SA가 통과시켜 buggy aggregate 반환 가능.
- **분류**: Pass A 후보 추가 (A-8) — invariant locality 균열. mermaid에 표현되지 않은 코드 내부 책임 분포.

### 3.5 Lens 3 통과 ✅ — Claude 단독 후보 4건 (A-5/A-6/A-7/A-8)

---

## 4. Lens 4 — Runtime Contract (Phase G BDD 3 시나리오 invariant)

### 4.1 BDD 3 시나리오 (Q1 LOCK, paar-2026-05-13-deep-module-poc-slice.md 박제)
1. CREATED + valid token → PAIRED + SessionPaired event 1건
2. CREATED + expired token → EXPIRED + AppError 401
3. PAIRED + retry → AppError 400 (전이 불가)

### 4.2 codex 권고 vs BDD 시나리오 invariant 영향
| codex 권고 | invariant 영향 | 평가 |
|---|---|---|
| Q3 PS 1순위 TDD | 시나리오 추가일 뿐 — 기존 3 시나리오 보존 | ✅ 정합 |
| Δ-3 A-2 연결도 시정 (SA → A-2, PS → A-2, A-2 → D-2) | src 수정 필요 — 본 PoC는 권고만 박제, 실제 수정 X | ✅ 회귀 0 |
| Δ-4 A-3 → A-5 재명명 + 연결도 | src 수정 필요 — 본 PoC는 권고만 박제 | ✅ 회귀 0 |
| Δ-5 D-4 value-object 도입 | SessionId 도입 시 SA `pair(userId: string)` 시그니처 변경 필요 — BDD 시나리오 수정 필요 가능 | 🟡 **다음 PR 결정 영역**, 본 PoC 회귀 0 정합 |

### 4.3 Claude 단독 후보 vs BDD 시나리오 invariant 영향
| 후보 | invariant 영향 | 평가 |
|---|---|---|
| A-5 `cancel(_reason)` dead param | 시나리오 #1/#2/#3 모두 cancel 미호출 — 영향 0 | ✅ 무관 |
| A-6 PS constructor optional repo | BDD test에서 `new PairSubjectService(mockRepo)` 명시 주입 가능 — 영향 0 | ✅ 무관 |
| A-7 Clock race | 시나리오 #2 expired token — Clock seam 도입 시 시나리오 더 결정적이 됨 (개선) | ✅ 정합 |
| A-8 fromDocument invariant 부재 | 시나리오 #1 시작점이 fromDocument 경로 (DB → aggregate) — 현재 DB 데이터 유효성 가정. invariant 추가 시 시나리오 강화 | ✅ 정합 |

### 4.4 Lens 4 통과 ✅ — invariant 위반 0건, 회귀 0 유지

---

## 5. 4-Lens 종합 + Pass 기준 갱신 매칭

### 5.1 Lens 종합
| Lens | 결론 |
|---|---|
| Lens 1 Contract | ✅ codex 인용 원리 모두 LANGUAGE.md 정합 (D-4 value-object는 INTERFACE-DESIGN 영역으로 이동) |
| Lens 2 Reality | ✅ codex 응답 환각 0건 — isExpired no-arg + ObjectId.isValid 직접 의존 + 5 의존 노드 모두 코드 정합 |
| Lens 3 Completeness | ✅ Claude 단독 후보 4건 (A-5/A-6/A-7/A-8) — mermaid에 표현되지 않은 코드 내부 책임 분포 |
| Lens 4 Runtime Contract | ✅ Phase G BDD 3 시나리오 invariant 보존, 회귀 0 정합 |

### 5.2 Pass 기준 갱신 매칭
| 기준 | 사전 인벤토리 | codex r1 발견 | Claude 단독 추가 | Step 4b 잠정 결과 |
|---|---|---|---|---|
| A ≥ 2 구조 문제 | 4 (A-1~A-4) | 4 (PS shallow + SA clock + D-3 hypothetical + SA interface 약함) | 4 (A-5~A-8) | **총 8 후보, 매칭 6건 (A-1/A-2/A-3 부분/A-4)** ✅ |
| B ≥ 3 adapter 후보 | 3 (D-1/D-2/D-3 → A-1/A-2/A-3) | 3 매칭 + 연결도 시정 권고 + Δ-1 localSubstitutable 분리 | 0 추가 | **3건 모두 매칭** ✅ |
| C ≥ 1 cross-LLM delta | 측정 불가 | 5 신규 (Δ-1~Δ-5) | 4 신규 (A-5~A-8) | **총 9 delta** ✅ |
| D 회귀 0 | 충족 | src 수정 0 | src 수정 0 (read-only) | **충족** ✅ |

### 5.3 잠정 GO 신호 (Step 4c codex 2차 후 최종 확정)
- A/B/C/D 4 기준 모두 잠정 충족
- 끼워맞추기 없음 — Claude 단독 후보 4건은 mermaid + 코드 read로 객관 검증 가능
- Step 4c에서 codex가 4-Lens 반박을 받아들이는지 + 추가 발견 있는지 확인 필요

---

## 6. Step 4c 진입 — codex 2차 prompt 가이드

### 6.1 전달 내용
1. codex r1 응답 (codex 자체 thread `019e1f11-50e0-7001-b4ce-2b7791d6b407` 보존)
2. 본 4-Lens 반박 요약 4건:
   - Lens 1 §1.2 — D-4 value-object 권고는 INTERFACE-DESIGN 영역 (B 기준에서 제외)
   - Lens 2 — codex 환각 0건 (isExpired no-arg + ObjectId.isValid 검증)
   - Lens 3 — Claude 단독 4건 (A-5 cancel dead param / A-6 optional repo / A-7 isExpired race / A-8 fromDocument invariant 부재)
   - Lens 4 — invariant 보존, 회귀 0 정합
3. 4 추가 후보에 대한 codex 인정/거부 + 추가 발견 요청

### 6.2 codex 2차 질문
- Q1' — Claude 단독 4건 (A-5/A-6/A-7/A-8) 각각에 대한 인정/거부 + 근거
- Q2' — 본 4-Lens 반박 중 거부할 항목? (예: D-4 value-object를 B 기준에서 제외 vs 포함 논쟁)
- Q3' — Step 5 TDD 시나리오 명세 작성 시, A-5~A-8 중 어느 후보까지 포함할지 (PoC scope vs full scope)

### 6.3 산출물
- `paar-2026-05-13-deep-module-poc-codex-r2.md`

---

## 7. 산출물 인덱스

| 종류 | 경로 |
|---|---|
| 본 PAAR | `mind-signal-backend/docs/reports/paar-2026-05-13-deep-module-poc-claude-rebuttal.md` |
| codex r1 | `paar-2026-05-13-deep-module-poc-codex-r1.md` |
| 검증한 코드 | `src/06-entities/sessions/domain/session.aggregate.ts` (L150-159, L162-164, L93-106) + `src/05-features/sessions/services/pair-subject.service.ts` (L47-49, L60, L72-83) |
| mermaid | `docs/architecture/deep-module-mermaid.{mmd, svg}` |
