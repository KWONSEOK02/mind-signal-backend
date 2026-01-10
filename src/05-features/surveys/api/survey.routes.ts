import { Router } from 'express';
import * as surveyController from './survey.controller';
import { authenticate } from '@07-shared/middlewares';

const router = Router();

//설문 문항 조회
router.get('/questions', surveyController.getQuestions);

//설문조사 응답 제출
router.post('/responses', authenticate, surveyController.submitResponses);

// 인증된 사용자 본인의 응답을 볼 수 있음
router.get('/responses', authenticate, surveyController.getUserResponses);

export default router;
