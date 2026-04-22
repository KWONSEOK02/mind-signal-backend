# scripts/

FSD 레이어 외부의 일회성 메타-도구 모음.

## 컨벤션

- **`src/`에서 이 폴더의 파일을 import 금지함.**
  애플리케이션 런타임이 의존하면 production 빌드(`dist/`)에 누락되어 런타임 에러 발생함. depcruise도 이 폴더는 분석하지 않음.
- 여기 들어가는 파일은 `process.exit()`로 끝나는 독립 실행 스크립트(예: DB 시딩, 마이그레이션 트리거, 일회성 데이터 변환) 한정함.
- 실행은 `package.json`의 npm script(`ts-node -r tsconfig-paths/register ./scripts/...`)로만 호출함.
- alias 경로(`@06-entities/...`, `@07-shared/...`)는 ts-node + tsconfig-paths 조합으로 그대로 동작함.

## 현재 파일

- `seeds/seed.ts` — `SurveyQuestion` 컬렉션 시드 (`npm run seed`)
