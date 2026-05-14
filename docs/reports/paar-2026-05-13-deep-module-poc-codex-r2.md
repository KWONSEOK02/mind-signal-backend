# PAAR — Phase G slice (deep-module PoC Step 4c — codex 5.5 2차 재응답)

> 날짜: 2026-05-13
> 단계: H-deep-module-poc Step 4c (codex 5.5 2차)
> 선행: `paar-2026-05-13-deep-module-poc-claude-rebuttal.md` (Step 4b — Claude 4-Lens 반박)
> 다음: Step 5 — TDD 시나리오 명세 추출
> codex r2 thread: `019e1f19-f5b3-7150-90b7-e71bd3066b23`
> 모델: gpt-5.5 / sandbox: read-only / cwd: `mind-signal-backend`

---

## 0. 호출 메타

- 호출 도구: `mcp__codex__codex` (별 thread — r1 thread 컨텍스트 미상속, r1 결론을 prompt에 재인용)
- prompt 길이: 약 7.8KB (r1 요약 + Claude 4-Lens 반박 4건 + Q1'/Q2'/Q3' 3 질문)
- 응답 길이: 약 5.4KB

---

## 1. Q1' — Claude 단독 4건 인정/거부

### 1.1 A-5 `cancel(_reason)` — **부분 인정**
- LANGUAGE.md "Interface = caller가 올바르게 쓰기 위해 알아야 하는 모든 것" 및 "the interface is the test surface" 기준 정합
- 강도 중간 이하 — "shallow module"보다 **거짓 interface / 미완성 domain invariant**에 가까움
- 수정 방향: `reason` 제거 또는 aggregate 상태에 보존 또는 cancellation event에 포함
- **Step 5 1순위 TDD 후보는 아님**

### 1.2 A-6 PS constructor `repo?` optional default — **부분 인정**
- DEEPENING.md "One adapter means a hypothetical seam. Two adapters means a real one" + "Internal seams vs external seams" 정합
- 강도 — **composition root 부재 / soft seam**으로 분류
- 약화 요소: `constructor(repo?: SessionRepository)`가 테스트용 stand-in을 실제로 받을 수 있음
- 핵심 문제: PS가 `new SessionRepository()`까지 알아서 concrete persistence를 생성하는 점
- **A-1 repository seam을 정리할 때 같이 다룰 부속 후보**

### 1.3 A-7 PS try-catch + `isExpired()` 재호출 Clock race — **강하게 인정**
- LANGUAGE.md §Locality "change, bugs, knowledge, verification concentrate at one place" 위반
- DEEPENING.md "the interface is the test surface" — 고정 clock 없이 결정적 테스트 불가
- **codex 추가 발견**: PAIRED 상태에서 첫 `isExpired()` false → catch 두 번째 `isExpired()` true 시:
  - service가 expired branch 진입 → `aggregate.expire()` 호출
  - 그러나 `expire()` L142-147은 status !== 'CREATED' 시 `InvalidStatusTransitionError` throw
  - **결과: 다른 transition error 새로 발생 가능** — try-catch 외부로 새어나가는 실제 버그 트리거 가능성
- **결정: 강한 인정** — r1의 SA Clock seam 의심을 PS runtime flow에서 강화하는 직접 증거

### 1.4 A-8 SA `fromDocument` invariant 검증 부재 — **인정, invariant locality 후보로 분류**
- LANGUAGE.md §Locality + §Depth — `create()` 경로와 `fromDocument()` 경로 invariant 규칙 비대칭
- "Interface includes invariants" 정의 위반
- **codex 추가 발견**: repository `toAggregate()`가 `doc.subjectIndex ?? 0`으로 hydrate → schema nullable이 aggregate 내부 invalid 값(0)으로 진입 가능. **A-8 위반의 실제 우회 통로 직접 증거**
- 약화 요소: hydration factory가 DB를 신뢰하는 전략은 흔함. schema/repository가 invariant 일부 담당 가능
- 그러나 이 코드에서는 schema가 `subjectIndex` min을 강제하지 않고 null 허용 → `fromDocument()` 무검증이 **실제 우회 통로**
- **결정: 인정** — adapter 후보가 아닌 **aggregate invariant locality 후보**

---

## 2. Q2' — 4-Lens 반박 거부할 항목

### 2.1 결론: 거부할 핵심 항목 없음
- Lens 1 §1.2 "D-4 ObjectId.isValid는 adapter 후보 ≥ 3 기준에서 제외" 분류 **정확**
- `Types.ObjectId.isValid`는 외부 라이브러리 호출이나 DEEPENING.md Ports & Adapters 대상 "remote but owned" 또는 "true external service" 성격 약함
- deterministic in-process validation 영역. "One adapter means a hypothetical seam" 기준 별도 port 근거 부족

### 2.2 codex 추가 발견 — D-4 value-object 명명 정교화
- D-4는 value-object / parser module 후보. INTERFACE-DESIGN.md "Design It Twice" 영역
- **개선된 명명 권고**: `UserIdValidatorPort`보다 `UserIdParserPort` 또는 `SubjectIdCodecPort`가 더 깊은 interface
  - 이유: 단순 boolean validation보다 "parse 성공 시 domain-safe id 반환, 실패 시 error mode 고정"이 더 깊은 interface
- **현재 PoC 기준**: B 기준 adapter count 제외, INTERFACE-DESIGN 후속 PR 영역

---

## 3. Q3' — Step 5 scope 선택

### 3.1 결정: **옵션 B — PS 1순위 + SA Clock seam (A-7) 추가**
- 옵션 A는 r1 핵심 결론 보존하나, A-7을 놓침 (가장 강하게 추가된 후보)
- 옵션 C는 PoC 가치 대비 넓음. A-5/A-6/A-8은 adapter/deepening보다 interface cleanup 또는 invariant 설계 논의에 가까움
- 검증성 PoC는 **"가장 강한 executable specification 후보"에 집중**하는 편이 적절

### 3.2 Step 5 권고 시나리오 5건

1. **PS happy path** — valid userId + valid token + CREATED + not expired → pair, save, event recorded
2. **PS expired path** — CREATED but expired → expire, save, AppError 401
3. **PS retry-after-paired** — already PAIRED → AppError 400, no expire mutation
4. **Clock seam race** (A-7) — pair 실패 후 재호출된 `isExpired()`가 다른 판단을 만들 수 있음을 고정 clock으로 명세
5. **Single observed now** (선택) — pair use case는 하나의 clock snapshot으로 만료 판단을 수행해야 함 (observable outcome 중심)

### 3.3 명세 작성 원칙 (codex 권고)
- LANGUAGE.md "the interface is the test surface" + DEEPENING.md "Tests assert on observable outcomes through the interface"
- 내부 `Date.now()` 호출 횟수보다 **observable outcome 중심**으로 명세화

---

## 4. codex r2 추가 한계 (codex 자가 박제)

1. `CancelReason`의 실제 product requirement 미확인 → A-5는 "현재 구현 기준 interface lie"로만 판단
2. `fromDocument()`가 legacy DB 복구를 의도적으로 허용하는 설계인지 ADR / 도메인 문서 미확인 → A-8 최종 severity 가설

---

## 5. Pass 기준 최종 매칭 (Step 4a + 4b + 4c 종합)

### 5.1 A 기준 ≥ 2 구조 문제

| 후보 | 사전 박제 출처 | codex r1 | Claude 반박 | codex r2 | 최종 결정 |
|---|---|---|---|---|---|
| A-1 PS hypothetical seam (importers_of=0) | paar-depth §5 | ✅ 강 매칭 | ✅ Lens 1/2 검증 | (재확인 없음) | **확정** |
| A-2 SA Clock seam 부재 | paar-depth §5 | ✅ 강 매칭 (Q1 SA) | ✅ Lens 2 isExpired no-arg 검증 | (재확인 없음) | **확정** |
| A-3 SA interface 표면 비대 (10 getters + 7-arg) | paar-depth §5 | 🟡 부분 ("Depth 명백 안 함") | (Claude 미반박) | (재확인 없음) | **부분 매칭** |
| A-4 PS event 경로 분기 (recordedEvents vs pairingListeners) | paar-depth §5 | ✅ 강 매칭 (Q1 D-3 + Q2 A-5 재명명) | ✅ Lens 4 회귀 0 정합 | (재확인 없음) | **확정** |
| A-5 SA `cancel(_reason)` Interface that lies | Step 4b Claude 단독 | (r1 미언급) | ✅ Lens 3 박제 | 🟡 부분 인정 ("interface lie" 인정, severity 중간) | **부분 매칭** |
| A-6 PS constructor `repo?` soft seam | Step 4b Claude 단독 | (r1 미언급) | ✅ Lens 3 박제 | 🟡 부분 인정 ("composition root 부재") | **부분 매칭** |
| A-7 PS try-catch isExpired Clock race | Step 4b Claude 단독 | (r1 미언급) | ✅ Lens 3 박제 | ✅ **강한 인정** + 실제 버그 트리거 발견 | **확정** + 강화 |
| A-8 SA fromDocument invariant 부재 | Step 4b Claude 단독 | (r1 미언급) | ✅ Lens 3 박제 | ✅ 인정 + toAggregate ?? 0 우회 통로 발견 | **확정** + 강화 |

**Pass A 충족**: 확정 5건 (A-1/A-2/A-4/A-7/A-8) + 부분 매칭 3건 (A-3/A-5/A-6) = **총 8 후보, 확정만 5건 ≥ 2** ✅

### 5.2 B 기준 ≥ 3 adapter 후보

| 후보 | codex r1 | Claude 반박 (Lens 1) | codex r2 | 최종 결정 |
|---|---|---|---|---|
| D-1 → A-1 Repository (real seam) | ✅ Two-adapter rule 통과 + Δ-1 classDef 분리 권고 | 정합 | (재확인 없음) | **확정** |
| D-2 → A-2 Clock (hypothetical → 승격) | ✅ Δ-2 category 구분 + Δ-3 연결도 시정 권고 | 정합 | A-7 강한 인정으로 강화 | **확정** |
| D-3 → A-3 EventBus (hypothetical → A-5 재명명) | ✅ Δ-4 재명명 권고 | 정합 | (재확인 없음) | **확정** |
| D-4 → adapter 후보 | 🟡 "단정하지 않음" | ✅ B 기준 제외 권고 (INTERFACE-DESIGN 영역) | ✅ Lens 1 분류 인정 + UserIdParserPort 명명 권고 (B에서는 제외) | **B 기준 제외 확정** |

**Pass B 충족**: 3건 모두 확정 (D-1/D-2/D-3) + D-4는 value-object/parser 영역으로 분류 = **3 ≥ 3** ✅

### 5.3 C 기준 ≥ 1 cross-LLM delta

| Delta | 출처 | 검증 결과 |
|---|---|---|
| Δ-1 D-1 classDef localSubstitutable 분리 | codex r1 | (Claude 미반박) |
| Δ-2 D-2 category embedded vs pure 구분 | codex r1 | (Claude 미반박) |
| Δ-3 A-2 연결도 시정 (SA→A2, PS→A2, A2→D2) | codex r1 | (Claude 미반박) |
| Δ-4 A-3 → A-5 PairingEventBusPort 재명명 | codex r1 | (Claude 미반박) |
| Δ-5 D-4 value-object 후보 (SessionId/ObjectIdParser) | codex r1 | Lens 1 §1.2 분류 정합 + r2 명명 정교화 (UserIdParserPort / SubjectIdCodecPort) |
| Δ-6 A-5 cancel(_reason) Interface that lies | Claude Step 4b | r2 부분 인정 |
| Δ-7 A-6 PS constructor soft seam | Claude Step 4b | r2 부분 인정 (composition root 부재) |
| Δ-8 A-7 PS Clock race 실제 버그 트리거 | Claude Step 4b + codex r2 강화 | r2 강한 인정 + PAIRED→재호출 시 expire() InvalidStatusTransitionError 새 발생 가능 |
| Δ-9 A-8 toAggregate ?? 0 invariant 우회 통로 | codex r2 추가 발견 | (Claude Step 4b A-8을 강화) |

**Pass C 충족**: **9 delta** (Claude/codex 양방향) ≥ 1 ✅

### 5.4 D 기준 회귀 0
- Step 4a / 4b / 4c 모두 src/** 수정 0 (read-only)
- 신규 산출물: PAAR 보고서 3건 (r1 / rebuttal / r2) + mermaid 2건은 Step 3에서 이미 박제됨
- **충족** ✅

---

## 6. Step 5 진입 — TDD 시나리오 명세 가이드

### 6.1 codex 권고 5 시나리오 (Q3' 옵션 B 결정)
1. PS happy path
2. PS expired path
3. PS retry-after-paired
4. Clock seam race (A-7)
5. Single observed now (선택)

### 6.2 명세 작성 원칙
- LANGUAGE.md "the interface is the test surface"
- DEEPENING.md "Tests assert on observable outcomes through the interface"
- 내부 `Date.now()` 호출 횟수보다 observable outcome 중심
- spec 파일 작성 X — 명세만 박제

### 6.3 산출물
- `paar-2026-05-13-deep-module-poc-tdd-spec.md`
- 각 시나리오: Given (preconditions) / When (interface call) / Then (observable outcomes)
- Adapter port suggestion (A-7 Clock port 한정) 첨부

---

## 7. 산출물 인덱스 (Step 4 완료)

| 단계 | 경로 |
|---|---|
| Step 4a | `mind-signal-backend/docs/reports/paar-2026-05-13-deep-module-poc-codex-r1.md` |
| Step 4b | `mind-signal-backend/docs/reports/paar-2026-05-13-deep-module-poc-claude-rebuttal.md` |
| Step 4c (본 PAAR) | `mind-signal-backend/docs/reports/paar-2026-05-13-deep-module-poc-codex-r2.md` |

### 7.1 GO/NO-GO 잠정 신호
- A/B/C/D 모두 충족
- codex r1 발견 + Claude 반박 + codex r2 추가 발견 양방향 cross-LLM delta 9건
- 끼워맞추기 없음 — 모든 후보가 코드 read 또는 mermaid 직접 인용으로 객관 검증
- **잠정 GO** — Step 5/6 완수 후 RESULT.md에서 최종 확정
