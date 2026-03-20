import { Router } from 'express';
import { engineController } from './engine.controller';
import { authenticate } from '@07-shared/middlewares/authenticate.middleware';
import { validate } from '@07-shared/middlewares/validate.middleware';
import { z } from 'zod';

const router = Router();

// 파이썬 엔진이 구동 시 자동 호출하는 등록 엔드포인트
const registerSchema = z.object({
  engineUrl: z.string().url(),
  secretKey: z.string().min(1),
});

router.post('/register', validate(registerSchema), engineController.register);

// 프론트엔드 → 백엔드 → 파이썬 엔진 분석 프록시
const analyzeSchema = z.object({
  groupId: z.string().min(1),
  subjectIndices: z.array(z.number().int().positive()),
  includeMarkdown: z.boolean().optional().default(false),
});

router.post(
  '/analyze',
  authenticate,
  validate(analyzeSchema),
  engineController.analyze
);

// 전체 파이프라인 분석 프록시
const analyzePipelineSchema = z.object({
  groupId: z.string().min(1),
  subjectIndices: z.array(z.number().int().positive()),
  params: z
    .object({
      stimulusDurationSec: z.number().int().positive().optional(),
      windowSizeSec: z.number().int().positive().optional(),
      nStimuli: z.number().int().positive().optional(),
      baselineDurationSec: z.number().int().positive().optional(),
      bandCols: z.array(z.string()).optional(),
    })
    .optional(),
  satisfactionScores: z.record(z.string(), z.number()).optional(),
  includeMarkdown: z.boolean().optional().default(false),
});

router.post(
  '/analyze/pipeline',
  authenticate,
  validate(analyzePipelineSchema),
  engineController.analyzePipeline
);

export default router;
