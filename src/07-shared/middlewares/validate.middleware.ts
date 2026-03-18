// src/middlewares/validate.ts
import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const validate =
  (schema: z.ZodTypeAny) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message).join('\n');
      return res.status(400).json({ status: 'fail', message: messages });
    }
    // 파싱/변환 결과를 사용하도록 교체
    req.body = result.data;
    next();
  };

// req.params 경로 파라미터 검증 미들웨어
export const validateParams =
  (schema: z.ZodTypeAny) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message).join('\n');
      return res.status(400).json({ status: 'fail', message: messages });
    }
    // 파싱/변환 결과를 사용하도록 교체
    req.params = result.data as typeof req.params;
    next();
  };
