import { Router } from 'express';
import { handleChat, handleAskChat } from './chat.controller';
import { optionalAuthenticate } from '@07-shared/middlewares';
import { validate } from '@07-shared/middlewares/validate.middleware';
import { chatMessageSchema, chatAskSchema } from './chat.schema';

const router = Router();

/**
 * @swagger
 * /api/chat:
 *   post:
 *     summary: 채팅 메시지를 분석하여 관련 페이지를 추천합니다.
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: "소개는 어디에서 보나요."
 *     responses:
 *       200:
 *         description: 채팅 분석 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 url:
 *                   type: string
 */
// validate는 optionalAuthenticate 뒤에 배치함
router.post('/', optionalAuthenticate, validate(chatMessageSchema), handleChat);

/**
 * @swagger
 * /api/chat/ask:
 *   post:
 *     summary: 사용자 문의사항을 이메일로 전송합니다.
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *               message:
 *                 type: string
 *                 example: "문의사항 내용입니다."
 *     responses:
 *       200:
 *         description: 문의 전송 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 */
// validate 미들웨어 추가함
router.post('/ask', validate(chatAskSchema), handleAskChat);

export { router as chatApi };
