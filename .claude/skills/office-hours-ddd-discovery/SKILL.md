---
name: office-hours-ddd-discovery
description: Six forcing questions (Garry Tan gstack v2.0.0, MIT) adapted for DDD bounded context discovery. Use when starting a new bounded context, validating an aggregate boundary, or pivoting domain model.
allowed-tools:
  - AskUserQuestion
  - Read
  - Grep
---

# Office Hours × DDD Discovery

> Origin: garrytan/gstack `office-hours/SKILL.md` v2.0.0 (MIT, Copyright 2026 Garry Tan)
> Adaptation: ecosystem 의존성 제거 (`gbrain` schema, `~/.gstack/`, cross-skill calls). DDD discovery 맥락으로 재구성.
> License: MIT — see UPSTREAM.md (full text inline)
> Companion: docs/patterns/ddd-discovery-via-6q.md

## When to invoke

- Starting a **new bounded context** (greenfield aggregate)
- Validating an **aggregate root boundary** (existing model)
- Pivoting **domain model** after discovering edge case mismatch

## 6 Forcing Questions (verbatim from gstack/office-hours, MIT — Copyright 2026 Garry Tan)

Ask these questions **ONE AT A TIME** via AskUserQuestion. Push on each one until the answer is specific, evidence-based, and uncomfortable. Comfort means the team hasn't gone deep enough.

**Smart routing based on bounded-context maturity:**
- Pre-context (greenfield) → Q1, Q2, Q3
- Has aggregates (model exists) → Q2, Q4, Q5
- Has paying users (production) → Q4, Q5, Q6
- Pure infra/CRUD → Q2, Q4 only

### Q1: Demand Reality

**Ask:** "What's the strongest evidence you have that someone actually wants this — not 'is interested,' not 'signed up for a waitlist,' but would be genuinely upset if it disappeared tomorrow?"

**DDD lens**: surface the **Domain Event** that captures the demand signal. "User clicks save" is not a domain event. "Order placed" with monetary commitment is.

**Push until you hear:** Specific behavior. Someone paying. Someone expanding usage. Someone building their workflow around it.

### Q2: Status Quo

**Ask:** "What are your users doing right now to solve this problem — even badly? What does that workaround cost them?"

**DDD lens**: identify the **Anti-Corruption Layer** seam. Existing workarounds (Excel sheets, copy-paste flows) are evidence of where the new bounded context must integrate.

**Push until you hear:** Specific workflow. Hours/dollars wasted. Tools duct-taped together.

### Q3: Desperate Specificity

**Ask:** "Name the actual human who needs this most. What's their title? What gets them promoted? What gets them fired? What keeps them up at night?"

**DDD lens**: this is the **Domain Expert** who must collaborate on Ubiquitous Language. Without a name, there's no UL. "Operations team" is not a domain expert — "Sarah, fulfillment lead at warehouse 3" is.

**Push until you hear:** A name. A role. A specific consequence.

### Q4: Narrowest Wedge

**Ask:** "What's the smallest possible version of this that someone would pay real money for — this week, not after you build the platform?"

**DDD lens**: this defines the **Aggregate root boundary**. The narrowest wedge is the smallest aggregate that delivers value end-to-end. If you can't ship it as a single aggregate transaction, the boundary is wrong.

**Push until you hear:** One feature. One workflow. Something shippable in days.

### Q5: Observation & Surprise

**Ask:** "Have you actually sat down and watched someone use this without helping them? What did they do that surprised you?"

**DDD lens**: this is **Domain Expert collaboration**, not user testing. Caveat: real user-observation also counts, but the primary signal is **expert language drift** — the moment a domain expert uses a term you didn't expect, your UL is incomplete.

**Push until you hear:** A specific surprise. Something that contradicted assumptions.

### Q6: Future-Fit

**Ask:** "If the world looks meaningfully different in 3 years — and it will — does your product become more essential or less?"

**DDD lens**: this is **Strategic subdomain classification** (core / supporting / generic). Future-essential = core domain (invest). Future-irrelevant = generic (buy). Caveat: fit=3 (lower than other questions) — strategic classification is a board-level decision, not a domain modeling decision.

**Push until you hear:** A specific claim about user-world change.

---

## Smart-skip + STOP

- **Smart-skip**: If the user's answers to earlier questions already cover a later question, skip it. Only ask questions whose answers aren't yet clear.
- **STOP** after each question. Wait for the response before asking the next.

## Hard constraints

- **One question at a time** (gstack 정책 그대로)
- **No Q advancement without human response** — never simulate the answer
- **Sequential Thinking MCP usage**: pre-processing only ("which Q is most critical for this stage?"). **Never use ST to substitute for AskUserQuestion** — human input is the value, not a placeholder.
- **AskUserQuestion** is the only sanctioned mechanism for the 6Q loop
