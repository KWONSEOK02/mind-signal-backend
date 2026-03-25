import { config } from '@07-shared/config/config';
import { searchPreList } from '../config/search-pre-list';
import { CHAT_PROMPT } from '../config/chat-prompt';
import { knowledgeBase } from '../config/knowledge-base';
import { GoogleGenerativeAI } from '@google/generative-ai';


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
      };
    }

    // 2. LLM 호출 (지식 베이스 답변 또는 페이지 추천)
    const llmResult = await this.callLLM(message);
    return llmResult;
  },

  async callLLM(
    message: string
  ): Promise<{ status: string; message: string; url: string }> {
    const apiKeys = config.geminiApiKeys;
    const defaultResponse = {
      status: 'success',
      message: '죄송합니다. 요청하신 질문에 대해 답변을 찾지 못했습니다.',
      url: '',
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

        // 1. 특정 키워드 패턴인지 확인 (Keyword: [키워드])
        if (rawResult.startsWith('Keyword:')) {
          const keyword = rawResult.split('Keyword:')[1]?.trim();
          if (keyword && searchPreList[keyword]) {
            return {
              status: 'success',
              message: '관련 페이지를 안내해 드립니다.',
              url: searchPreList[keyword],
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
              url: searchPreList[foundInList]
            };
          }
        }

        // 2. 직접 답변인 경우
        return {
          status: 'success',
          message: rawResult,
          url: '',
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
};

