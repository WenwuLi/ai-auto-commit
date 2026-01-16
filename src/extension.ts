import * as vscode from "vscode";
import { GitService } from "./services/gitService";
import { AIService, isCursorEnvironment } from "./services/aiService";
import { PromptService } from "./services/promptService";
import { CursorRulesService } from "./services/cursorRulesService";

/**
 * 验证并获取 API Provider 配置
 */
function getApiProvider(
  config: vscode.WorkspaceConfiguration
): "openai" | "anthropic" | "custom" | "cursor" {
  const value = config.get<string>("apiProvider", "");
  const validProviders: Array<"openai" | "anthropic" | "custom" | "cursor"> = [
    "openai",
    "anthropic",
    "custom",
    "cursor",
  ];

  // 如果在 Cursor 环境中且未配置 provider，默认使用 cursor
  if (isCursorEnvironment() && (!value || value === "")) {
    return "cursor";
  }

  return validProviders.includes(value as any)
    ? (value as "openai" | "anthropic" | "custom" | "cursor")
    : "openai";
}

/**
 * 插件激活函数
 */
export function activate(context: vscode.ExtensionContext) {
  console.log("AI Auto Commit 插件已激活");

  // 初始化服务
  const gitService = new GitService();
  const aiService = new AIService();
  const promptService = new PromptService();
  const cursorRulesService = new CursorRulesService();

  // 注册命令：生成 AI 提交信息
  const generateCommand = vscode.commands.registerCommand(
    "ai-commit.generate",
    async () => {
      try {
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "正在生成 AI 提交信息",
            cancellable: false,
          },
          async (progress) => {
            progress.report({ increment: 0, message: "检查 Git 工作区..." });

            // 1. 检查是否是 Git 仓库
            const isGitRepo = await gitService.isGitRepository();
            if (!isGitRepo) {
              vscode.window.showErrorMessage("当前目录不是 Git 仓库");
              return;
            }

            progress.report({ increment: 10, message: "获取代码变更..." });

            // 2. 获取 Git diff
            const diff = await gitService.getStagedDiff();
            if (!diff || diff.trim().length === 0) {
              vscode.window.showWarningMessage(
                "没有检测到已暂存的代码变更，请先使用 git add 暂存文件"
              );
              return;
            }

            progress.report({ increment: 20, message: "检查规则文件..." });

            // 3. 检测 .cursorrules 文件
            const hasRulesFile = await cursorRulesService.exists();
            
            // 如果没有规则文件，提示用户
            if (!hasRulesFile) {
              const result = await cursorRulesService.promptToGenerate();
              if (result === "error") {
                return;
              }
              // 如果用户选择生成，继续执行
              // 如果用户取消，也继续执行（使用默认规则）
            }

            progress.report({ increment: 30, message: "准备生成提交信息..." });

            // 4. 获取配置
            const config = vscode.workspace.getConfiguration("aiCommit");
            const apiProvider = getApiProvider(config);
            const apiKey = config.get<string>("apiKey", "");
            const customPrompt = config.get<string>("customPrompt", "");

            // 5. 根据环境选择处理方式
            const isCursor = isCursorEnvironment();
            const useCursorBuiltin = isCursor && 
              (apiProvider === "cursor" || (!apiKey && apiProvider !== "openai" && apiProvider !== "anthropic" && apiProvider !== "custom"));

            if (useCursorBuiltin) {
              // Cursor 环境：直接调用 Cursor 内置功能
              // Cursor 会自动读取 .cursorrules 文件
              progress.report({ increment: 50, message: "调用 Cursor AI..." });
              
              try {
                const result = await aiService.generateCommitMessage("", {
                  provider: "cursor",
                  apiKey: "",
                  model: "",
                  maxTokens: 200,
                  temperature: 0.7,
                });

                if (result === "__CURSOR_BUILTIN__") {
                  progress.report({ increment: 20, message: "已触发 Cursor 生成" });
                  // Cursor 内置功能会自动填充提交信息到 Git 面板
                  return;
                }
              } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "未知错误";
                vscode.window.showErrorMessage(`Cursor AI 调用失败：${errorMessage}`);
                return;
              }
            } else {
              // VS Code 环境或配置了其他 API：使用 API 调用
              if (!apiKey) {
                vscode.window.showErrorMessage(
                  "请先配置 API 密钥。打开设置，搜索 'COTC' 进行配置。"
                );
                return;
              }

              progress.report({ increment: 40, message: "读取规则文件..." });

              // 读取 .cursorrules 文件内容
              const cursorRulesContent = await cursorRulesService.read();

              progress.report({ increment: 50, message: "生成提示词..." });

              // 生成提示词
              const prompt = promptService.generatePrompt(
                diff,
                cursorRulesContent || undefined,
                customPrompt || undefined
              );

              progress.report({ increment: 60, message: "调用 AI 生成提交信息..." });

              try {
                const commitMessage = await aiService.generateCommitMessage(prompt, {
                  provider: apiProvider,
                  apiKey: apiKey,
                  apiEndpoint: config.get<string>("apiEndpoint", ""),
                  model: config.get<string>("model", "gpt-3.5-turbo"),
                  maxTokens: config.get<number>("maxTokens", 200),
                  temperature: config.get<number>("temperature", 0.7),
                });

                if (commitMessage) {
                  // 显示生成的提交信息
                  const action = await vscode.window.showInformationMessage(
                    `生成的提交信息：\n${commitMessage}`,
                    "复制到剪贴板",
                    "取消"
                  );

                  if (action === "复制到剪贴板") {
                    await vscode.env.clipboard.writeText(commitMessage);
                    vscode.window.showInformationMessage("提交信息已复制到剪贴板");
                  }
                } else {
                  vscode.window.showWarningMessage("AI 未能生成提交信息，请重试");
                }
              } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "未知错误";
                vscode.window.showErrorMessage(`AI 生成提交信息失败：${errorMessage}`);
              }
            }

            progress.report({ increment: 100, message: "完成" });
          }
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "未知错误";
        vscode.window.showErrorMessage(`生成提交信息失败：${errorMessage}`);
      }
    }
  );

  // 注册命令：生成规则文件
  const generateRulesCommand = vscode.commands.registerCommand(
    "ai-commit.generateRules",
    async () => {
      try {
        const exists = await cursorRulesService.exists();
        
        if (exists) {
          const action = await vscode.window.showWarningMessage(
            ".cursorrules 文件已存在，是否覆盖？",
            "覆盖",
            "取消"
          );
          
          if (action !== "覆盖") {
            return;
          }
        }

        const success = await cursorRulesService.generate();
        if (success) {
          vscode.window.showInformationMessage(
            ".cursorrules 文件已生成！您可以根据项目需要进行修改。"
          );
          
          // 打开生成的文件
          const workspaceFolders = vscode.workspace.workspaceFolders;
          if (workspaceFolders && workspaceFolders.length > 0) {
            const filePath = vscode.Uri.joinPath(
              workspaceFolders[0].uri,
              ".cursorrules"
            );
            const doc = await vscode.workspace.openTextDocument(filePath);
            await vscode.window.showTextDocument(doc);
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "未知错误";
        vscode.window.showErrorMessage(`生成规则文件失败：${errorMessage}`);
      }
    }
  );

  // 注册命令：配置
  const configCommand = vscode.commands.registerCommand(
    "ai-commit.config",
    async () => {
      try {
        await vscode.commands.executeCommand(
          "workbench.action.openSettings",
          "@ext:cotc-ai-auto-commit"
        );
      } catch (error) {
        console.error("打开设置失败：", error);
        vscode.window.showErrorMessage("打开设置失败，请手动打开设置面板");
      }
    }
  );

  context.subscriptions.push(generateCommand, generateRulesCommand, configCommand);
}

/**
 * 插件停用函数
 */
export function deactivate() {
  console.log("AI Auto Commit 插件已停用");
}
