import * as vscode from 'vscode';
import axios, { AxiosInstance } from 'axios';
import { DEFAULT_COMMIT_RULES } from '../constants/defaultCommitRules';

/** API 协议类型（cursor 为 Cursor 内置能力，不走 HTTP） */
export type AIProtocol = 'openai' | 'anthropic' | 'cursor';

/**
 * AI 服务配置接口
 */
export interface AIServiceConfig {
  provider: AIProtocol;
  apiKey: string;
  apiEndpoint?: string;
  model: string;
  maxTokens: number;
  temperature: number;
  systemPrompt?: string;
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
        throw new Error('当前不在 Cursor 环境中，无法使用 Cursor AI。请切换到 Cursor 或配置 OpenAI / Anthropic 协议。');
      }
      
      // Cursor 环境：直接执行内置命令
      // Cursor 会自动读取 .cursorrules 文件来生成提交信息
      return this.callCursorBuiltin();
    }

    if (!config.apiKey) {
      throw new Error('未配置 API 密钥，请在设置中配置 aiCommit.apiKey');
    }

    if (!config.model?.trim()) {
      throw new Error('未配置模型名称，请在设置中配置 aiCommit.model');
    }

    try {
      switch (config.provider) {
        case 'openai':
          return await this.callOpenAI(prompt, config);
        case 'anthropic':
          return await this.callAnthropic(prompt, config);
        default:
          throw new Error(`不支持的 API 协议：${config.provider}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      throw new Error(`AI 服务调用失败：${errorMessage}`);
    }
  }

  /**
   * 根据协议拼接请求地址。
   * 用户填写服务商/聚合商 Base URL（如 https://api.openai.com/v1），
   * 若已包含完整路径则原样使用。
   */
  private resolveApiUrl(config: AIServiceConfig): string {
    const endpoint = (config.apiEndpoint || '').trim();
    if (!endpoint) {
      throw new Error('未配置模型服务地址，请在设置中配置 aiCommit.apiEndpoint');
    }

    const base = endpoint.replace(/\/+$/, '');

    if (config.provider === 'openai') {
      if (/\/chat\/completions$/i.test(base)) {
        return base;
      }
      return `${base}/chat/completions`;
    }

    if (config.provider === 'anthropic') {
      if (/\/v1\/messages$/i.test(base) || /\/messages$/i.test(base)) {
        return base;
      }
      return `${base}/messages`;
    }

    throw new Error(`不支持的 API 协议：${config.provider}`);
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

  private getSystemPrompt(config: AIServiceConfig): string {
    const prompt = (config.systemPrompt || '').trim();
    return prompt || DEFAULT_COMMIT_RULES.trim();
  }

  /**
   * 按 OpenAI 兼容协议请求（官方、中转、聚合商均可）
   */
  private async callOpenAI(prompt: string, config: AIServiceConfig): Promise<string | null> {
    const url = this.resolveApiUrl(config);
    const response = await this.axiosInstance.post(
      url,
      {
        model: config.model,
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(config),
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

    const message = this.extractOpenAIContent(response.data);
    return message ? message.trim() : null;
  }

  /**
   * 兼容 string / 分段 content 等 OpenAI 兼容响应
   */
  private extractOpenAIContent(data: any): string | null {
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content === 'string' && content.trim()) {
      return content;
    }
    if (Array.isArray(content)) {
      const text = content
        .map((part: { text?: string; content?: string }) => part?.text || part?.content || '')
        .join('')
        .trim();
      if (text) {
        return text;
      }
    }
    const fallback =
      data?.choices?.[0]?.text ||
      data?.content?.[0]?.text ||
      data?.text ||
      data?.message;
    return fallback ? String(fallback) : null;
  }

  /**
   * 按 Anthropic Messages 兼容协议请求（官方或支持该协议的聚合商）
   */
  private async callAnthropic(prompt: string, config: AIServiceConfig): Promise<string | null> {
    const url = this.resolveApiUrl(config);
    const response = await this.axiosInstance.post(
      url,
      {
        model: config.model,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        system: this.getSystemPrompt(config),
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
    return content ? String(content).trim() : null;
  }
}
