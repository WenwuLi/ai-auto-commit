/**
 * 提交信息格式类型
 */
export type CommitType = 'conventional' | 'simple' | 'custom';

/**
 * 提示词服务类
 * 负责生成用于 AI 的提示词
 */
export class PromptService {
  /**
   * 默认提示词模板
   */
  private readonly defaultPromptTemplate = `请根据以下 Git 代码变更，生成一个清晰、规范的提交信息。

要求：
1. 提交信息应该简洁明了，描述代码变更的核心内容
2. 如果使用 Conventional Commits 格式，应该包含类型前缀（如 feat:, fix:, refactor: 等）
3. 第一行是简短摘要（50 字以内），如果需要可以添加详细描述（用空行分隔）
4. 使用中文或英文都可以，但应该与代码库的提交信息风格保持一致

代码变更：
{diff}

请只返回提交信息内容，不要包含其他说明文字。`;

  /**
   * 简单格式提示词模板
   */
  private readonly simplePromptTemplate = `请根据以下 Git 代码变更，生成一个简洁的提交信息（单行，不超过 72 个字符）。

代码变更：
{diff}

请只返回提交信息内容。`;

  /**
   * 生成提示词
   */
  generatePrompt(
    diff: string,
    customPrompt?: string,
    commitType: CommitType = 'conventional'
  ): string {
    // 如果提供了自定义提示词，优先使用
    if (customPrompt && customPrompt.trim().length > 0) {
      return this.replacePlaceholders(customPrompt, diff);
    }

    // 根据提交类型选择模板
    const template =
      commitType === 'simple' ? this.simplePromptTemplate : this.defaultPromptTemplate;

    return this.replacePlaceholders(template, diff);
  }

  /**
   * 替换提示词模板中的占位符
   */
  private replacePlaceholders(template: string, diff: string): string {
    // 限制 diff 长度，避免超出 token 限制
    const maxDiffLength = 8000;
    const truncatedDiff =
      diff.length > maxDiffLength
        ? diff.substring(0, maxDiffLength) + '\n\n... (代码变更过长，已截断)'
        : diff;

    return template.replace('{diff}', truncatedDiff);
  }

  /**
   * 生成带上下文的提示词（包含文件列表、分支信息等）
   */
  generateContextualPrompt(
    diff: string,
    changedFiles: string[],
    branchName?: string,
    customPrompt?: string,
    commitType: CommitType = 'conventional'
  ): string {
    let context = '';

    if (branchName) {
      context += `当前分支：${branchName}\n\n`;
    }

    if (changedFiles.length > 0) {
      context += `变更的文件：\n${changedFiles.map((file) => `- ${file}`).join('\n')}\n\n`;
    }

    // 如果提供了自定义提示词，优先使用
    if (customPrompt && customPrompt.trim().length > 0) {
      const promptWithContext = context + customPrompt;
      return this.replacePlaceholders(promptWithContext, diff);
    }

    // 根据提交类型选择模板
    const template =
      commitType === 'simple' ? this.simplePromptTemplate : this.defaultPromptTemplate;

    const promptWithContext = context + template;
    return this.replacePlaceholders(promptWithContext, diff);
  }
}
