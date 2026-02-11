import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Mind Signal API Docs',
      version: '1.0.0',
      description: '뇌파 시그널 프로젝트 API 명세서',
    },
    servers: [
      {
        url: 'http://localhost:5000',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  // FSD 구조 내의 모든 라우트 관련 파일을 스캔하도록 설정
  apis: [
    './src/01-app/app.ts',
    './src/02-processes/**/*.ts', // 프로세스 계층 내 컨트롤러/라우트
    './src/05-features/**/*.ts', // 기능 계층 내 컨트롤러/라우트
  ],
};

export const specs = swaggerJSDoc(options);
