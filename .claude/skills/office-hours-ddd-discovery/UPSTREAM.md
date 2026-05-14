# UPSTREAM — office-hours-ddd-discovery skill

> Adapted from garrytan/gstack
> Upstream commit: 19e699ab9b69de9e1bf10d4b7c2682703b56f984
> Date: 2026-05-06
> Path: office-hours/SKILL.md
> Upstream version (frontmatter `version`): 2.0.0

## License (MIT — verbatim from garrytan/gstack/LICENSE)

```
MIT License

Copyright (c) 2026 Garry Tan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Adaptation rationale (NOT verbatim)

gstack `office-hours/SKILL.md` standalone vendor 불가:
1. `gbrain` schema → `~/.gstack/builder-profile.jsonl`, `~/.gstack/projects/{repo_slug}/*-design-*.md`, `~/.gstack/analytics/eureka.jsonl` 의존
2. `/plan-ceo-review`, `/plan-eng-review` cross-skill 의존
3. `SKILL.md.tmpl` auto-generation (gen:skill-docs script — bun build infra)
4. "Preamble (run first)" bash 명령 = gstack 환경 가정
5. `preamble-tier`, `triggers`, `gbrain` frontmatter 키 = gstack ecosystem 전용

→ 6 forcing questions 본문 (Q1-Q6) 만 MIT 표기로 인용 + DDD discovery 맥락 + Sequential Thinking MCP caveat 명시.

## Fair use 범위 (Phase F PLAN.md Round 2 Ambiguity 해소)

- 6Q 본문 verbatim quote (~150 단어) + MIT attribution (Copyright 2026 Garry Tan)
- MIT 라이선스는 verbatim 인용 + attribution 시 자유 사용 허용 (위 LICENSE 본문 §3 "above copyright notice ... shall be included")
- 본 adapted skill은 MIT 의무 충족 (위 LICENSE 전문 inline + 본문 attribution)

## Frontmatter 키 정합 (PLAN.md §5 CL-08)

| Key | Pocock tdd | gstack office-hours (reference only) | adapted (this skill) |
|---|---|---|---|
| name | ✅ | ✅ | ✅ |
| description | ✅ | ✅ | ✅ |
| allowed-tools | ❌ | ✅ | ✅ (3 tools: AskUserQuestion / Read / Grep) |
| preamble-tier | ❌ | ✅ | ❌ (gstack 전용) |
| version | ❌ | ✅ | ❌ (gstack 전용) |
| triggers | ❌ | ✅ | ❌ (gstack 전용) |
| gbrain | ❌ | ✅ | ❌ (gstack ecosystem 전용) |

→ Pocock tdd 키 집합 + `allowed-tools` (3개) 추가만 채택.

## Sync trigger + procedure (Pocock tdd UPSTREAM.md와 동일 패턴)

**Trigger**: Phase 14a-bis Revision 2026-11-01

**Procedure**:
1. `gh api repos/garrytan/gstack/commits/main --jq .sha` 후 박제된 SHA `19e699ab`와 비교
2. SHA 동일 → no-op
3. SHA 다름 → 6Q 본문 (lines 956-1046) diff. 변경 발견 시:
   - 별도 PR (Phase G 또는 신규 Phase) — 자동 bump 금지
   - DONE.md에 `pending-drift` 라벨
   - 사용자 검토 후 PIN.md 갱신 + ADR amend
