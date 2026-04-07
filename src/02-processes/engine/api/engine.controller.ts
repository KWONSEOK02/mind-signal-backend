import { Request, Response, NextFunction } from 'express';
import { engineRegistryService } from '../services/engine-registry.service';
import { engineProxyService } from '../services/engine-proxy.service';
import { stopMeasurementService } from '@02-processes/measurements/services/measurement.service';

export const engineController = {
  /** 파이썬 엔진 URL 등록 처리함 */
  register: (req: Request, res: Response, next: NextFunction) => {
    try {
      const { engineUrl, secretKey } = req.body;
      engineRegistryService.register(engineUrl, secretKey);
      res.status(200).json({ message: '엔진 등록 완료' });
    } catch (error) {
      next(error);
    }
  },

  /** 파이프라인 분석 요청을 파이썬 엔진으로 프록시함 */
  analyzePipeline: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        groupId,
        subjectIndices,
        params,
        satisfactionScores,
        includeMarkdown,
      } = req.body;
      const result = await engineProxyService.analyzePipeline(
        groupId,
        subjectIndices,
        params,
        satisfactionScores,
        includeMarkdown
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  /** EEG 스트리밍 시작 요청을 파이썬 엔진으로 프록시함 */
  streamStart: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { groupId, subjectIndex } = req.body;
      const result = await engineProxyService.streamStart(
        groupId,
        subjectIndex
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  /** EEG 스트리밍 종료 요청을 파이썬 엔진으로 프록시 + 세션 COMPLETED 전이함 */
  streamStop: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { groupId, subjectIndex, stopReason } = req.body;

      // 1. 엔진에 스트리밍 종료 요청함
      const engineResult = await engineProxyService.streamStop(
        groupId,
        subjectIndex
      );

      // 2. 세션 COMPLETED 전이 + Redis 구독 해제 + stopReason 기록함
      const { allCompleted } = await stopMeasurementService(
        groupId,
        subjectIndex,
        stopReason ?? 'Natural'
      );

      // 3. 모든 subject 완료 시 포스트-측정 오케스트레이션 트리거함
      if (allCompleted) {
        // COMPLETED 세션 수로 DUAL/BTI 판별함 (CANCELLED/EXPIRED 제외)
        const { Session: SessionModel } = await import('@06-entities/sessions');
        const completedCount = await SessionModel.countDocuments({
          groupId,
          status: 'COMPLETED',
        });

        import('@02-processes/post-measurement')
          .then((mod) =>
            completedCount >= 2
              ? mod.runPostMeasurementPipeline(groupId)
              : mod.runBTIAnalysisPipeline(groupId)
          )
          .catch((err) => console.error('포스트-측정 파이프라인 에러:', err));
      }

      res.status(200).json({ ...engineResult, allCompleted });
    } catch (error) {
      next(error);
    }
  },
};
