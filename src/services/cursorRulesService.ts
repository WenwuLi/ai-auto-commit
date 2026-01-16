import * as vscode from "vscode";
import * as path from "path";

/**
 * .cursorrules 文件服务
 * 负责检测、读取和生成 .cursorrules 文件
 */
export class CursorRulesService {
  /**
   * 默认的 .cursorrules 模板
   */
  private readonly defaultTemplate = `# Git 提交信息规则
When generating git commit messages, please follow these rules:

## 概述
使用中文生成提交信息，遵循以下模板格式：

\`\`\`
<类型>(<范围>): <主题>

<正文>

<页脚>
\`\`\`

## 提交类型（类型字段使用英文小写）
- \`feat\`: 新功能（feature）
- \`fix\`: 修复 bug
- \`docs\`: 文档更新
- \`style\`: 代码格式调整（不影响代码运行，如缩进、分号等）
- \`refactor\`: 代码重构（既不修复 bug 也不添加功能的代码变动）
- \`test\`: 添加或修改测试用例
- \`chore\`: 构建过程或辅助工具的变动（如依赖更新、配置文件修改等）
- \`perf\`: 性能优化
- \`ci\`: CI/CD 相关变更
- \`build\`: 构建系统或外部依赖变更
- \`revert\`: 回滚之前的提交

## 格式要求
### 标题行（必填）
- **类型**：使用英文小写（如 \`feat\`, \`fix\`）
- **范围**：使用中文，反映模块/组件名称（如：移动端、客户端、后台、前端、API、数据库等）
- **主题**：使用中文，简洁描述本次提交的主要内容
- **格式**：\`<类型>(<范围>): <主题>\`
- **长度**：标题行不超过 72 个字符（中文字符按 2 个字符计算）

### 正文（可选）
- 提供详细的变更描述，可以分多行
- 多个变更使用项目符号（\`-\`）列出
- 说明本次变更的原因和影响范围
- 每行不超过 72 个字符

### 页脚（可选）
- 可以包含关联的 Issue 编号（如：Closes #123）
- 可以包含破坏性变更说明（如：BREAKING CHANGE: xxx）

### 其他要求
- 标题、正文、页脚之间必须有空行分隔
- 使用中文简体
- 主题使用祈使句

## 示例

### 示例 1：新功能
\`\`\`
feat(用户模块): 添加用户登录功能

- 实现用户名密码登录
- 添加记住密码功能
- 集成第三方登录
\`\`\`

### 示例 2：修复 Bug
\`\`\`
fix(首页): 修复轮播图显示异常问题

修复轮播图在移动端无法正常滑动的问题

相关 Issue: #123
\`\`\`

### 示例 3：重构
\`\`\`
refactor(状态管理): 优化全局状态管理

将 useState 迁移到 useReducer，提升状态管理的可维护性
\`\`\`
`;

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

