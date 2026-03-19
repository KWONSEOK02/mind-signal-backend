---
globs: "src/**/*.test.ts, src/**/*.spec.ts"
---
# 테스트 컨벤션

## 외부 리포지토리 파일 의존 테스트

`mind-signal-data-engine` 등 백엔드 리포지토리 외부의 파일을 읽는 테스트는 반드시 `fs.existsSync`로 파일 존재 여부를 사전 확인하고, 파일이 없으면 `it.skip`으로 건너뛰도록 작성함.

**이유**: CI 환경에서는 백엔드 리포지토리만 체크아웃되므로, 외부 디렉토리에 의존하는 테스트가 `ENOENT`로 전체 suite를 실패시킴.

**패턴:**
```typescript
const hasFile = fs.existsSync(filePath);
const itIfFile = hasFile ? it : it.skip;

itIfFile('파일이 있을 때만 검증함', () => { ... });
```
