# UPSTREAM — tdd skill

> Vendored from KWONSEOK02/skills (fork of mattpocock/skills)
> Upstream commit: b843cb5ea74b1fe5e58a0fc23cddef9e66076fb8
> Date: 2026-04-30
> Path: skills/engineering/tdd/
> Files: 6 (SKILL.md + deep-modules.md + interface-design.md + mocking.md + refactoring.md + tests.md)
> Vendor strategy: full directory verbatim — frontmatter included, no body modification (Phase F PLAN.md §2 D-1 / Round 1 CX-1 정합)
> Verification: see Phase F Wave 0 PIN.md sha256 hashes

## License (MIT — verbatim)

```
MIT License

Copyright (c) 2026 Matt Pocock

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

## Sync trigger + procedure

**Trigger**: Phase 14a-bis Revision 2026-11-01 (parent fate sharing)

**Procedure**:
1. `gh api repos/KWONSEOK02/skills/commits/main --jq .sha` 후 현재 박제된 SHA `b843cb5e`와 비교
2. SHA 동일 → no-op (PIN.md `last_sync_check` 갱신만)
3. SHA 다름 → 6 files diff. 변경 발견 시:
   - 별도 PR 생성 (Phase G 또는 신규 Phase) — 자동 bump 금지
   - DONE.md에 `pending-drift` 라벨 추가
   - 사용자 검토 후 PIN.md 갱신 + ADR amend

## Local addendum

`_local-addendum.md` — Phase D C13 정정 (build-time NOT compile-time)

> Reference: docs/patterns/ddd-tdd-cross-stack.md (spring), docs/patterns/ddd-discovery-via-6q.md (spring/ts)
