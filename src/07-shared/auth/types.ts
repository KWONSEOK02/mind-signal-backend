import { Request } from 'express';

// Express의 Request 타입을 확장하여 userId를 포함시킵니다.
export interface AuthedRequest extends Request {
  userId?: string;
}