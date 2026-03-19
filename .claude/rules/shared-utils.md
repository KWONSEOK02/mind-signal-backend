---
globs: "src/**/*.ts"
---
# shared 유틸리티 사용법

## config 속성 목록

```typescript
config.env           // 'local' | 'test' | 'production'
config.port          // 서버 포트 (기본 5000)
config.mongoUri      // MongoDB 연결 문자열
config.googleApiKey  // Google API 키
config.geminiApiKey  // Gemini API 키
config.jwtSecret     // { secret, expiresIn }
config.isProduction  // boolean
config.redis         // { host, port }
config.dataEngine    // { path, baseUrl, pythonBin } — Python 엔진
                     // pythonBin: DATA_ENGINE_PYTHON 환경변수로 지정 (기본값: 'python')
                     // conda 환경(mind-signal)의 Python 경로를 env로 주입하는 방식
```

## AppError

```typescript
throw new AppError('User not found', 404);
// statusCode 4xx → status: 'fail', 5xx → status: 'error'
```

## authenticate 미들웨어 (JWT 검증)

```typescript
// Authorization: Bearer <token> 헤더 검증 → req.user.id 주입
router.get('/protected', authenticate, controller);

// 컨트롤러에서 userId 접근
const controller = (req: AuthedRequest, res: Response) => {
  const userId = req.user!.id;
};
```

## validate 미들웨어 (Zod 검증)

```typescript
const schema = z.object({ email: z.string().email() });
router.post('/endpoint', validate(schema), controller);
// 실패 시 400 반환, 성공 시 req.body를 파싱된 값으로 교체
```

## SocketService (실시간 브로드캐스트)

```typescript
// 앱 시작 시 HTTP 서버 생성 후 한 번만 초기화
SocketService.init(server);

// EEG 실시간 이벤트 전체 클라이언트에 브로드캐스트
SocketService.emitLiveEvent('eeg-live', { data: [...] });
SocketService.getIO(); // 초기화 전 호출 시 에러 발생
```

## redisService

```typescript
await redisService.connect();    // 앱 시작 시
await redisService.disconnect(); // 앱 종료 시
redisService.client.publish('mind-signal-live', JSON.stringify(data));
redisService.client.subscribe('channel', callback);
```

## 테스트 팩토리

```typescript
const user = createFakeSignUpData();                          // 랜덤 데이터
const user = createFakeSignUpData({ email: 'test@test.com' }); // 일부 오버라이드
```
