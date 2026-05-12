# Reference Guide _template

> 이 파일은 새 reference 가이드 작성의 표준 템플릿입니다.
> 사용법: `cp docs/guides/_template.md docs/guides/<your-guide>.md` 후 7 섹션을 채우세요.
> 출처: TruthScope BE #22 §0~§5 reference 정합 (Phase F C-D7).
> 박제 정책: 3 templates byte-identical (Phase F PLAN.md §2 D-2).

---

## §0. Glossary (1 minute orientation)

> 본 가이드에서 사용하는 약어/특수 용어를 1줄씩 풀이. 신규 독자가 §1로 진입하기 전 1분 안에 컨텍스트 잡을 수 있도록.
>
> 예: `BE` = backend (Express+TypeScript) / `PR` = Pull Request / `RDS` = AWS managed PostgreSQL / ...

| Term | Meaning |
|---|---|
| ... | ... |

---

## §1. Why this guide exists

- 무엇을 해결하는가? (1-2 문장)
- 누가 읽는가? (target reader: 신규 contributor / 특정 stack 학습자 / etc.)
- 어떤 알림 (notice) — Phase 의존성, 14a-bis 5 contracts, ADR, 다른 가이드 link

---

## §2. Concrete signature / contract

> "권고" 수준 표현 회피. 실제 사용할 시그니처/스키마/프로토콜을 박제. Code block + 1줄 설명.
>
> 예: TS interface, JSON schema, REST endpoint signature, gRPC proto, ...

```{lang}
// concrete contract here
```

---

## §3. Recommended → confirmed signature

> §2를 더 좁힌 권고 → 확정 시그니처. PR description body의 실제 템플릿. Windows PowerShell + POSIX 양쪽 호환 명시.

### Linux/macOS (bash)

```bash
# command here
```

### Windows (PowerShell)

```powershell
# command here
```

---

## §4. SsrfGuard / 안전 가이드 (해당 시)

> 외부 호출이 있다면 SSRF/credential leak/quota 등 정책 명시.
> 없다면 본 섹션 삭제 가능.

---

## §5. Self-contained reference (Week N self-study)

> 이 가이드만 읽고 작업 시작 가능하도록 self-contained 구성.
> 외부 link 의존성 최소화. 외부 link 사용 시 마지막 §6 References에 모음.

### 예시 시나리오

1. ...
2. ...
3. ...

### 검증 (verify gate)

```bash
# 작업 후 self-verify command
```

---

## §6. References

- [Phase F Wave 0 PIN.md](../../.plans/F-template-ddd-tdd-augmentation/upstream-pin/PIN.md) (template-internal — 이 path는 derived repo에 없음, 삭제 가능)
- (외부 docs / RFCs / blog posts — full URL with date)

---

## §7. Maintenance

- 마지막 갱신: YYYY-MM-DD
- 다음 검토 예정: YYYY-MM-DD (보통 분기별)
- Owner: @<handle>
