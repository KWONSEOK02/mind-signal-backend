# Requirements Traceability Matrix

> 모든 기능 요구사항(FR)을 아티팩트에 연결하는 단일 소스임.
> GitHub 이슈, 아키텍처 결정(ADR), 구현 코드, 테스트, 현재 상태를 하나의 테이블로 추적함.

## 사용 방법

- **행 추가**: 새 FR 파일을 `docs/requirements/FR-XX-<slug>.md`로 작성할 때 동시에 이 테이블에 행을 추가함
- **행 갱신**: FR을 구현·변경하는 PR과 같은 PR에서 해당 행을 업데이트함
- **행 삭제 금지**: FR이 폐기되면 Status를 `Deprecated`로 변경하고 FR 파일에 사유를 기록함
- **비기능 요구사항(NFR)**: 하단의 별도 섹션에 기록함
- PR 머지 시 해당 FR의 Status 컬럼을 `Done`으로 업데이트함

## Status 값

| 값 | 의미 |
|---|---|
| `Draft` | FR 파일 존재, AC 미확정 |
| `Design` | AC 합의됨, ADR 작성 중 |
| `Implementing` | PR 오픈, 테스트 추가 중 |
| `Done` | 머지 완료, 테스트 통과, RTM 행 완성 |
| `Deprecated` | 더 이상 스코프 외 — 이력 보존을 위해 행 유지 |

---

## Functional Requirements

<!-- 첫 번째 실제 FR을 추가할 때 아래 예시 행을 삭제할 것. -->
<!-- 새 FR 작성: docs/requirements/_FR-template.md 복제 → FR-XX-<slug>.md로 저장 -->

| FR ID | Title | Source | Implementation | Tests | PR | Status |
|---|---|---|---|---|---|---|
| FR-00 | (예시) 세션 생성 API | #0 | `src/05-features/sessions/api/session.routes.ts` | `__tests__/sessions/create.test.ts` | — | Draft |
| DR-G | Session Aggregate DDD/BDD/TDD Pilot | `.plans/PRD.md` DR-G + `.plans/G-mind-signal-ddd-bdd-tdd/` | `src/06-entities/sessions/{domain,repository,types}` + `src/05-features/sessions/services/pair-subject.service.ts` | `session.aggregate.test.ts` (8) + `session.repository.test.ts` (5) + `pair-subject.service.test.ts` (5) + `pair-subject.bdd.test.ts` (3) = 21 | feat/G-ddd-bdd-tdd-pilot | Done (ADR-006 Accepted) |
| DR-G-PR-A7 | Clock Port at Session Pairing Seam — A-7 race 차단 + A-6 soft seam 동반 해소 | 이슈 #52 + `.plans/I-pr-a7-clock-port/` + `.plans/H-deep-module-poc/RESULT.md` | `src/07-shared/clock/{clock,system-clock,fixed-clock,index}.ts` 신규 + `src/06-entities/sessions/domain/session.aggregate.ts` (pair/isExpired Date 인자) + `src/05-features/sessions/services/pair-subject.service.ts` (constructor required + now 1회 관찰) | `clock.test.ts` (4) + `session.aggregate.test.ts` (9, +boundary) + `session.repository.test.ts` (5) + `pair-subject.service.test.ts` (5) + `pair-subject.bdd.test.ts` (8, +S4 A/B/C +S5 ×2) = 31 | feat/52-clock-port-race-fix | Done (ADR-007 Accepted) |

---

## Non-Functional Requirements

| NFR ID | Summary | Target | Measurement | Owner | Status |
|---|---|---|---|---|---|
| NFR-00 | (예시) API p95 지연시간 | < 300 ms | k6 spike test (`docs/reports/spike-test-YYYY-MM-DD-api-latency.md`) | @gs07103 | Draft |
