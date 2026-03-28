import { Router } from 'express';
import * as surveyController from './survey.controller';
import { authenticate } from '@07-shared/middlewares';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Surveys
 *     description: 사용자 성향 분석용 설문 관리
 */

/**
 * @openapi
 * /api/surveys/questions:
 *   get:
 *     summary: 모든 설문 문항 목록 조회
 *     tags: [Surveys]
 *     responses:
 *       200:
 *         description: 문항 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "60d...123"
 *                       category:
 *                         type: string
 *                         example: "personality"
 *                       questionText:
 *                         type: string
 *                         example: "당신은 외향적인가요?"
 *                       answerType:
 *                         type: string
 *                         example: "scale"
 *       404:
 *         description: 등록된 문항이 없음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "fail"
 *                 message:
 *                   type: string
 *                   example: "등록된 설문 문항을 찾을 수 없습니다."
 */

//설문 문항 조회
router.get('/questions', surveyController.getQuestions);

/**
 * @openapi
 * /api/surveys/responses:
 *   post:
 *     summary: 설문 응답 일괄 저장
 *     tags: [Surveys]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - responses
 *             properties:
 *               responses:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - questionId
 *                     - answerValue
 *                   properties:
 *                     questionId:
 *                       type: string
 *                       example: "69614a125d6dc2a89bb5acbb"
 *                     answerValue:
 *                       oneOf:
 *                         - type: string
 *                         - type: integer
 *                       description: 설문 유형에 따라 텍스트(string) 또는 척도(integer)
 *                       example: 4
 *     responses:
 *       201:
 *         description: 저장 완료
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: number
 *                       example: 5
 *       400:
 *         description: 응답 데이터 누락
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "fail"
 *                 message:
 *                   type: string
 *                   example: "제출할 응답 데이터가 없습니다."
 *       401:
 *         description: 인증 실패 (토큰 없음 혹은 유효하지 않음)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "fail"
 *                 message:
 *                   type: string
 *                   example: "인증이 필요합니다."
 */

//설문조사 응답 제출
router.post('/responses', authenticate, surveyController.submitResponses);

/**
 * @openapi
 * /api/surveys/responses:
 *   get:
 *     summary: 내 설문 응답 목록 조회
 *     tags: [Surveys]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 내 응답 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "65c9f0b2a1b2c3d4e5f67890"
 *                       userId:
 *                         type: string
 *                         example: "695a003df33270433494b87e"
 *                       questionId:
 *                         type: string
 *                         example: "65a...123"
 *                       answerValue:
 *                         example: 4
 *       401:
 *         description: 인증 실패 (토큰 없음 혹은 유효하지 않음)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "fail"
 *                 message:
 *                   type: string
 *                   example: "인증이 필요합니다."
 *       404:
 *         description: 제출한 응답 내역이 없음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "fail"
 *                 message:
 *                   type: string
 *                   example: "사용자의 설문 응답 내역이 존재하지 않습니다."
 */

// 인증된 사용자 본인의 응답을 볼 수 있음
router.get('/responses', authenticate, surveyController.getUserResponses);

export default router;
