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
      const { groupId, subjectIndex } = req.body;

      // 1. 엔진에 스트리밍 종료 요청함
      const engineResult = await engineProxyService.streamStop(
        groupId,
        subjectIndex
      );

      // 2. 세션 COMPLETED 전이 + Redis 구독 해제함
      const { allCompleted } = await stopMeasurementService(
        groupId,
        subjectIndex
      );

      // 3. 두 subject 모두 완료 시 포스트-측정 오케스트레이션 트리거함
      if (allCompleted) {
        // Task 11에서 구현할 postMeasurementPipeline 호출 (비동기, 응답 차단하지 않음)
        import('@02-processes/post-measurement')
          .then(({ runPostMeasurementPipeline }) =>
            runPostMeasurementPipeline(groupId)
          )
          .catch((err) => console.error('포스트-측정 파이프라인 에러:', err));
      }

      res.status(200).json({ ...engineResult, allCompleted });
    } catch (error) {
      next(error);
    }
  },
};
