/**
 * 提示词服务类
 * 负责生成用于 AI 的提示词
 */
export class PromptService {
  /**
   * 默认提示词模板（当没有 .cursorrules 文件时使用）
   */
  private readonly defaultPromptTemplate = `请根据以下 Git 代码变更，生成一个清晰、规范的提交信息。

要求：
1. 必须使用中文生成提交信息
2. 遵循 Conventional Commits 格式，包含类型前缀（如 feat:, fix:, refactor: 等）
3. 格式：<类型>(<范围>): <主题>
4. 标题行不超过 72 个字符
5. 如需详细描述，用空行分隔后添加

代码变更：
{diff}

请只返回提交信息内容，不要包含其他说明文字。`;

  /**
   * 生成提示词
   * @param diff Git 代码变更
   * @param cursorRulesContent .cursorrules 文件内容（如果存在）
   * @param customPrompt 自定义提示词（优先级最高，用于高级用户临时覆盖）
   */
  generatePrompt(
    diff: string,
    cursorRulesContent?: string,
    customPrompt?: string
  ): string {
    // 如果提供了自定义提示词，优先使用（高级用户临时覆盖）
    if (customPrompt && customPrompt.trim().length > 0) {
      return this.replacePlaceholders(customPrompt, diff);
    }

    // 如果有 .cursorrules 文件内容，使用它作为规则
    if (cursorRulesContent && cursorRulesContent.trim().length > 0) {
      // 将 .cursorrules 内容作为规则，添加代码变更
      const ruleBasedTemplate = `${cursorRulesContent}

代码变更：
{diff}

请只返回提交信息内容，不要包含其他说明文字。`;
      return this.replacePlaceholders(ruleBasedTemplate, diff);
    }

    // 否则使用默认规则
    return this.replacePlaceholders(this.defaultPromptTemplate, diff);
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
}
