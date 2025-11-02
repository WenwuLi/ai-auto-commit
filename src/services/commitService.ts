import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * 提交服务类
 * 负责处理 Git 提交操作
 */
export class CommitService {
  private workspaceRoot: string | undefined;

  constructor() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    this.workspaceRoot = workspaceFolders?.[0]?.uri.fsPath;
  }

  /**
   * 格式化提交信息
   * 清理多余的空行、换行符等
   */
  formatCommitMessage(message: string): string {
    // 移除可能的代码块标记
    let formatted = message
      .replace(/^```[\s\S]*?```$/gm, '') // 移除代码块
      .replace(/^`[^`]+`$/gm, '') // 移除行内代码
      .trim();

    // 清理多余的空行（保留最多一个空行）
    formatted = formatted.replace(/\n{3,}/g, '\n\n');

    // 移除首尾空白
    formatted = formatted.trim();

    // 如果提交信息被引号包裹，移除引号
    if (
      (formatted.startsWith('"') && formatted.endsWith('"')) ||
      (formatted.startsWith("'") && formatted.endsWith("'"))
    ) {
      formatted = formatted.slice(1, -1);
    }

    return formatted;
  }

  /**
   * 执行 Git 提交
   */
  async commit(message: string): Promise<void> {
    if (!this.workspaceRoot) {
      throw new Error('未找到工作区根目录');
    }

    if (!message || message.trim().length === 0) {
      throw new Error('提交信息不能为空');
    }

    try {
      // 转义提交信息中的特殊字符
      const escapedMessage = message.replace(/"/g, '\\"').replace(/\$/g, '\\$');

      // 执行 git commit
      await execAsync(`git commit -m "${escapedMessage}"`, {
        cwd: this.workspaceRoot,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      throw new Error(`Git 提交失败：${errorMessage}`);
    }
  }

  /**
   * 验证提交信息格式
   */
  validateCommitMessage(message: string, commitType: string = 'conventional'): {
    valid: boolean;
    error?: string;
  } {
    if (!message || message.trim().length === 0) {
      return {
        valid: false,
        error: '提交信息不能为空',
      };
    }

    // 检查第一行长度（通常建议不超过 50 或 72 个字符）
    const firstLine = message.split('\n')[0];
    if (firstLine.length > 72) {
      return {
        valid: false,
        error: '提交信息第一行过长（建议不超过 72 个字符）',
      };
    }

    // 如果使用 Conventional Commits 格式，验证格式
    if (commitType === 'conventional') {
      const conventionalCommitPattern = /^(feat|fix|docs|style|refactor|perf|test|chore|build|ci)(\(.+\))?: .+/;
      if (!conventionalCommitPattern.test(firstLine)) {
        return {
          valid: true, // 警告但不阻止提交
          error: '提交信息可能不符合 Conventional Commits 格式',
        };
      }
    }

    return {
      valid: true,
    };
  }
}
