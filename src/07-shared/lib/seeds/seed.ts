import mongoose from 'mongoose';
import { SurveyQuestion } from '@06-entities/surveys';
import { config } from '@07-shared/config/config';
import questions from '@07-shared/lib/seeds/questions.json';

const seedDatabase = async () => {
  try {
    // 1. DB 연결 (config에 설정된 URI 사용)
    await mongoose.connect(config.mongoUri);
    console.log('🌱 MongoDB 연결 성공. 시딩을 시작합니다...');

    // 2. 기존 문항 삭제 (나중에 실제 데이터로 교체하기 쉽게 하기 위함)
    await SurveyQuestion.deleteMany({});
    console.log('🧹 기존 설문 문항을 초기화했습니다.');

    // 3. JSON 데이터 삽입
    await SurveyQuestion.insertMany(questions);
    console.log(`✅ ${questions.length}개의 설문 문항 시딩 완료!`);

    process.exit(0);
  } catch (error) {
    console.error('❌ 시딩 중 에러 발생:', error);
    process.exit(1);
  }
};

seedDatabase();
