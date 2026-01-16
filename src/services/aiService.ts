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
export function isCursorEnvironment(): boolean {
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
   * 检查是否在 Cursor 环境
   */
  isInCursorEnvironment(): boolean {
    return this.isCursor;
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
      
      // Cursor 环境：直接执行内置命令
      // Cursor 会自动读取 .cursorrules 文件来生成提交信息
      return this.callCursorBuiltin();
    }

    // 如果使用其他提供商，需要 API 密钥
    if (!config.apiKey) {
      throw new Error('未配置 API 密钥，请在设置中配置 aiCommit.apiKey');
    }

    // 使用配置的 API 提供商
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
   * 调用 Cursor 内置功能
   * 执行 cursor.generateGitCommitMessage 命令
   * Cursor 会自动读取 .cursorrules 文件
   */
  private async callCursorBuiltin(): Promise<string> {
    try {
      await vscode.commands.executeCommand('cursor.generateGitCommitMessage');
      // 返回特殊标记，表示已触发 Cursor 内置功能
      return "__CURSOR_BUILTIN__";
    } catch (error) {
      throw new Error('Cursor 内置命令执行失败，请确保 Git 仓库状态正常');
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
