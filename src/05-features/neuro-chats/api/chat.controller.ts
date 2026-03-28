import { Request, Response } from 'express';
import { chatService } from '../services/chat.service';

export const handleChat = async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        status: 'error',
        message: '메시지가 전달되지 않았습니다.',
        url: '',
      });
    }

    const result = await chatService.processMessage(message);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Chat controller error:', error);
    return res.status(500).json({
      status: 'error',
      message: '채팅 처리 중 오류가 발생했습니다.',
      url: '',
    });
  }
};

export const handleAskChat = async (req: Request, res: Response) => {
  try {
    const { message, email } = req.body;

    if (!message || !email) {
      return res.status(400).json({
        status: 'error',
        message: '이메일과 문의 내용을 모두 입력해 주세요.',
      });
    }

    const result = await chatService.sendInquiryEmail(email, message);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Ask chat controller error:', error);
    return res.status(500).json({
      status: 'error',
      message: '문의 처리 중 오류가 발생했습니다.',
    });
  }
};
