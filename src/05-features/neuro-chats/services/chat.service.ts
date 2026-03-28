import { config } from '@07-shared/config/config';
import { searchPreList } from '../config/search-pre-list';
import { CHAT_PROMPT } from '../config/chat-prompt';
import { knowledgeBase } from '../config/knowledge-base';
import { GoogleGenerativeAI } from '@google/generative-ai';
import nodemailer from 'nodemailer';

export const chatService = {
  async processMessage(message: string) {
    // 1. search_pre_list 에서 직접 매칭 확인 (성능 및 정확도를 위해 LLM 전 단계에서 수행)
    const matchedKeyword = Object.keys(searchPreList).find((keyword) =>
      message.includes(keyword)
    );

    if (matchedKeyword) {
      return {
        status: 'success',
        message: `관련 사이트를 안내해 드립니다.`,
        url: searchPreList[matchedKeyword],
        level: 1,
      };
    }

    // 2. LLM 호출 (지식 베이스 답변 또는 페이지 추천)
    const llmResult = await this.callLLM(message);
    return llmResult;
  },

  async callLLM(
    message: string
  ): Promise<{ status: string; message: string; url: string; level: number }> {
    const apiKeys = config.geminiApiKeys;
    const defaultResponse = {
      status: 'success',
      message: '죄송합니다. 요청하신 질문에 대해 답변을 찾지 못했습니다.',
      url: '',
      level: 3,
    };

    if (!apiKeys || !apiKeys.some((k) => !!k)) {
      console.warn('GEMINI_API_KEYS are not set');
      return defaultResponse;
    }

    const keywords = Object.keys(searchPreList).join(', ');
    const prompt = CHAT_PROMPT.replace('{knowledgeBase}', knowledgeBase)
      .replace('{keywords}', keywords)
      .replace('{message}', message);

    for (let i = 0; i < apiKeys.length; i++) {
      const apiKey = apiKeys[i];
      if (!apiKey) continue;

      try {
        console.log(`Gemini API 호출 시도 (Key ${i + 1}/${apiKeys.length})`);
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: 'gemini-3.1-flash-lite-preview',
          generationConfig: {
            temperature: 0.1,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 256,
          },
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const rawResult = response.text().trim();

        // 0. 답변할 수 없는 경우 (Prompt 규칙 3)
        if (rawResult === 'NoAnswer') {
          return defaultResponse;
        }

        // 1. 특정 키워드 패턴인지 확인 (Keyword: [키워드])
        if (rawResult.startsWith('Keyword:')) {
          const keyword = rawResult.split('Keyword:')[1]?.trim();
          if (keyword && searchPreList[keyword]) {
            return {
              status: 'success',
              message: '관련 페이지를 안내해 드립니다.',
              url: searchPreList[keyword],
              level: 1,
            };
          }

          // 키워드가 목록에 없을 경우 유사한 키워드 검색
          const foundInList = Object.keys(searchPreList).find((k) =>
            keyword.includes(k)
          );
          if (foundInList) {
            return {
              status: 'success',
              message: '관련 페이지를 안내해 드립니다.',
              url: searchPreList[foundInList],
              level: 1,
            };
          }
        }

        // 2. 직접 답변인 경우
        return {
          status: 'success',
          message: rawResult,
          url: '',
          level: 2,
        };
      } catch (error: any) {
        console.error(
          `Gemini API call failed with key ${i + 1}:`,
          error.message
        );
        if (i === apiKeys.length - 1) break;
        console.warn(`Attempting with next key...`);
      }
    }

    return defaultResponse;
  },

  // 챗봇 문의하기 서비스 SMTP 로 연동

  // 구글버전
  async sendInquiryEmail(email: string, message: string) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"챗봇 문의" <${process.env.GMAIL_USER}>`,
      // to: process.env.GMAIL_USER,
      to: process.env.ASK_USER,
      subject: '챗봇 문의 도착',
      text: `보낸 사람: ${email}\n내용: ${message}`,
    });

    return { status: 'success' };
  },

  // 다음버전
  //   async sendInquiryEmail(email: string, message: string) {
  //     const transporter = nodemailer.createTransport({
  //       host: 'smtp.daum.net',
  //       port: 465,
  //       secure: true, // SSL 필수
  //       auth: {
  //         user: process.env.DAUM_USER,
  //         pass: process.env.DAUM_PASS,
  //       },
  //     });

  //     await transporter.sendMail({
  //       from: `"챗봇 문의" <${process.env.DAUM_USER}>`,
  //       to: process.env.ASK_USER,

  //       subject: '챗봇 문의 도착',
  //       text: `보낸 사람: ${email}\n내용: ${message}`,
  //     });

  //     return { ok: true };
  //   },
};
