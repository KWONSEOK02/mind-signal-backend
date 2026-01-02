import express, { ErrorRequestHandler } from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cors from 'cors';
import indexRouter from '@01-app/app.router';
import config from '@07-shared/config/config';

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/api', indexRouter);

// 전역 에러 핸들러에 ErrorRequestHandler 타입을 명시적으로 지정한다.
const globalErrorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  // 어떤 요청에서 에러가 났는지 req 객체를 이용해 로그를 남긴다.
  console.error(`[${req.method}] ${req.originalUrl} - ERROR: ${error.message}`);

  // AppError에 정의된 isOperational 속성을 확인하여 운영 오류인지 판단한다.
  if (error.isOperational) {
    // isOperational이 true인 경우, AppError에서 설정한 상태 코드와 메시지를 사용한다.
    return res.status(error.statusCode || 500).json({
      status: error.status || 'error',
      message: error.message,
    });
  }
  
  // 그 외의 예측하지 못한 에러는 500 서버 에러로 처리한다.
  console.error('UNEXPECTED ERROR', error);
  return res.status(500).json({
    status: 'error',
    message: '서버 내부에 예상치 못한 오류가 발생했습니다.',
  });
};

// 타입이 지정된 에러 핸들러를 등록한다.
app.use(globalErrorHandler);


async function connectDB() {
  try {
    const mongoURI = config.mongo.uri;
    if (!mongoURI) {
      throw new Error('MongoDB URI가 설정되지 않았습니다. (.env / config.ts 확인)');
    }

    // Mongoose v8 기준 기본값을 사용하며 타임아웃만 명시한다.
    await mongoose.connect(mongoURI, {
      // 10초 내 연결 실패 시 에러
      serverSelectionTimeoutMS: 10_000, 
    });

    console.log('MongoDB 연결 성공');

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB 연결 에러:', err);
    });

    const PORT = Number(config.port) || 5000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n API running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('서버 시작 중 오류:', err);
    process.exit(1);
  }
}

connectDB();

export default app;