import swaggerJSDoc from 'swagger-jsdoc';
import { config } from '@07-shared/config/config';

const serverUrl =
  process.env.PUBLIC_BASE_URL ||
  (config.isProduction
    ? 'https://mind-signal-backend-74ab2db9e087.herokuapp.com'
    : `http://localhost:${config.port}`);

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Mind Signal API Docs',
      version: '1.0.0',
      description: '뇌파 시그널 프로젝트 API 명세서',
    },
    servers: [{ url: serverUrl }],
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
  apis: [
    './src/01-app/app.ts',
    './src/02-processes/**/*.ts',
    './src/05-features/**/*.ts',
  ],
};

export const specs = swaggerJSDoc(options);
