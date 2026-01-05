import * as vscode from 'vscode';
import axios, { AxiosInstance } from 'axios';

/**
 * AI 服务配置接口
 */
export interface AIServiceConfig {
  provider: 'openai' | 'anthropic' | 'custom' | 'cursor';
  apiKey: string;
  apiEndpoint?: string;
  model: string;
  maxTokens: number;

  
  temperature: number;
}

/**
 * 检测是否在 Cursor 环境中运行
 */
function isCursorEnvironment(): boolean {
  // 检测 Cursor 特有的环境变量或标识
  const appName = typeof vscode.env.appName === 'string' ? vscode.env.appName.toLowerCase() : '';
  const cursorEnv = process.env.CURSOR === '1' || process.env.CURSOR === 'true';
  const vscodeCursorEnv = process.env.VSCODE_CURSOR === '1' || process.env.VSCODE_CURSOR === 'true';
  const hasCursorInName = appName.includes('cursor');
  const isNotVSCode = appName.length > 0 && appName !== 'visual studio code';
  
  return cursorEnv || vscodeCursorEnv || hasCursorInName || isNotVSCode;
}

/**
 * AI 服务类
 * 负责调用各种 AI API 生成提交信息
 */
export class AIService {
  private axiosInstance: AxiosInstance;
  private isCursor: boolean;

  constructor() {
    this.axiosInstance = axios.create({
      timeout: 30000, // 30 秒超时
    });
    this.isCursor = isCursorEnvironment();
  }

  /**
   * 生成提交信息
   */
  async generateCommitMessage(prompt: string, config: AIServiceConfig): Promise<string | null> {
    // 如果配置了 provider 为 cursor
    if (config.provider === 'cursor') {
      // 如果不在 Cursor 环境中，提示错误
      if (!this.isCursor) {
        throw new Error('当前不在 Cursor 环境中，无法使用 Cursor AI。请切换到 Cursor 或配置其他 AI 提供商。');
      }
      
      // 在 Cursor 环境中，尝试使用 Cursor 内置 AI
      const cursorResult = await this.callCursorAI(prompt);
      if (cursorResult) {
        return cursorResult;
      }
      
      // 如果 callCursorAI 返回 null，说明无法直接调用，但可能 Cursor 已经通过其他方式处理了
      // 如果配置了其他 API，回退使用
      if (config.apiKey) {
        console.warn('Cursor AI 不可用，回退到配置的 API');
        // 继续执行，使用配置的 API
      } else {
        // 如果没有配置 API，返回 null 让上层处理
        // 上层可以提示用户使用 Cursor 内置功能
        return null;
      }
    }

    // 如果使用其他提供商，需要 API 密钥
    if (config.provider !== 'cursor' && !config.apiKey) {
      throw new Error('未配置 API 密钥，请在设置中配置 aiCommit.apiKey，或切换到 Cursor 环境使用内置 AI');
    }

    // 如果 provider 不是 cursor，或者 cursor 调用失败但有 API 密钥，使用配置的 API
    try {
      switch (config.provider) {
        case 'openai':
          return await this.callOpenAI(prompt, config);
        case 'anthropic':
          return await this.callAnthropic(prompt, config);
        case 'custom':
          return await this.callCustomAPI(prompt, config);
        case 'cursor':
          // 如果走到这里，说明 cursor 调用失败但有 API 密钥，应该使用其他提供商
          // 但这里不应该执行，因为如果 provider 是 cursor，上面已经处理了
          throw new Error('Cursor AI 不可用，请配置其他 AI 提供商');
        default:
          throw new Error(`不支持的 AI 提供商：${config.provider}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      throw new Error(`AI 服务调用失败：${errorMessage}`);
    }
  }

  /**
   * 调用 Cursor 内置 AI
   * 尝试通过多种方式调用 Cursor 的 AI 功能
   */
  private async callCursorAI(prompt: string): Promise<string | null> {
    // 方法1: 尝试使用 Cursor 的 AI 扩展 API（如果存在）
    try {
      // 尝试通过 vscode API 访问 Cursor 的 AI
      // Cursor 可能通过全局对象暴露 AI API
      const cursorAI = (vscode as any).cursor?.ai || (global as any).cursor?.ai;
      if (cursorAI) {
        // 尝试不同的方法名
        if (typeof cursorAI.complete === 'function') {
          const result = await cursorAI.complete({
            prompt: prompt,
            maxTokens: 200,
            temperature: 0.7,
          });
          if (result) return result.trim();
        }
        if (typeof cursorAI.chat === 'function') {
          const result = await cursorAI.chat({
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
          });
          if (result) return result.trim();
        }
      }
    } catch (error) {
      console.warn('Cursor AI 扩展 API 不可用:', error);
    }

    // 方法2: 尝试使用 Cursor 的本地 API 端点（如果存在）
    // Cursor 可能通过本地服务器提供 API
    const possibleEndpoints = [
      process.env.CURSOR_API_ENDPOINT,
      'http://localhost:8080/api/chat',
      'http://127.0.0.1:8080/api/chat',
    ].filter(Boolean) as string[];

    for (const endpoint of possibleEndpoints) {
      try {
        const response = await this.axiosInstance.post(
          endpoint,
          {
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
          },
          {
            timeout: 5000, // 较短的超时
          }
        );

        const message =
          response.data.choices?.[0]?.message?.content ||
          response.data.content?.[0]?.text ||
          response.data.text ||
          response.data.message;

        if (message) return message.trim();
      } catch (error) {
        // 继续尝试下一个端点
        continue;
      }
    }

    // 方法3: 尝试调用 Cursor 的生成提交信息命令
    // 注意：这个命令可能不会直接返回结果，但我们可以尝试
    try {
      // 尝试执行命令，虽然可能不会返回结果
      await vscode.commands.executeCommand('cursor.generateGitCommitMessage');
      // 如果命令执行成功但没有返回值，说明 Cursor 可能已经通过内置功能处理了
      // 返回 null，让上层知道可能需要使用 Cursor 内置功能
      return null;
    } catch (error) {
      // 命令可能不存在
      console.warn('Cursor 命令不可用:', error);
    }

    // 如果所有方法都失败，返回 null 而不是抛出错误
    // 这样可以让上层决定如何处理（比如提示用户使用 Cursor 内置功能）
    return null;
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
