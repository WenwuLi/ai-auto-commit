import * as vscode from "vscode";
import * as path from "path";
import { DEFAULT_COMMIT_RULES } from "../constants/defaultCommitRules";

/**
 * .cursorrules 文件服务
 * 负责检测、读取和生成 .cursorrules 文件
 */
export class CursorRulesService {
  /**
   * 默认的 .cursorrules 模板
   */
  private readonly defaultTemplate = DEFAULT_COMMIT_RULES;


  /**
   * 获取工作区根目录
   */
  private getWorkspaceRoot(): string | undefined {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      return workspaceFolders[0].uri.fsPath;
    }
    return undefined;
  }

  /**
   * 获取 .cursorrules 文件路径
   */
  private getCursorRulesPath(): string | undefined {
    const workspaceRoot = this.getWorkspaceRoot();
    if (!workspaceRoot) {
      return undefined;
    }
    return path.join(workspaceRoot, ".cursorrules");
  }

  /**
   * 检测 .cursorrules 文件是否存在
   */
  async exists(): Promise<boolean> {
    const filePath = this.getCursorRulesPath();
    if (!filePath) {
      return false;
    }

    try {
      const uri = vscode.Uri.file(filePath);
      await vscode.workspace.fs.stat(uri);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 读取 .cursorrules 文件内容
   */
  async read(): Promise<string | null> {
    const filePath = this.getCursorRulesPath();
    if (!filePath) {
      return null;
    }

    try {
      const uri = vscode.Uri.file(filePath);
      const content = await vscode.workspace.fs.readFile(uri);
      return Buffer.from(content).toString("utf-8");
    } catch {
      return null;
    }
  }

  /**
   * 生成 .cursorrules 文件
   * @param customContent 自定义内容，为空则使用默认模板
   */
  async generate(customContent?: string): Promise<boolean> {
    const filePath = this.getCursorRulesPath();
    if (!filePath) {
      vscode.window.showErrorMessage("无法获取工作区路径");
      return false;
    }

    try {
      const uri = vscode.Uri.file(filePath);
      const content = customContent || this.defaultTemplate;
      await vscode.workspace.fs.writeFile(
        uri,
        Buffer.from(content, "utf-8")
      );
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "未知错误";
      vscode.window.showErrorMessage(`生成 .cursorrules 文件失败：${errorMessage}`);
      return false;
    }
  }

  /**
   * 获取默认模板
   */
  getDefaultTemplate(): string {
    return this.defaultTemplate;
  }

  /**
   * 提示用户是否生成 .cursorrules 文件
   * @returns true 表示已生成或用户取消，false 表示发生错误
   */
  async promptToGenerate(): Promise<"generated" | "cancelled" | "error"> {
    const action = await vscode.window.showWarningMessage(
      "未检测到 .cursorrules 文件。生成规则文件可以让 AI 按照您的规范生成提交信息。",
      "生成规则文件",
      "使用默认规则",
      "取消"
    );

    if (action === "生成规则文件") {
      const success = await this.generate();
      if (success) {
        vscode.window.showInformationMessage(
          ".cursorrules 文件已生成，您可以根据项目需要进行修改"
        );
        return "generated";
      }
      return "error";
    }

    if (action === "使用默认规则") {
      return "cancelled";
    }

    return "cancelled";
  }
}

