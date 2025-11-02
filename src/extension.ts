import * as vscode from 'vscode';
import { GitService } from './services/gitService';
import { AIService } from './services/aiService';
import { PromptService, CommitType } from './services/promptService';
import { CommitService } from './services/commitService';

/**
 * 验证并获取 CommitType 配置
 */
function getCommitType(config: vscode.WorkspaceConfiguration): CommitType {
  const value = config.get<string>('commitType', 'conventional');
  const validTypes: CommitType[] = ['conventional', 'simple', 'custom'];
  return validTypes.includes(value as CommitType) ? (value as CommitType) : 'conventional';
}

/**
 * 验证并获取 API Provider 配置
 */
function getApiProvider(config: vscode.WorkspaceConfiguration): 'openai' | 'anthropic' | 'custom' {
  const value = config.get<string>('apiProvider', 'openai');
  const validProviders: Array<'openai' | 'anthropic' | 'custom'> = ['openai', 'anthropic', 'custom'];
  return validProviders.includes(value as any) ? (value as 'openai' | 'anthropic' | 'custom') : 'openai';
}

/**
 * 插件激活函数
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('AI Auto Commit 插件已激活');

  // 初始化服务
  const gitService = new GitService();
  const aiService = new AIService();
  const promptService = new PromptService();
  const commitService = new CommitService();

  // 注册命令：生成 AI 提交信息
  const generateCommand = vscode.commands.registerCommand(
    'ai-commit.generate',
    async () => {
      try {
        // 显示进度提示
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: '正在生成 AI 提交信息...',
            cancellable: false,
          },
          async (progress) => {
            progress.report({ increment: 0, message: '检查 Git 工作区...' });

            // 1. 检查是否是 Git 仓库
            const isGitRepo = await gitService.isGitRepository();
            if (!isGitRepo) {
              vscode.window.showErrorMessage('当前目录不是 Git 仓库');
              return;
            }

            progress.report({ increment: 20, message: '获取代码变更...' });

            // 2. 获取 Git diff
            const diff = await gitService.getStagedDiff();
            if (!diff || diff.trim().length === 0) {
              vscode.window.showWarningMessage('没有检测到已暂存的代码变更，请先使用 git add 暂存文件');
              return;
            }

            progress.report({ increment: 40, message: '生成提示词...' });

            // 3. 生成提示词
            const config = vscode.workspace.getConfiguration('aiCommit');
            const commitType = getCommitType(config);
            const prompt = promptService.generatePrompt(
              diff,
              config.get<string>('customPrompt', ''),
              commitType
            );

            progress.report({ increment: 60, message: '调用 AI 生成提交信息...' });

            // 4. 调用 AI 生成提交信息
            const apiProvider = getApiProvider(config);
            const commitMessage = await aiService.generateCommitMessage(prompt, {
              provider: apiProvider,
              apiKey: config.get<string>('apiKey', ''),
              apiEndpoint: config.get<string>('apiEndpoint', ''),
              model: config.get<string>('model', 'gpt-3.5-turbo'),
              maxTokens: config.get<number>('maxTokens', 200),
              temperature: config.get<number>('temperature', 0.7),
            });

            if (!commitMessage) {
              vscode.window.showErrorMessage('AI 生成提交信息失败，请检查配置');
              return;
            }

            progress.report({ increment: 80, message: '处理提交信息...' });

            // 5. 清理和格式化提交信息
            const formattedMessage = commitService.formatCommitMessage(commitMessage);

            progress.report({ increment: 100, message: '完成' });

            // 6. 显示提交信息供用户确认
            // 先显示提交信息预览
            const previewDoc = await vscode.workspace.openTextDocument({
              content: formattedMessage,
              language: 'plaintext',
            });
            await vscode.window.showTextDocument(previewDoc, { preview: true });

            // 显示操作选项
            const action = await vscode.window.showInformationMessage(
              `已生成提交信息，请查看编辑器预览。`,
              '使用此提交信息',
              '编辑后提交',
              '取消'
            );

            if (action === '使用此提交信息') {
              await commitService.commit(formattedMessage);
              vscode.window.showInformationMessage('提交成功！');
            } else if (action === '编辑后提交') {
              // 获取预览文档的当前内容（用户可能已经编辑过）
              const currentContent = previewDoc.getText();
              const editedMessage = await vscode.window.showInputBox({
                prompt: '编辑提交信息（或直接在编辑器中修改后关闭）',
                value: currentContent,
                validateInput: (text) => {
                  if (text.trim().length === 0) {
                    return '提交信息不能为空';
                  }
                  return null;
                },
              });

              if (editedMessage) {
                await commitService.commit(editedMessage);
                // 关闭预览文档
                await vscode.window.showTextDocument(previewDoc).then(
                  () => vscode.commands.executeCommand('workbench.action.closeActiveEditor')
                );
                vscode.window.showInformationMessage('提交成功！');
              }
            }
          }
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        vscode.window.showErrorMessage(`生成提交信息失败：${errorMessage}`);
      }
    }
  );

  // 注册命令：配置
  const configCommand = vscode.commands.registerCommand('ai-commit.config', async () => {
    await vscode.commands.executeCommand('workbench.action.openSettings', '@ext:ai-auto-commit');
  });

  context.subscriptions.push(generateCommand, configCommand);
}

/**
 * 插件停用函数
 */
export function deactivate() {
  console.log('AI Auto Commit 插件已停用');
}
