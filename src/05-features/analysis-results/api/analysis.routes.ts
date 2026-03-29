import { Router } from 'express';
import { getAnalysisResult } from './analysis.controller';
import { authenticate } from '@07-shared/middlewares';

const router = Router();

/**
 * @openapi
 * /api/analysis/{groupId}:
 *   get:
 *     summary: 그룹 분석 결과 조회
 *     description: 측정 완료 후 생성된 분석 결과를 groupId로 조회함
 *     tags: [Analysis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: groupId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 분석 결과 조회 성공
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 접근 권한 없음
 *       404:
 *         description: 분석 결과 미존재
 */
router.get('/:groupId', authenticate, getAnalysisResult);

export default router;
