import * as vscode from "vscode";
import { GitService } from "./services/gitService";
import { AIService } from "./services/aiService";
import { PromptService, CommitType } from "./services/promptService";

/**
 * 验证并获取 CommitType 配置
 */
function getCommitType(config: vscode.WorkspaceConfiguration): CommitType {
  const value = config.get<string>("commitType", "conventional");
  const validTypes: CommitType[] = ["conventional", "simple", "custom"];
  return validTypes.includes(value as CommitType)
    ? (value as CommitType)
    : "conventional";
}

/**
 * 检测是否在 Cursor 环境中运行
 */
function isCursorEnvironment(): boolean {
  const appName =
    typeof vscode.env.appName === "string"
      ? vscode.env.appName.toLowerCase()
      : "";
  const cursorEnv = process.env.CURSOR === "1" || process.env.CURSOR === "true";
  const vscodeCursorEnv =
    process.env.VSCODE_CURSOR === "1" || process.env.VSCODE_CURSOR === "true";
  const hasCursorInName = appName.includes("cursor");
  const isNotVSCode = appName.length > 0 && appName !== "visual studio code";

  return cursorEnv || vscodeCursorEnv || hasCursorInName || isNotVSCode;
}

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
 * 显示 Cursor AI 不可用的提示消息
 */
function showCursorAIUnavailableMessage(): void {
  vscode.window
    .showInformationMessage(
      "无法直接调用 Cursor 内置 AI。建议使用 Cursor 内置的 Git 提交功能（在 Git 侧边栏点击 ✨ 图标），或在设置中配置 aiCommit.apiKey 使用其他 AI 提供商。",
      "打开设置"
    )
    .then((action) => {
      if (action === "打开设置") {
        vscode.commands.executeCommand(
          "workbench.action.openSettings",
          "@ext:ai-auto-commit"
        );
      }
    });
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

  // 注册命令：生成 AI 提交信息
  const generateCommand = vscode.commands.registerCommand(
    "ai-commit.generate",
    async () => {
      try {
        // 显示进度提示
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

            progress.report({ increment: 20, message: "获取代码变更..." });

            // 2. 获取 Git diff
            const diff = await gitService.getStagedDiff();
            if (!diff || diff.trim().length === 0) {
              vscode.window.showWarningMessage(
                "没有检测到已暂存的代码变更，请先使用 git add 暂存文件"
              );
              return;
            }

            progress.report({ increment: 40, message: "生成提示词..." });

            // 3. 生成提示词
            const config = vscode.workspace.getConfiguration("aiCommit");
            const commitType = getCommitType(config);
            const prompt = promptService.generatePrompt(
              diff,
              config.get<string>("customPrompt", ""),
              commitType
            );

            progress.report({
              increment: 60,
              message: "调用 AI 生成提交信息...",
            });

            // 4. 调用 AI 生成提交信息
            const apiProvider = getApiProvider(config);
            const apiKey = config.get<string>("apiKey", "");

            // 如果在 Cursor 环境中且未配置 API 密钥，尝试使用 Cursor 内置 AI
            const useCursorAI =
              isCursorEnvironment() &&
              (!apiKey || apiKey === "") &&
              apiProvider !== "openai" &&
              apiProvider !== "anthropic" &&
              apiProvider !== "custom";

            // 这里开始真正调用 AI 服务来生成提交信息
            // 提前声明变量，用于接收 AI 返回的提交信息
            let commitMessage: string | null = null;
            try {
              // 更新进度提示：正在让 AI 处理并生成提交信息
              progress.report({ increment: 80, message: "处理提交信息..." });
              commitMessage = await aiService.generateCommitMessage(prompt, {
                // provider:
                // - 如果在 Cursor 环境中且未配置 apiKey，则尝试使用 Cursor 内置 AI（provider 为 'cursor'）
                // - 否则使用用户在设置中配置的 provider（openai / anthropic / custom）
                provider: useCursorAI ? "cursor" : apiProvider,
                // apiKey: 当使用 openai / anthropic / custom 时，需要用户在设置中配置的密钥
                apiKey: apiKey,
                // apiEndpoint: 自定义接口地址，主要用于 custom provider
                apiEndpoint: config.get<string>("apiEndpoint", ""),
                // model: 使用的模型名称，例如 gpt-3.5-turbo / gpt-4 等
                model: config.get<string>("model", "gpt-3.5-turbo"),
                // maxTokens: 限制 AI 返回的最大 token 数，避免回复过长
                maxTokens: config.get<number>("maxTokens", 200),
                // temperature: 控制生成结果的“随机性”，数值越大越有创造性、越小越保守
                temperature: config.get<number>("temperature", 0.7),
              });
            } catch (error) {
              const errorMessage =
                error instanceof Error ? error.message : "未知错误";
              // 如果在 Cursor 环境中且使用 cursor provider，给出更友好的提示
              if (useCursorAI && isCursorEnvironment()) {
                showCursorAIUnavailableMessage();
              } else {
                vscode.window.showErrorMessage(
                  `AI 生成提交信息失败：${errorMessage}`
                );
              }
              return;
            }

            // AI 调用成功，更新进度到 90%
            progress.report({ increment: 10, message: "完成" });
            
            // 添加短暂延迟，确保用户能看到"完成"消息
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "未知错误";
        vscode.window.showErrorMessage(`生成提交信息失败：${errorMessage}`);
      }
    }
  );

  // 注册命令：配置
  const configCommand = vscode.commands.registerCommand(
    "ai-commit.config",
    async () => {
      await vscode.commands.executeCommand(
        "workbench.action.openSettings",
        "@ext:ai-auto-commit"
      );
    }
  );

  context.subscriptions.push(generateCommand, configCommand);
}

/**
 * 插件停用函数
 */
export function deactivate() {
  console.log("AI Auto Commit 插件已停用");
}
