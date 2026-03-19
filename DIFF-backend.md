# 백엔드 (mind-signal-backend) — 변경 Diff

---

## 변경 항목 테이블

| 구분 | 항목 | AS-IS | TO-BE | 비고 |
|:---:|------|-------|-------|------|
| 🔴 제거 | `05-features/analyzer/` 폴더 전체 | `GET /api/analyzer` → `localhost:5002` 하드코딩 fetch | **삭제** | `02-processes/engine`이 완전 대체 |
| 🔴 제거 | `app.router.ts`의 analyzer 라우터 등록 | `router.use('/analyzer', analyzerRouter)` | **삭제** | engine 라우터로 교체 |
| 🟢 신규 | `02-processes/engine/` 폴더 전체 | 없음 | 엔진 등록 + secret 검증 + 분석 프록시 오케스트레이션 | **02-processes 계층** (아래 사유 참고) |
| 🟢 신규 | `POST /api/engine/register` | 없음 | 파이썬 엔진 URL + secret_key 수신 → 검증 → 메모리 저장 | 파이썬 서버 구동 시 자동 호출 |
| 🟢 신규 | `POST /api/engine/analyze` | 없음 | 프론트 요청 → 등록된 파이썬 URL로 프록시 → 결과 반환 | JWT 인증 필요 |
| 🟢 신규 | `engine-registry.service.ts` | 없음 | 엔진 URL 메모리 저장소 + secret 검증 | 서버 재시작 시 파이썬이 재등록 |
| 🟢 신규 | `config.ts` > `secretKey` | 없음 | `ENGINE_SECRET_KEY` 환경변수 추가 | 파이썬과 공유 비밀키 |
| 🟡 유지 | `02-processes/measurements/` | spawn Python + Redis subscribe + Socket.io emit | **그대로 유지** | 실시간 EEG 파이프라인 보존 |
| 🟡 유지 | Redis pub/sub | 실시간 EEG 브릿지 | **그대로 유지** | docker-compose.yml Redis 유지 |
| 🟡 유지 | Socket.io `eeg-live` | 실시간 메트릭 브로드캐스트 | **그대로 유지** | 프론트 차트 렌더링용 |

---

## 왜 `02-processes`인가? (05-features가 아닌 이유)

### FSD 레이어 배치 기준 (CLAUDE.md 참고)

> - **02-processes에 배치**: 여러 엔티티 + Redis + 외부 엔진 조합이 필요한 경우
> - **05-features에 배치**: 단일 도메인, 단순 CRUD

### engine 기능이 02-processes에 해당하는 이유

| 판단 기준 | 해당 여부 | 근거 |
|-----------|:---------:|------|
| 외부 서버 통신 | ✅ | 파이썬 FastAPI 서버로 HTTP 프록시 |
| 복수 도메인 조합 | ✅ | 엔진 등록(infra) + secret 인증(auth) + 분석 프록시(data) + 결과 반환 |
| 상태 관리 | ✅ | 엔진 URL을 메모리에 등록/관리하는 레지스트리 패턴 |
| 단순 CRUD가 아님 | ✅ | 등록 → 검증 → 저장 → 프록시 → 응답 변환의 워크플로우 |

**비교**: 기존 `02-processes/measurements`도 "외부 Python spawn + Redis 구독 + Socket.io 발행"이라는 복합 오케스트레이션이어서 02에 배치됨. engine도 동일한 복잡도.

### 기존 `05-features/analyzer`가 05에 있었던 이유

기존 analyzer는 단순히 `fetch(url)` 한 줄짜리 패스스루여서 05-features에 배치해도 문제가 없었음. 그러나 새 engine은 **등록 + 인증 + 프록시** 워크플로우이므로 02가 적합.

---

## 최종 디렉토리 구조 (변경 부분)

```
src/
├── 01-app/
│   └── app.router.ts                          # [수정] analyzer 제거, engine 추가
│
├── 02-processes/
│   ├── measurements/                          # [유지] 실시간 EEG 오케스트레이션
│   │   ├── api/measurement.routes.ts
│   │   ├── api/measurement.controller.ts
│   │   └── services/measurement.service.ts
│   │
│   └── engine/                                # [신규] 파이썬 엔진 오케스트레이션
│       ├── api/
│       │   ├── engine.routes.ts               # POST /register, POST /analyze
│       │   └── engine.controller.ts
│       └── services/
│           ├── engine-registry.service.ts     # URL 메모리 저장 + secret 검증
│           └── engine-proxy.service.ts        # 등록된 URL로 HTTP 프록시
│
├── 05-features/
│   ├── auth/                                  # [유지]
│   ├── users/                                 # [유지]
│   ├── sessions/                              # [유지]
│   ├── surveys/                               # [유지]
│   └── ~~analyzer/~~                          # [삭제] → 02-processes/engine으로 이동
│
└── 07-shared/
    └── config/config.ts                       # [수정] dataEngine.secretKey 추가
```

---

## app.router.ts 변경

```typescript
// AS-IS
import analyzerRouter from '@05-features/analyzer/api/analyzer.routes';
router.use('/analyzer', analyzerRouter);

// TO-BE
import engineRouter from '@02-processes/engine/api/engine.routes';
router.use('/engine', engineRouter);
// ❌ analyzer 라우터 제거
```

---

## config.ts 변경

```typescript
// AS-IS
dataEngine: {
  path: path.resolve(process.env.DATA_ENGINE_PATH || '../mind-signal-data-engine'),
  baseUrl: process.env.DATA_ENGINE_URL || 'http://localhost:5002',
  pythonBin: process.env.DATA_ENGINE_PYTHON ?? 'python',
},

// TO-BE
dataEngine: {
  path: path.resolve(process.env.DATA_ENGINE_PATH || '../mind-signal-data-engine'),
  baseUrl: process.env.DATA_ENGINE_URL || 'http://localhost:5002',
  pythonBin: process.env.DATA_ENGINE_PYTHON ?? 'python',
  secretKey: process.env.ENGINE_SECRET_KEY || 'change-me-in-production',  // [신규]
},
```

---

## 환경변수 추가 (.env.local)

```env
# ── 기존 유지 ──
DATA_ENGINE_PATH=../mind-signal-data-engine
DATA_ENGINE_URL=http://localhost:5002
DATA_ENGINE_PYTHON=C:\Users\gs071\miniconda3\envs\mind-signal\python.exe

# ── 신규 추가 ──
ENGINE_SECRET_KEY=your-shared-secret-here
```

---

## 삭제 대상 파일 목록

```
src/05-features/analyzer/
├── api/
│   ├── analyzer.routes.ts       # 삭제
│   └── analyzer.controller.ts   # 삭제
└── services/
    └── analyzer.service.ts      # 삭제
```

---

## CLAUDE.md 수정 사항 (구현 완료 후)

엔진 연동 구현이 끝나면 CLAUDE.md에서 **3줄만 수정**하면 된다.

| 줄 | 현재 | 변경 후 |
|:---:|------|---------|
| 91 | `02-processes/ ← ... (measurement: EEG 스트리밍 + 외부 엔진)` | `02-processes/ ← ... (measurement: EEG 스트리밍, engine: 분석 프록시)` |
| 98 | `Phase 3: AI 분석 오케스트레이션` | `Phase 3: AI 분석 오케스트레이션 (02-processes/engine)` |
| 168 | `Phase 3: AI 분석 오케스트레이션 (미구현)` | `Phase 3: AI 분석 오케스트레이션 (02-processes/engine)` |

### rules/ 수정 사항

| 파일 | 변경 |
|------|------|
| `.claude/rules/import-paths.md` | `@02-processes/engine` import 예시 추가 |
| `.claude/rules/shared-utils.md` | `config.dataEngine.secretKey` 속성 추가 |

### 수정이 불필요한 이유

- API 엔드포인트 목록 → Swagger 참조로 대체되어 있음 (outdated 위험 없음)
- `05-features/analyzer` 언급 → CLAUDE.md에 이미 없음 (개편 시 제거됨)
- 변경 이력(blockquote) → 기존 이력은 측정 파이프라인 관련이므로 수정 불필요
