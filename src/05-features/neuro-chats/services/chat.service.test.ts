const mockSend = jest.fn();
const mockConverseCommand = jest.fn().mockImplementation((input) => input);

jest.mock('@07-shared/config/config', () => ({
  config: {
    bedrock: {
      region: 'ap-northeast-2',
      accessKeyId: 'test-access-key',
      secretAccessKey: 'test-secret-key',
      modelId: 'test-inference-profile',
    },
  },
}));

jest.mock('@aws-sdk/client-bedrock-runtime', () => ({
  BedrockRuntimeClient: jest.fn().mockImplementation(() => ({
    send: mockSend,
  })),
  ConverseCommand: mockConverseCommand,
}));

jest.mock('@06-entities/analysis-results', () => ({
  AnalysisResult: { findOne: jest.fn() },
}));

import { chatService } from './chat.service';

describe('chatService.callLLM — Amazon Bedrock 연동 검증함', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Bedrock Converse 응답의 페이지 키워드를 URL 안내 응답으로 변환함', async () => {
    mockSend.mockResolvedValue({
      output: { message: { content: [{ text: 'Keyword: 소개' }] } },
    });

    const result = await chatService.callLLM('프로젝트 소개를 보고 싶어요');

    expect(mockConverseCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        modelId: 'test-inference-profile',
        messages: [
          {
            role: 'user',
            content: [{ text: '프로젝트 소개를 보고 싶어요' }],
          },
        ],
      })
    );
    expect(result).toEqual({
      status: 'success',
      message: '관련 페이지를 안내해 드립니다.',
      url: 'https://mind-signal-frontend.vercel.app/intro',
      level: 1,
    });
  });

  it('Bedrock 오류 시 문의 유도용 기본 응답을 반환함', async () => {
    mockSend.mockRejectedValue(new Error('Access denied'));
    const consoleError = jest.spyOn(console, 'error').mockImplementation();

    const result = await chatService.callLLM('도움말');

    expect(result).toEqual({
      status: 'success',
      message: '죄송합니다. 요청하신 질문에 대해 답변을 찾지 못했습니다.',
      url: '',
      level: 3,
    });
    consoleError.mockRestore();
  });

  it('알 수 없는 Keyword 제어 표식을 사용자 응답으로 노출하지 않음', async () => {
    mockSend.mockResolvedValue({
      output: { message: { content: [{ text: 'Keyword: 없는페이지' }] } },
    });

    const result = await chatService.callLLM('없는 페이지로 이동해 주세요');

    expect(result).toEqual({
      status: 'success',
      message: '죄송합니다. 요청하신 질문에 대해 답변을 찾지 못했습니다.',
      url: '',
      level: 3,
    });
  });
});
