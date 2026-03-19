import { config } from '@07-shared/config/config';
import { AppError } from '@07-shared/errors';

// 데이터 엔진에 데이터 요청
export const getAnalyzerData = async (userId: string) => {
  try {
    const url = `${config.dataEngine.baseUrl}/api/analyzer/${userId}`;
    // 데이터 엔진으로 get 요청
    // [데이터엔진<->서버] 인증 절차 필요
    const response = await fetch(url);
    if (!response.ok) {
      throw new AppError(
        `데이터 엔진 호출 실패: ${response.statusText}`,
        response.status
      );
    }

    const result = await response.json();
    return result;
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw new AppError(`데이터 엔진 연결 오류: ${error.message}`, 500);
  }
};
