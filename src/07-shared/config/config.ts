import dotenv from 'dotenv';
import path from 'path';

// 1. 환경별 .env 파일 로드 (.env.local, .env.development, .env.test 등)
const nodeEnv = process.env.NODE_ENV || 'local';
const envPath = path.resolve(__dirname, `../../../.env.${nodeEnv}`);
dotenv.config({ path: envPath });

// 2. 필수 환경변수 목록 정의
const REQUIRED_ENV_VARS = [
  'MONGODB_URI',
  'JWT_SECRET_KEY',
  //'GOOGLE_API_KEY',
  //'GEMINI_API_KEY'
];

// 3. 누락된 환경변수 검사 (production/staging 환경에서 특히 중요)
if (nodeEnv !== 'test') {
  REQUIRED_ENV_VARS.forEach((key) => {
    if (!process.env[key]) {
      throw new Error(
        `Critical Error: 환경변수 ${key}가 설정되지 않았습니다. (.env.${nodeEnv} 확인)`
      );
    }
  });
}

// 4. 설정 객체 내보내기
export const config = {
  env: nodeEnv,
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUri: process.env.MONGODB_URI as string,
  jwtSecret: process.env.JWT_SECRET_KEY as string,
  googleApiKey: process.env.GOOGLE_API_KEY as string,
  geminiApiKey: process.env.GEMINI_API_KEY as string, // GEMINI_API_KEY 추가

  isProduction: nodeEnv === 'production',
} as const; // 읽기 전용으로 설정

console.log(`현재 구동 환경: ${config.env}`);
console.log(`연결된 DB URI: ${config.mongoUri}`);
