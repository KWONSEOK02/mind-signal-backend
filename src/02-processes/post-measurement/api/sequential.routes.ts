import { Router, Response, NextFunction } from 'express';
import { authenticate } from '@07-shared/middlewares/authenticate.middleware';
import { validate } from '@07-shared/middlewares/validate.middleware';
import { AppError } from '@07-shared/errors';
import { runSequentialAnalysisPipeline } from '../services/sequential-analysis.service';
import { Session } from '@06-entities/sessions';
import { z } from 'zod';
import type { AuthedRequest } from '@07-shared/types/type';

const router = Router();

/** POST /sequential 요청 body 검증 스키마 */
const sequentialAnalyzeSchema = z.object({
  groupId: z.string().min(1),
  algorithm: z.string().optional(),
});

/**
 * POST /api/analyze/sequential
 * operator "Analyze" 버튼 → SEQUENTIAL 모드 분석 파이프라인 트리거함
 * 인증 필수 + 세션 소유권 검증함
 */
router.post(
  '/sequential',
  authenticate,
  validate(sequentialAnalyzeSchema),
  async (req: AuthedRequest, res: Response, next: NextFunction) => {
    try {
      const { groupId, algorithm } = req.body;
      const requesterId = req.user?.id;

      // 소유권 검증: groupId의 세션 생성자만 분석 가능함
      const session = await Session.findOne({ groupId }).sort({
        subjectIndex: 1,
      });

      if (!session) {
        throw new AppError(`groupId=${groupId} 세션을 찾을 수 없습니다.`, 404);
      }

      if (
        session.creatorId === null ||
        session.creatorId.toString() !== requesterId
      ) {
        throw new AppError('이 세션에 대한 분석 권한이 없습니다.', 403);
      }

      const result = await runSequentialAnalysisPipeline(
        groupId,
        algorithm ?? 'default'
      );

      res.status(200).json({ success: true, result });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
