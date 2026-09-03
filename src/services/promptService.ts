/**
 * 提示词服务类
 * 负责生成用于 AI 的提示词
 */
export class PromptService {
  /**
   * 默认提示词模板（当没有 .cursorrules 文件时使用）
   */
  private readonly defaultRules = `使用中文生成提交信息，遵循 Conventional Commits：
<类型>(<范围>): <主题>

类型使用英文小写：feat / fix / docs / style / refactor / test / chore / perf / ci / build / revert。
标题行不超过 72 个字符，主题用祈使句。`;

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
    if (customPrompt && customPrompt.trim().length > 0) {
      return this.replacePlaceholders(customPrompt, diff);
    }

    const rules =
      cursorRulesContent && cursorRulesContent.trim().length > 0
        ? cursorRulesContent.trim()
        : this.defaultRules;

    return this.buildTaskPrompt(rules, diff);
  }

  /**
   * 将规则与 diff 组成明确任务，避免模型把规则文件当成对话人设去寒暄。
   */
  private buildTaskPrompt(rules: string, diff: string): string {
    const truncatedDiff = this.truncateDiff(diff);
    return `你的任务：根据下方已经提供的 Git diff 生成一条提交信息。
代码变更已包含在本消息中，不要向用户索取 diff，不要自我介绍，不要解释规范。

提交信息必须遵守以下规则：
${rules}

【代码变更】
${truncatedDiff}

【输出要求】
只输出提交信息正文（可含标题、空行后的正文和页脚）。不要使用 Markdown 代码块包裹，不要输出任何前缀说明。`;
  }

  /**
   * 替换提示词模板中的占位符
   */
  private replacePlaceholders(template: string, diff: string): string {
    const truncatedDiff = this.truncateDiff(diff);
    // 用 split/join，避免 String.replace 把 diff 里的 $ 当成替换模式
    if (template.includes('{diff}')) {
      return template.split('{diff}').join(truncatedDiff);
    }
    return `${template}

【代码变更】
${truncatedDiff}

只输出提交信息，不要寒暄或索取 diff。`;
  }

  private truncateDiff(diff: string): string {
    const maxDiffLength = 8000;
    if (diff.length > maxDiffLength) {
      return diff.substring(0, maxDiffLength) + '\n\n... (代码变更过长，已截断)';
    }
    return diff;
  }
}
