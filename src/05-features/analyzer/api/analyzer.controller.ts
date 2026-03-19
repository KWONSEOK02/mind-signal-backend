import { Response, NextFunction } from 'express';
import { AuthedRequest } from '@07-shared/types';
import * as analyzerService from '../services/analyzer.service';

// 데이터 엔진에 유저 아이디로 데이터 요청
const analyzerController = {
  getAnalyzerData: async (
    req: AuthedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      // authenticate 미들웨어에서 추출한 토큰 정보를 사용하여 본인의 데이터를 조회합니다.
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          status: 'fail',
          message: '인증 정보가 유효하지 않습니다.',
        });
      }
      const data = await analyzerService.getAnalyzerData(userId);
      return res.status(200).json({
        status: 'success',
        ...data,
      });
    } catch (error) {
      next(error);
    }
  },
};

export default analyzerController;
