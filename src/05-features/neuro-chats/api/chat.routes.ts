import { Router } from 'express';
import { handleChat } from './chat.controller';

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
router.post('/', handleChat);

export { router as chatApi };
