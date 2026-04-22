# CodeRabbit Prompt Guide — Mind Signal Backend

`.coderabbit.yaml`의 `path_instructions`를 작성·확장할 때 참조하는 가이드.
이 문서는 `.coderabbit.yaml` 설정 파일의 companion 문서임 — 파일 자체를 대체하지 않음.

---

## 1. CodeRabbit이란

CodeRabbit은 GitHub PR에 자동으로 코드 리뷰를 달아주는 AI 리뷰어임.
PR이 열리면 요약(high-level summary), 파일별 인라인 코멘트, 이슈 심각도 태그를 자동 생성함.
레포별 규칙은 `.coderabbit.yaml`로 정의하고, `path_instructions`에 경로 패턴별 리뷰 프롬프트를 작성함.

CodeRabbit은 **로직·아키텍처·보안 리뷰** 도구임. 포맷팅(Prettier/ESLint가 담당)과 커밋 메시지 컨벤션(commitlint가 담당)은 CodeRabbit의 역할이 아님.

---

## 2. MS(Mind Signal) 레포에서의 사용 원칙

### 2-1. 한국어 명사형 종결 주석 감시

이 레포의 코딩 컨벤션에 따라 모든 코드 주석은 명사형으로 종결함.

- 올바른 형식: `// 사용자 인증 처리함`, `// JWT 토큰 검증함`, `// Redis 채널 구독함`
- 잘못된 형식: `// 사용자 인증을 처리합니다`, `// JWT 토큰을 검증하는 함수`, `// ~하는 로직`

CodeRabbit이 이 규칙 위반을 발견하면 코멘트를 달도록 `path_instructions`에 명시함.

### 2-2. FSD 번호 레이어 경계 위반 감지

BE FSD 레이어 구조:

```
07-shared/   ← 인프라 설정, 공통 유틸
06-entities/ ← DB 스키마 & CRUD
05-features/ ← 단일 도메인 기능
02-processes/ ← 복잡한 오케스트레이션
01-app/       ← 엔트리포인트
```

의존성 방향: `07-shared ← 06-entities ← 05-features ← 02-processes ← 01-app`

`dependency-cruiser`가 1차 방어(CI 게이트), CodeRabbit은 리뷰 레벨 2차 방어임.
CodeRabbit은 `dependency-cruiser`가 잡지 못하는 **의도적 경계 우회 패턴** (예: 주석 처리 후 우회, 동적 import 등)을 리뷰 코멘트로 지적함.

### 2-3. AppError 계층 + Zod validate 미들웨어 패턴 준수

- 에러: `throw new AppError('message', statusCode)` 패턴 — `res.status(xxx).json()` 직접 반환 지양
- 입력 검증: POST/PUT/PATCH 엔드포인트에 `validate(schema)` 미들웨어 적용 확인
- `try-catch` 안에서 조용히 삼키는 패턴 (`catch (e) {}`) 지적

### 2-4. `config.ts` 경유 env 접근

환경변수는 반드시 `import { config } from '@07-shared/config/config'` 경유.
`import dotenv from 'dotenv'` 또는 `process.env.XXX` 직접 접근 금지.

---

## 3. 프롬프트 패턴 레시피

`.coderabbit.yaml`의 `path_instructions`에 붙여 넣어 재사용 가능한 프롬프트 예시.

### 레시피 1: TypeScript 파일 — FSD 경계 + 공통 규칙

```yaml
- path: "src/**/*.ts"
  instructions: |
    FSD layer boundary check:
    - 07-shared MUST NOT import from 06-entities, 05-features, 02-processes, or 01-app.
    - 06-entities MUST NOT import from 05-features, 02-processes, or 01-app.
    - 05-features MUST NOT import from 02-processes or 01-app.
    - Flag any cross-layer upward import as a MUST_FIX violation.

    Environment variable access:
    - Direct `process.env.*` access outside config.ts is a MUST_FIX.
    - `import dotenv` anywhere except config.ts is a MUST_FIX.

    Korean comment style:
    - All inline comments must end in a noun form (명사형 종결): ~함, ~임, ~반환, ~처리, ~사용.
    - Sentence-ending forms (~합니다, ~합니다, ~하는 함수) are a NIT violation.

    Do NOT comment on formatting — Prettier and ESLint own that.
```

### 레시피 2: 테스트 파일 — Mock 격리 + 외부 리포 파일 패턴

```yaml
- path: "src/**/*.test.ts"
  instructions: |
    Test isolation:
    - Each test must reset mocks between cases. Flag missing `jest.clearAllMocks()` or
      `afterEach(() => jest.resetAllMocks())` when shared mocks exist.
    - Tests that reference paths outside this repo (e.g., mind-signal-data-engine)
      MUST use `it.skip` guard with `fs.existsSync` check. Missing guard = MUST_FIX.

    Mock completeness:
    - MongoDB/Mongoose calls must be mocked. Flag live DB calls in unit tests.
    - Redis calls must be mocked via `jest.mock('@07-shared/lib/redis')`.
      Flag live Redis connections in unit tests as MUST_FIX.

    Coverage baseline:
    - Each API endpoint test needs at minimum: one happy path + one error path.
      Flag tests with only happy path as SHOULD_FIX.

    Do NOT comment on formatting.
```

### 레시피 3: Route 파일 — Zod validate 체크

```yaml
- path: "src/**/api/*.routes.ts"
  instructions: |
    Route handler rules:
    - Business logic must be delegated to a service. Flag controller-level DB access
      (Mongoose model calls) or complex business logic as MUST_FIX.
    - Every POST, PUT, PATCH route must apply `validate(schema)` middleware before
      the controller. Missing validate middleware = MUST_FIX.
    - `authenticate` middleware must be present on protected routes.
      Flag missing auth on routes that reference `req.user` as MUST_FIX.
    - Errors must not be silently swallowed (empty catch block). Flag as MUST_FIX.

    Do NOT comment on formatting or import ordering.
```

### 레시피 4: 주석 스타일 — 한국어 명사형 전용

```yaml
- path: "src/**"
  instructions: |
    Korean comment convention (명사형 종결):
    - All Korean comments in code blocks must end with a noun-form terminator:
      ~함, ~임, ~반환, ~생성, ~처리, ~사용, ~완료, ~연결, ~구독, ~발생.
    - Prohibited endings: ~합니다, ~입니다, ~합니다, ~하는 함수, ~하는 역할.
    - Flag violations as NIT with a corrected version in the comment.
    - English comments are exempt from this rule.
```

---

## 4. `.coderabbit.yaml` 편집 가이드

### 현재 설정 요약

현재 `.coderabbit.yaml`의 핵심 설정:

- `language: ko-KR` — 리뷰 코멘트 언어 한국어
- `reviews.profile: chill` — 보수적인 리뷰 강도 (과도한 nitpick 최소화)
- `reviews.ignore_formatting: true` — 포맷팅 코멘트 비활성화 (Prettier가 담당)
- `reviews.auto_review.enabled: true` — PR 자동 리뷰 활성화 (drafts 제외)
- `reviews.auto_review.base_branches: [main, dev]` — main, dev 대상 PR만 자동 리뷰
- `reviews.path_instructions` — 경로별 4개 규칙 등록됨:
  - `src/routes/**`: Controller 비즈니스 로직 금지 + DB 직접 접근 금지
  - `src/services/**`: 역방향 의존(Controller import) 금지
  - `src/**/*.ts`: `any` 타입 금지 + 시크릿 하드코딩 금지 + JWT 검증 누락 체크

> **주의**: 현재 `path_instructions`의 경로는 이전 아키텍처(`src/routes/`, `src/services/`) 기준임.
> Wave 1 이후 실제 FSD 경로(`src/05-features/**/api/*.routes.ts` 등)에 맞춰 업데이트 권장.

### 새 규칙 추가 시 주의점

1. **YAML 들여쓰기**: `path_instructions` 항목은 2-space 들여쓰기. `instructions` 블록은 `|` (리터럴 블록 스칼라) 사용.

   ```yaml
   path_instructions:
     - path: "src/**/*.ts"
       instructions: |
         첫 번째 줄.
         두 번째 줄.
   ```

2. **glob 패턴**: `"src/**/*.ts"` (큰따옴표 필수). `**`는 재귀 디렉토리 매칭.
   - `src/**/api/*.routes.ts` — 모든 FSD 레이어의 routes 파일
   - `src/07-shared/**` — shared 레이어 전체

3. **tone_instructions 우선순위**: `profile: chill`은 전체 리뷰 강도를 낮춤.
   path_instructions 안에서 `MUST_FIX`로 명시하면 chill 설정보다 강제력이 높음.
   중요한 규칙은 반드시 `MUST_FIX`로 태그할 것.

4. **`chat.auto_reply: true`** — CodeRabbit이 PR 코멘트에 자동 답변함.
   CodeRabbit에게 직접 질문하려면 PR 코멘트에 `@coderabbitai` 멘션.

---

## 5. 리뷰 사이클

```
PR 생성
  ↓
CodeRabbit 자동 분석 (수 분 소요)
  ↓
high-level summary + 파일별 인라인 코멘트 생성
  ↓
개발자: 코멘트 확인 + 수정
  ↓
`@coderabbitai review` 코멘트 → 재리뷰 트리거
  ↓
머지
```

### 심각도 3단계

| 태그 | 의미 | 대응 |
|---|---|---|
| `MUST_FIX` | 아키텍처·보안·기능 버그 — 머지 전 반드시 수정 | 즉시 수정 후 재리뷰 |
| `SHOULD_FIX` | 품질·유지보수성 이슈 — 강력 권장 | 현 PR 또는 후속 PR |
| `NIT` | 스타일·네이밍 소수의견 — 선택적 | 무시하거나 기회 시 반영 |

> **Phase 14 PR #41 사례**: CodeRabbit MUST_FIX 7건 전부 같은 PR 내에서 반영 완료.
> MUST_FIX는 후속 PR로 미루지 않는 것을 원칙으로 함.

---

## 6. 기존 `.coderabbit.yaml` 설정 요약

파일 위치: `mind-signal-backend/.coderabbit.yaml`

| 항목 | 현재 값 | 비고 |
|---|---|---|
| 리뷰 언어 | `ko-KR` | 한국어 코멘트 |
| 리뷰 강도 | `chill` | 과도한 nitpick 방지 |
| 포맷팅 무시 | `true` | Prettier가 담당 |
| 자동 리뷰 | `true` (draft 제외) | main, dev 브랜치 대상 |
| 채팅 자동 답변 | `true` | `@coderabbitai` 멘션 시 |
| path_instructions 수 | 4개 | routes / services / src전체 / test전체 |

현재 `path_instructions`는 이전 아키텍처 경로(`src/routes/`, `src/services/`) 기준으로 작성되어 있음.
FSD 레이어 경로(`src/07-shared/`, `src/05-features/` 등)에 맞춘 업데이트는 Wave 2 이후 별도 작업 권장.
