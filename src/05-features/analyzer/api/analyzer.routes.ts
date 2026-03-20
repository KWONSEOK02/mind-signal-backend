import { Router } from 'express';
import analyzerController from './analyzer.controller';
import { authenticate } from '@07-shared/middlewares';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Analyzer
 *     description: 뇌파 분석 데이터 조회
 */

/**
 * @openapi
 * /api/analyzer:
 *   get:
 *     summary: 내 분석 데이터 조회
 *     description: 인증된 사용자의 정보를 기반으로 데이터 엔진으로부터 분석된 데이터를 조회하여 반환합니다.
 *     tags: [Analyzer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 분석 데이터 조회 성공 (데이터 엔진 응답이 top-level에 spread됨)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "success" }
 *               additionalProperties: true
 *               description: 데이터 엔진으로부터 반환된 뇌파 분석 결과가 status와 함께 top-level에 병합됨
 *       401:
 *         description: 인증 실패 (토큰 문제)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "fail" }
 *                 message: { type: string, example: "인증 정보가 유효하지 않습니다." }
 *       404:
 *         description: 데이터를 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "fail" }
 *                 message: { type: string, example: "데이터 엔진 호출 실패" }
 *       500:
 *         description: 데이터 엔진 연결 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "error" }
 *                 message: { type: string, example: "데이터 엔진 연결 오류" }
 */
router.get('/', authenticate, analyzerController.getAnalyzerData);

export default router;
