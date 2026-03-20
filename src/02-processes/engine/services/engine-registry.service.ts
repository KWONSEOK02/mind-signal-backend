import { config } from '@07-shared/config/config';
import { AppError } from '@07-shared/errors';

// 메모리 저장소 (서버 재시작 시 파이썬 엔진이 재등록해야 함)
let registeredEngineUrl: string | null = null;

export const engineRegistryService = {
  /** 파이썬 엔진 URL 등록 및 secret_key 검증함 */
  register(engineUrl: string, secretKey: string): void {
    if (secretKey !== config.dataEngine.secretKey) {
      throw new AppError('유효하지 않은 시크릿 키입니다.', 403);
    }
    registeredEngineUrl = engineUrl;
    console.log(`파이썬 엔진 등록 완료: ${engineUrl}`);
  },

  /** 등록된 엔진 URL 반환함 */
  getEngineUrl(): string {
    if (!registeredEngineUrl) {
      throw new AppError('파이썬 데이터 엔진이 아직 등록되지 않았습니다.', 503);
    }
    return registeredEngineUrl;
  },

  /** 등록 상태 확인함 */
  isRegistered(): boolean {
    return registeredEngineUrl !== null;
  },
};
