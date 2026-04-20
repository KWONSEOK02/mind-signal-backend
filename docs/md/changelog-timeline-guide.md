# CHANGELOG / TIMELINE 작성 가이드 — Mind Signal

> 이 문서는 Mind Signal 프로젝트의 CHANGELOG와 PROJECT TIMELINE 작성 규칙을 정의한다.
> PM이 merge 후 갱신하고, 팀원은 읽기 전용으로 Notion에서 확인한다.

---

## 0. Notion 페이지 ID (단일 진실원)

`notion-update-page` / `notion-fetch` 호출 시 사용하는 page_id. 이 문서가 유일한 기록처다.

| 문서 | Notion Page ID | URL |
|------|---------------|-----|
| **CHANGELOG** | `346f32b0-e268-8149-b0bb-f5f22912cc39` | https://www.notion.so/346f32b0e2688149b0bbf5f22912cc39 |
| **PROJECT TIMELINE** | `346f32b0-e268-810a-83cd-de374c52acfe` | https://www.notion.so/346f32b0e268810a83cdde374c52acfe |
| (부모) 아키텍처 진화 | `307f32b0-e268-805c-b8ec-fd742e6894d2` | https://www.notion.so/307f32b0e268805cb8ecfd742e6894d2 |

부모 페이지에는 Phase 0(2026-01 ~ 2026-03-22) Gantt / Phase 1~3 아키텍처 다이어그램 / ADR 8건이 보존되어 있다. Phase 01 이후의 변경 이력과 진행 상태는 위 CHANGELOG / PROJECT TIMELINE 하위 페이지에서만 관리한다.

---

## 1. 두 문서의 역할 구분

| 문서 | 핵심 질문 | 업데이트 시점 |
|------|-----------|--------------|
| **CHANGELOG** | "언제 뭐가 바뀌었는지" (변경 이력) | 브랜치 merge 후 |
| **PROJECT TIMELINE** | "지금 어디까지 왔고, 다음에 뭘 해야 하는지" (진행 상황) | 마일스톤 달성 시 또는 주 1회 |

Swagger UI는 별도 — "현재 BE API 스펙이 뭔지" (엔드포인트, 파라미터)를 담당한다.

---

## 2. CHANGELOG — Keep a Changelog 기반

### 2.1 기반 컨벤션

[Keep a Changelog v1.1.0](https://keepachangelog.com/en/1.1.0/) + [Semantic Versioning](https://semver.org/)을 따른다.

### 2.2 전체 구조

```markdown
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog v1.1.0](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Planned
- Phase 15 template-intent-retrofit — 준비 완료, Phase 14 머지 후 착수

## [0.14.0] - 2026-04-18 — Phase 14 dual-ble-resolution
### Added
- SEQUENTIAL 측정 모드 — 1 PC에서 헤드셋 순차 연결
- similarity 계산 Strategy Pattern + Plugin Registry

### Changed
- engine.controller / engine.routes / app.router 측정 모드 라우팅

## [0.13.0] - 2026-04-18 — Phase 13 dual-headset-connection
### Added
- 조기 종료 버튼 + stop-all API (FE #34)
```

### 2.3 카테고리 (6종 고정)

| 카테고리 | 의미 | 예시 |
|----------|------|------|
| **Added** | 새 기능 추가 | 새 API 엔드포인트, 새 모듈 |
| **Changed** | 기존 기능 변경 | API 응답 형식 변경, 구조 리팩터링 |
| **Deprecated** | 곧 제거될 기능 | v0.3.0에서 제거 예정인 레거시 엔드포인트 |
| **Removed** | 제거된 기능 | 더 이상 사용하지 않는 API |
| **Fixed** | 버그 수정 | NullPointerException 수정 |
| **Security** | 보안 취약점 수정 | 인증 토큰 검증 로직 강화 |

### 2.4 작성 규칙

1. **날짜 형식**: `YYYY-MM-DD` (ISO 8601)
2. **역순 정렬**: 최신 버전이 맨 위
3. **`[Unreleased]` 섹션 항상 유지**: 다음 릴리스에 포함될 변경사항을 먼저 기록
4. **버전 형식**: `MAJOR.MINOR.PATCH`
   - MAJOR: 호환 안 되는 API 변경 (1.0.0 전까지는 0.x.x 사용)
   - MINOR: 하위 호환되는 기능 추가
   - PATCH: 하위 호환되는 버그 수정
5. **한 항목 = 한 줄**: 동사로 시작, 무엇을/왜를 간결하게
   - 올바름: `조기 종료 버튼 + stop-all API 추가 (FE #34)`
   - 잘못됨: `여러 가지 수정함`
6. **해당 없는 카테고리는 생략**: 빈 섹션을 남기지 않는다
7. **관련 이슈/PR 번호 링크**: 가능하면 `(FE #34)` `(BE #31)` `(DE #11)` 형태로 참조

### 2.5 Phase-버전 매핑 규칙

Mind Signal은 "Phase 번호 → `v0.{PhaseNum}.0`" 규칙을 따른다. Phase 완료 시 해당 버전 릴리스.

| Phase | 버전 | 예시 |
|-------|------|------|
| Phase 01 | v0.1.0 | chat-api-integration |
| Phase 02 | v0.2.0 | phase5-integration |
| ... | ... | ... |
| Phase 14 | v0.14.0 | dual-ble-resolution |

Phase 09는 실제 없음 → 버전 번호도 스킵. 여러 Phase를 한 번에 릴리스할 경우 각각 별도 버전 엔트리로 기록한다.

### 2.6 merge 후 업데이트 플로우

```
1. feature 브랜치 merge → main/dev
2. [Unreleased] 섹션에 변경사항 추가 (카테고리별)
3. Phase 완료 시: [Unreleased] → [x.y.z] - YYYY-MM-DD 로 변환
4. Notion CHANGELOG 페이지에 notion-update-page 로 동기화
5. notion-fetch 로 검증
6. 팀 공지 채널에 "✅ feat/xxx merge → [Notion 링크]" 공지
```

---

## 3. PROJECT TIMELINE — 마일스톤 기반 진행 추적

### 3.1 기반 컨벤션

공식 표준은 없다. GitHub 오픈소스 ROADMAP.md 패턴과 개발 커뮤니티 관행을 종합한 자체 형식이다.

### 3.2 전체 구조

```markdown
> Mind Signal 프로젝트 진행 상황 추적 문서.

## 현재 상태

| 항목 | 값 |
|------|---|
| **현재 Phase** | Phase 14 — dual-ble-resolution (execute 완료 / verify 대기) |
| **마지막 업데이트** | 2026-04-18 |
| **다음 마일스톤** | Phase 14 verify 통과 + 3 PR 머지 → Phase 15 착수 |

---

## Phase 13 — dual-headset-connection ✅

> EMOTIV 2대 동시 연결 + 운영 안정성

- [✅] `2026-04-18` FE #38 dev → main 머지 + MyResultsList UI — **v0.13.0 릴리스**

---

## Phase 14 — dual-ble-resolution 🔄

> 1PC에서 BLE 직접 연결로 2대 순차 측정 구현

### 완료
- [✅] `2026-04-18` plan-review 3라운드 🟢 PASS
- [✅] `2026-04-18` Wave 1~4 execute 완료 (23 commits)

### 진행중
- [ ] `~2026-04-19` verify 실행
- [ ] `~2026-04-20` 3 PR 머지 → **v0.14.0 릴리스 확정**

---

## Phase 15 — template-intent-retrofit 📋

> llm-setup-templates v1.0.0 의도를 FE+BE에 이식

- [✅] `2026-04-18` DISCUSS.md + PLAN.md 저장, plan-review PASS
- [ ] Phase 14 verify 통과 후 착수
```

### 3.3 작성 규칙

1. **Phase 단위로 구분**: 각 Phase에 한 줄 목표 설명 (blockquote)
2. **상태 이모지**:
   - `✅` 완료된 Phase
   - `🔄` 진행중인 Phase (execute 진입 후)
   - `📋` 예정된 Phase (plan-review 통과했어도 execute 전이면 📋)
3. **체크박스**: `[✅]` 완료, `[ ]` 미완료
4. **날짜 표기**:
   - 완료 항목: `2026-04-01` (확정 날짜)
   - 진행중/예정: `~2026-04-10` (목표 날짜, `~` 접두사)
   - 날짜 미정: 날짜 생략
5. **현재 상태 테이블**: 문서 최상단에 현재 Phase, 마지막 업데이트, 다음 마일스톤을 표시
6. **릴리스 연결**: Phase 완료 시 해당 CHANGELOG 버전을 명시 (예: `— v0.14.0 릴리스`)
7. **3단 분류** (진행중 Phase만):
   - **완료**: 이미 끝난 항목
   - **진행중**: 현재 작업 중
   - **예정**: 이번 Phase에서 할 예정이지만 아직 시작 안 함

### 3.4 업데이트 플로우

```
1. 마일스톤 달성 시:
   - 해당 항목 [✅]로 체크 + 확정 날짜 기입
   - "현재 상태" 테이블의 다음 마일스톤 갱신
2. Phase 완료 시:
   - Phase 상태를 🔄 → ✅ 로 변경
   - 다음 Phase를 📋 → 🔄 로 변경 (execute 시작 시점)
3. Notion PROJECT TIMELINE 페이지에 notion-update-page 로 동기화
```

---

## 4. Notion 운영 규칙

### 4.1 페이지 구조

```
📁 Mind Signal — 프로젝트 타임라인 & 아키텍처 진화 (부모, 307f32b0...)
├── 📋 CHANGELOG    ← PM만 편집, 팀원 읽기 전용 (346f32b0...2912cc39)
└── 🗓️ PROJECT TIMELINE  ← PM만 편집, 팀원 읽기 전용 (346f32b0...4c52acfe)
```

부모 페이지는 **Phase 0 아카이브** — 2026-01 ~ 2026-03-22 Gantt / Phase 1~3 아키텍처 다이어그램 / ADR 8건이 동결 보존. 편집 금지.

### 4.2 팀 공지 (디스코드/슬랙 등)

merge가 완료되면 팀 채널에 아래 형식으로 공지:

```
✅ feat/14-sequential-backend merge → [Notion CHANGELOG](링크) | [TIMELINE](링크)
```

> 현재 Mind Signal 팀의 공식 공지 채널이 확정되지 않았다면, 팀 규칙 수립 후 이 섹션의 `링크`를 실제 채널 템플릿으로 교체한다.

팀원은:
1. Notion CHANGELOG로 "뭐가 바뀌었는지" 확인
2. PROJECT TIMELINE으로 "다음에 뭘 해야 하는지" 확인
3. Swagger UI로 "현재 API 스펙" 확인 후 다음 작업 시작

---

## 5. 참고 자료

- [Keep a Changelog v1.1.0](https://keepachangelog.com/en/1.1.0/)
- [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Common Changelog](https://common-changelog.org/) — Keep a Changelog의 더 엄격한 변형
- [git-cliff](https://github.com/orhun/git-cliff) — Git 히스토리에서 CHANGELOG 자동 생성 도구
- 범용 가이드 (볼트): `Guide/CHANGELOG and Project Timeline Keep a Changelog Guide.md`
- CheckMate 패턴 참조: `checkmate-web/docs/md/changelog-timeline-guide.md`
