import { Router } from 'express';
import * as surveyController from './survey.controller';
import { authenticate } from '@07-shared/middlewares';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Surveys
 * description: 사용자 성향 분석용 설문 관리
 */

/**
 * @openapi
 * /api/surveys/questions:
 *   get:
 *     summary: 모든 설문 문항 목록 조회
 *     description: 사용자에게 보여줄 모든 설문 질문 리스트를 반환합니다.
 *     tags: [Surveys]
 *     responses:
 *       200:
 *         description: 문항 조회 성공
 */

//설문 문항 조회
router.get('/questions', surveyController.getQuestions);

/**
 * @openapi
 * /api/surveys/responses:
 *   post:
 *     summary: 설문 응답 일괄 저장
 *     description: 사용자가 작성한 여러 설문 응답 데이터를 한 번에 저장합니다.
 *     tags: [Surveys]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: 응답 저장 완료
 *   get:
 *     summary: 내 설문 응답 목록 조회
 *     description: 로그인한 사용자가 이전에 제출했던 설문 응답들을 조회합니다.
 *     tags: [Surveys]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 응답 목록 조회 성공
 */

//설문조사 응답 제출
router.post('/responses', authenticate, surveyController.submitResponses);

// 인증된 사용자 본인의 응답을 볼 수 있음
router.get('/responses', authenticate, surveyController.getUserResponses);

export default router;
