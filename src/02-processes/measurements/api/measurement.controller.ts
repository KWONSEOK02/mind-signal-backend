import { Request, Response, NextFunction } from 'express';
import * as measurementService from '@02-processes/measurements/services/measurement.service';

const measurementController = {
  /**
   * 뇌파 측정 시작 핸들러
   */
  startStreaming: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;

      // 서비스 로직 호출
      const result =
        await measurementService.startMeasurementService(sessionId);

      return res.status(200).json({
        status: 'success',
        message: '측정이 시작되었습니다.',
        ...result,
      });
    } catch (error) {
      // 에러 발생 시 전역 핸들러로 전달
      return next(error);
    }
  },
};

export default measurementController;
