import dotenv from "dotenv";

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

// 애플리케이션에서 사용할 환경 변수들의 타입 정의
interface Config {
  env: string;
  port: number | string;

  jwt: {
    secret: string;
    expiresIn: string;
  };
  google: {
    clientId: string | undefined;
  };
  mongo: {
    uri: string | undefined;
  };
  gemini: {
    apiKey: string | undefined;
  };
}

// process.env에서 필요한 값들을 읽어서 config 객체로 정리
// 이렇게 하면 코드 내에서 process.env를 직접 쓰지 않고,
// config를 통해 접근할 수 있어 관리와 테스트가 편리해집니다.

const config: Config = {

  env: process.env.NODE_ENV ?? "development",
  port: process.env.PORT ?? 5000,
  jwt: {
    secret: process.env.JWT_SECRET_KEY ?? "your-secret",
    expiresIn: "1d",
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
  },
  mongo: {
    uri: process.env.MONGODB_URI_PROD,
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
  }
};

export default config;