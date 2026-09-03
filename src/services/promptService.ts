import { DEFAULT_COMMIT_RULES } from '../constants/defaultCommitRules';

/**
 * 提示词服务类
 * 负责生成用于 AI 的系统提示词与用户消息
 */
export class PromptService {
  /**
   * 系统提示词：项目 .cursorrules 优先，否则使用内置默认规则
   */
  getSystemPrompt(cursorRulesContent?: string): string {
    if (cursorRulesContent && cursorRulesContent.trim().length > 0) {
      return cursorRulesContent.trim();
    }
    return DEFAULT_COMMIT_RULES.trim();
  }

  /**
   * 用户消息：放入已暂存 diff，并约束只输出提交信息
   */
  generateUserPrompt(diff: string, customPrompt?: string): string {
    if (customPrompt && customPrompt.trim().length > 0) {
      return this.replacePlaceholders(customPrompt, diff);
    }

    const truncatedDiff = this.truncateDiff(diff);
    return `请根据以下已经提供的 Git diff 生成一条提交信息。
代码变更已包含在本消息中，不要向用户索取 diff，不要自我介绍，不要解释规范。

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
