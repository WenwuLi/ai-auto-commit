import axios, { AxiosInstance } from 'axios';

/**
 * AI 服务配置接口
 */
export interface AIServiceConfig {
  provider: 'openai' | 'anthropic' | 'custom';
  apiKey: string;
  apiEndpoint?: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

/**
 * AI 服务类
 * 负责调用各种 AI API 生成提交信息
 */
export class AIService {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      timeout: 30000, // 30 秒超时
    });
  }

  /**
   * 生成提交信息
   */
  async generateCommitMessage(prompt: string, config: AIServiceConfig): Promise<string | null> {
    if (!config.apiKey) {
      throw new Error('未配置 API 密钥，请在设置中配置 aiCommit.apiKey');
    }

    try {
      switch (config.provider) {
        case 'openai':
          return await this.callOpenAI(prompt, config);
        case 'anthropic':
          return await this.callAnthropic(prompt, config);
        case 'custom':
          return await this.callCustomAPI(prompt, config);
        default:
          throw new Error(`不支持的 AI 提供商：${config.provider}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      throw new Error(`AI 服务调用失败：${errorMessage}`);
    }
  }

  /**
   * 调用 OpenAI API
   */
  private async callOpenAI(prompt: string, config: AIServiceConfig): Promise<string | null> {
    const response = await this.axiosInstance.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: config.model,
        messages: [
          {
            role: 'system',
            content: '你是一个专业的 Git 提交信息生成助手，能够根据代码变更生成清晰、规范的提交信息。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: config.maxTokens,
        temperature: config.temperature,
      },
      {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const message = response.data.choices?.[0]?.message?.content;
    return message ? message.trim() : null;
  }

  /**
   * 调用 Anthropic (Claude) API
   */
  private async callAnthropic(prompt: string, config: AIServiceConfig): Promise<string | null> {
    const response = await this.axiosInstance.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: config.model,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        system: '你是一个专业的 Git 提交信息生成助手，能够根据代码变更生成清晰、规范的提交信息。',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      },
      {
        headers: {
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
      }
    );

    const content = response.data.content?.[0]?.text;
    return content ? content.trim() : null;
  }

  /**
   * 调用自定义 API
   */
  private async callCustomAPI(prompt: string, config: AIServiceConfig): Promise<string | null> {
    if (!config.apiEndpoint) {
      throw new Error('自定义 API 需要配置 apiEndpoint');
    }

    // 自定义 API 需要兼容 OpenAI 格式或自定义格式
    // 这里提供一个通用的实现，实际使用时可能需要根据具体 API 调整
    const response = await this.axiosInstance.post(
      config.apiEndpoint,
      {
        model: config.model,
        messages: [
          {
            role: 'system',
            content: '你是一个专业的 Git 提交信息生成助手，能够根据代码变更生成清晰、规范的提交信息。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: config.maxTokens,
        temperature: config.temperature,
      },
      {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // 尝试多种可能的响应格式
    const message =
      response.data.choices?.[0]?.message?.content ||
      response.data.content?.[0]?.text ||
      response.data.text ||
      response.data.message;

    return message ? message.trim() : null;
  }
}
