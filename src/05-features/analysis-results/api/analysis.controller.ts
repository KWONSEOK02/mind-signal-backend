import { Response, NextFunction } from 'express';
import { AnalysisResult } from '@06-entities/analysis-results';
import { Session } from '@06-entities/sessions';
import { AppError } from '@07-shared/errors';
import { AuthedRequest } from '@07-shared/types';

/** 그룹 분석 결과 조회 수행함 */
export const getAnalysisResult = async (
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { groupId } = req.params;

    if (!req.user?.id) {
      throw new AppError('인증이 필요합니다.', 401);
    }

    // 소유권 검증: 요청자가 해당 그룹 참여자인지 확인함
    const sessions = await Session.find({ groupId });
    const isParticipant = sessions.some(
      (s) => s.userId?.toString() === req.user!.id
    );
    if (!isParticipant) {
      throw new AppError('해당 그룹에 대한 접근 권한이 없습니다.', 403);
    }

    const result = await AnalysisResult.findOne({ groupId }).populate(
      'user1Id user2Id',
      'name'
    );

    if (!result) {
      throw new AppError('분석 결과를 찾을 수 없습니다.', 404);
    }

    const user1 = result.user1Id as any;
    const user2 = result.user2Id as any;

    res.status(200).json({
      status: 'success',
      data: {
        groupId: result.groupId,
        matchingScore: result.matchingScore,
        synchronyScore: result.synchronyScore,
        yScore: result.yScore,
        aiComment: result.aiComment,
        markdown: result.markdown,
        user1Name: user1?.name || null,
        user2Name: user2?.name || null,
      },
    });
  } catch (error) {
    next(error);
  }
};
