import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Git 服务类
 * 负责与 Git 仓库交互，获取代码变更信息
 */
export class GitService {
  private workspaceRoot: string | undefined;

  constructor() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    this.workspaceRoot = workspaceFolders?.[0]?.uri.fsPath;
  }

  /**
   * 检查当前目录是否是 Git 仓库
   */
  async isGitRepository(): Promise<boolean> {
    if (!this.workspaceRoot) {
      return false;
    }

    try {
      await execAsync('git rev-parse --git-dir', {
        cwd: this.workspaceRoot,
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取已暂存文件的 diff
   */
  async getStagedDiff(): Promise<string> {
    if (!this.workspaceRoot) {
      throw new Error('未找到工作区根目录');
    }

    try {
      const { stdout } = await execAsync('git diff --cached', {
        cwd: this.workspaceRoot,
        encoding: 'utf-8',
      });
      return stdout.trim();
    } catch (error) {
      throw new Error(`获取 Git diff 失败：${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 获取所有变更（包括未暂存的）
   */
  async getAllDiff(): Promise<string> {
    if (!this.workspaceRoot) {
      throw new Error('未找到工作区根目录');
    }

    try {
      const { stdout } = await execAsync('git diff HEAD', {
        cwd: this.workspaceRoot,
        encoding: 'utf-8',
      });
      return stdout.trim();
    } catch (error) {
      throw new Error(`获取 Git diff 失败：${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 获取变更的文件列表
   */
  async getChangedFiles(): Promise<string[]> {
    if (!this.workspaceRoot) {
      throw new Error('未找到工作区根目录');
    }

    try {
      const { stdout } = await execAsync('git diff --cached --name-only', {
        cwd: this.workspaceRoot,
        encoding: 'utf-8',
      });
      return stdout
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
    } catch (error) {
      throw new Error(`获取变更文件列表失败：${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 获取当前分支名称
   */
  async getCurrentBranch(): Promise<string> {
    if (!this.workspaceRoot) {
      throw new Error('未找到工作区根目录');
    }

    try {
      const { stdout } = await execAsync('git branch --show-current', {
        cwd: this.workspaceRoot,
        encoding: 'utf-8',
      });
      return stdout.trim();
    } catch (error) {
      throw new Error(`获取分支名称失败：${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
}
