# FR-XX: <한 줄 명령형 제목>

<!-- ⚠️ 이 파일을 수정하지 말 것. 복제하여 FR-XX-<slug>.md로 저장할 것.
     언더스코어(_) 제거 후 사용함. 모든 섹션을 채운 뒤 RTM.md에 행을 추가함.
     같은 PR에서 FR 파일 + RTM 행 업데이트를 함께 처리함. -->

---

## Metadata

- **FR ID**: FR-XX
- **Status**: Draft / Design / Implementing / Done / Deprecated
- **Priority**: P0 (필수) / P1 (중요) / P2 (선택)
- **GitHub Issue**: #NNN
- **Related ADRs**: ADR-NNN (해당 시)
- **Owner**: @gs07103
- **Created**: YYYY-MM-DD

## Source (요구사항 출처)

이 FR이 어디서 왔는지 명시함 — PRD 섹션, GitHub 이슈, 팀 회의 날짜 등.

- PRD: `.plans/PRD.md §N`
- 이슈: #NNN
- 회의: YYYY-MM-DD 팀 회의 결정사항

## User story

As a **<actor>** (예: Operator, Subject), I want **<capability>**, so that **<outcome>**.

## Trigger

무엇이 이 기능을 시작하는가? HTTP 요청, 크론, 사용자 클릭, 외부 웹훅?

- 예: `POST /sessions` HTTP 요청 (Operator FE에서 전송)

## Inputs

| Name | Type (TypeScript / Zod) | Source | Constraints |
|---|---|---|---|
| `groupId` | `string` (z.string().regex(/^[a-f0-9]{24}$/)) | Request body | MongoDB ObjectId 형식 |

## Outputs

| Name | Type | Consumer | Notes |
|---|---|---|---|
| `SessionDto` | `z.infer<typeof SessionSchema>` | HTTP 200 body | `src/07-shared/types/type.ts`에 정의됨 |

## Preconditions

**실행 전** 무엇이 참이어야 하는가? 이것이 코드에서 guard clause 또는
미들웨어 검사로 구현됨. 각 전제조건을 강제하는 함수/파일을 명시함.

- [ ] 요청자가 인증됨 (`@07-shared/middlewares/authenticate.middleware.ts`에서 JWT 검증)
- [ ] 입력이 Zod 스키마를 통과함 (`@07-shared/middlewares/validate.middleware.ts`)

## Postconditions

**완료 후** 무엇이 참이어야 하는가? 이것이 테스트의 assertions가 됨.

- [ ] Response body가 `SessionSchema`와 일치함
- [ ] MongoDB에 새 Session 문서가 삽입됨
- [ ] 동일 입력으로 반복 호출 시 부작용 없음 (idempotency 요구 시 명시)

## Structured logic

**구조화된 영어**로 흐름을 기술함 (`IF … THEN … ELSE`, `FOR EACH`, `WHILE`, `RETURN`).
자연어 모호성 없이 기술함. LLM이 이 명세에서 컴파일 가능한 함수를 생성할 수 있어야 함.

```
BEGIN FR-XX
  VALIDATE input via XxxSchema.parse (실패 시 400 반환)
  FETCH resource BY id
  IF resource IS NULL THEN
    RETURN 404 with { error: "RESOURCE_NOT_FOUND" }
  END IF
  IF resource.isExpired THEN
    RETURN 410 with { error: "RESOURCE_EXPIRED" }
  END IF
  INSERT INTO collection (fields)
  RETURN 201 with ResourceDto
END FR-XX
```

## Decision table

**3개 이상의 상호작용 조건이 있을 때만 이 섹션을 포함함.**
조건 1개 = 행 1개, 규칙(Rule) 1개 = 열 1개. Y / N / — (무관).

| Conditions | R1 | R2 | R3 |
|---|---|---|---|
| 리소스 존재 | N | Y | Y |
| 리소스 만료 | — | Y | N |
| **Actions** | | | |
| Return 404 `RESOURCE_NOT_FOUND` | X | | |
| Return 410 `RESOURCE_EXPIRED` | | X | |
| Return 200 ResourceDto | | | X |

**테스트 커버리지 규칙**: Rule 열 1개 = 테스트 1개. 모든 Rule 열은 테스트 대상임.

## Exception handling

- **DB 연결 실패**: exponential backoff 재시도 3회 (100 ms / 400 ms / 1600 ms) 후 503 반환
- **Zod 검증 실패**: 400 with `{ error: "VALIDATION_ERROR", details: zodError.format() }` — 검증 오류 삼킴 금지
- **동시 수정**: 낙관적 잠금 적용 시 충돌 → 409 `{ error: "CONCURRENT_MODIFICATION" }`

## Test plan

| Level | Scenario | File |
|---|---|---|
| unit | happy path | `__tests__/fr-xx/happy.test.ts` |
| unit | decision-table Rule별 (R1 … RN) | `__tests__/fr-xx/rules.test.ts` |
| integration | DB 재시도 동작 | `__tests__/fr-xx/db-retry.test.ts` |
| e2e | 전체 HTTP round-trip | `e2e/fr-xx.spec.ts` (해당 시) |

## Dependencies

- 선행 완료 필요 FR: FR-XX
- 의존 ADR: ADR-NNN
- 의존 외부 서비스: (예: Python 엔진 `/engine/register` 등록 완료 필요)

## Traceability

- **Implementation files**: `src/...`
- **Tests**: `__tests__/...`
- **Related ADRs**: ADR-NNN
- **RTM row**: [RTM.md](./RTM.md) FR-XX 행

## Notes

<!-- 해결된 질문은 위 섹션의 명세로 편입함. -->

- [ ] 미결 질문이나 불확실한 전제조건을 여기에 기록함
