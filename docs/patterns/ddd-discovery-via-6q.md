# DDD Discovery via 6 Forcing Questions

> Companion: `.claude/skills/office-hours-ddd-discovery/SKILL.md`
> Purpose: 6 forcing questions (Garry Tan gstack v2.0.0, MIT)을 DDD bounded context discovery에 매핑.
> Scope: spring-template + typescript-template (python-template은 archetype 없음 → deferred)

---

## §1. Why 6Q for DDD?

전통적 DDD discovery (Event Storming / Domain Storytelling)은 **시간**과 **합의된 도메인 전문가**를 가정. 그런데 LLM 에이전트가 새 bounded context를 설계할 때:
- 도메인 전문가 1명만 있고 시간 30분
- "유저가 원하는 게 뭔지" 명확히 모름
- 기존 모델을 pivot할지 새로 만들지 결정 needed

→ Garry Tan의 6 forcing questions는 **founder/operator를 압박해서 bounded context의 demand reality를 surface하는 도구**. DDD discovery에 매핑하면 **30분 내에 aggregate boundary + UL + 전략적 위치 결정**.

---

## §2. 6Q × DDD 매핑 (fit score 1-5)

| Question | gstack 원본 의도 | DDD 매핑 | Fit | 근거 |
|---|---|---|---|---|
| **Q1** Demand Reality | 누군가 진짜 원하는가? | **Domain Event** identification (monetary commitment / workflow lock-in) | 4 | "Order placed" with payment = real demand event. Click "save" = noise. |
| **Q2** Status Quo | 지금 어떻게 해결? | **Anti-Corruption Layer** seam (where to integrate with legacy) | 4 | Existing Excel/spreadsheet workarounds = ACL boundaries. |
| **Q3** Desperate Specificity | 누구가 가장 절실? | **Domain Expert** identification + Ubiquitous Language seed | 5 | Without a named human, no UL collaboration. "Ops team" ≠ Sarah at warehouse 3. |
| **Q4** Narrowest Wedge | 가장 작은 wedge? | **Aggregate root boundary** | 5 | Smallest aggregate that ships value end-to-end. Can't ship in single transaction → boundary wrong. |
| **Q5** Observation & Surprise | 무엇이 놀라웠나? | **Domain Expert collaboration** (UL drift detection) | 4 | Real moment = expert uses term you didn't expect. Real-user observation also counts (caveat). |
| **Q6** Future-Fit | 3년 후에도 essential? | **Strategic subdomain** (core / supporting / generic) | 3 | Board-level decision, not modeling decision. Lower fit because LLM agent + dev pair often can't decide alone. |

---

## §3. Smart routing for DDD discovery

| Stage | Questions to ask | Skip |
|---|---|---|
| **Greenfield** (no aggregate yet) | Q1, Q2, Q3 | Q4-Q6 (premature) |
| **Has aggregates** (model exists) | Q2, Q4, Q5 | Q1 (already validated by existence), Q6 (defer to roadmap) |
| **Production** (paying users) | Q4, Q5, Q6 | Q1-Q3 (already validated) |
| **CRUD-only** (no domain logic) | Q2, Q4 | Q1, Q3, Q5, Q6 (over-engineered) — consider whether DDD is even needed |

---

## §4. Workflow

1. Skill `office-hours-ddd-discovery` invoke (auto trigger on "new bounded context", "aggregate boundary 검증", "domain model pivot")
2. Stage 식별 (greenfield / has aggregates / production / CRUD-only)
3. AskUserQuestion으로 한 질문씩 (smart routing 적용)
4. (선택) Sequential Thinking MCP로 pre-processing — "이 stage에서 가장 critical한 Q는?" 식별
5. 6Q 종료 후 DDD artifact 작성:
   - Bounded Context map 1장
   - Aggregate root + entities + value objects sketch
   - Ubiquitous Language seed (3-5 terms)
   - Strategic classification (core / supporting / generic)

---

## §5. Hard constraints (skill SKILL.md와 정합)

- **One question at a time** — gstack 정책 그대로
- **No Q advancement without human response** — 절대 simulate 금지
- **Sequential Thinking MCP**: pre-processing only ("which Q is most critical?"). **Never substitute for AskUserQuestion** — 인간 입력이 가치, ST는 placeholder 아님
- **AskUserQuestion**이 6Q 루프의 유일한 sanctioned 메커니즘

---

## §6. Cross-stack 정합

| Stack | DDD layer | 6Q 적용 시점 |
|---|---|---|
| Spring (Java) | Domain (entities/aggregates), Application (use cases), Infrastructure (adapters) | Greenfield context 시작 시 / Aggregate boundary 검증 시 |
| TypeScript (FSD-DDD hybrid) | entities/ (Domain), features/ (Application), shared/widgets/ (Infrastructure/Presentation) | 동일 |
| Python | (deferred — archetype 없음) | Phase G 후보 |

> Spring `docs/patterns/ddd-tdd-cross-stack.md` 의 "Domain layer no-mocking" 섹션 참조.

---

## §7. References

- gstack `office-hours/SKILL.md` v2.0.0 — Garry Tan, MIT (UPSTREAM.md inline)
- Pocock `tdd` skill — Matt Pocock, MIT (`.claude/skills/tdd/SKILL.md`)
- Phase F PLAN.md (template-internal) — 6Q × DDD 매핑 결정 근거
- Eric Evans "Domain-Driven Design" (2003) — Bounded Context / Aggregate root / Ubiquitous Language 원전
