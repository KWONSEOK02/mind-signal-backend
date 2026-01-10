declare namespace Express {
  export interface Request {
    user?: {
      id: string; // 또는 실제 user 객체의 타입에 맞게 정의
      // 필요한 다른 user 속성들을 여기에 추가
    };
  }
}
