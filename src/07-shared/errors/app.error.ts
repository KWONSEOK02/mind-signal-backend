/**
 * 애플리케이션 전역에서 사용할 커스텀 에러 클래스를 정의한다.
 */
export class AppError extends Error {
  // HTTP 상태 코드를 저장할 프로퍼티를 선언한다.
  public statusCode: number;
  public status: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    // 부모 Error 클래스에 에러 메시지를 전달한다.
    super(message);

    this.statusCode = statusCode;
    // 상태 코드가 4xx로 시작하면 'fail', 아니면 'error'로 자동 설정한다.
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    // 모든 AppError는 예측 가능한 운영 오류로 간주한다.
    this.isOperational = true;
    // 에러 발생 위치를 추적할 수 있도록 스택 트레이스를 캡처한다.
    Error.captureStackTrace(this, this.constructor);
  }
}
