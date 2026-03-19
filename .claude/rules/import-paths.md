---
globs: "src/**/*.ts"
---
# Import 경로 규칙

```typescript
// 환경변수는 반드시 이걸로
import { config } from '@07-shared/config/config';

// 공통 에러
import { AppError } from '@07-shared/errors';

// Redis
import { redisService } from '@07-shared/lib/redis';

// Socket.io
import { SocketService } from '@07-shared/lib/socket';

// 미들웨어
import { authenticate } from '@07-shared/middlewares/authenticate.middleware';
import { validate } from '@07-shared/middlewares/validate.middleware';

// 타입
import { AuthedRequest } from '@07-shared/types/type';

// 테스트 팩토리
import { createFakeSignUpData } from '@07-shared/lib/testing/user.test.factory';

// 엔티티
import { Session } from '@06-entities/sessions';
import User from '@06-entities/users/model/user.schema';
import { userRepository, UserDoc } from '@06-entities/users';

// ❌ 절대 금지
import dotenv from 'dotenv'; // config.ts 대신 사용 금지
```
