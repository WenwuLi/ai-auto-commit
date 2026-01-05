# AI Auto Commit

一个 VS Code/Cursor 插件，使用 AI 自动生成高质量的 Git 提交信息。

## 功能特性

- 🤖 **AI 生成提交信息**：自动分析代码变更，生成规范的提交信息
- 🎯 **多种 AI 模型支持**：支持 OpenAI、Anthropic 等主流 AI 服务
- ✏️ **自定义提示词**：支持自定义提示词模板，适配团队规范
- 🔒 **安全可靠**：支持配置 API 密钥，数据安全可控
- 📝 **多种提交格式**：支持 Conventional Commits、简单格式等
- ⚙️ **灵活配置**：支持全局和项目级别配置

## 安装

1. 克隆或下载此项目
2. 运行 `npm install` 安装依赖
3. 按 `F5` 启动调试模式，或运行 `vsce package` 打包插件

## 配置

### 在 Cursor 中使用（推荐）

在 Cursor 中，插件会自动检测环境并尝试使用 Cursor 内置 AI，**无需配置 API 密钥**！

只需：
1. 安装插件
2. 使用命令 `生成 AI 提交信息` 即可

如果 Cursor 内置 AI 不可用，插件会提示你配置其他 AI 提供商。

### 在 VS Code 或其他编辑器中配置

在 VS Code 设置中配置：

- `aiCommit.apiProvider`: AI 服务提供商（cursor/openai/anthropic/custom）
  - 在 Cursor 中建议使用 `cursor`（默认，无需 API 密钥）
  - 在其他编辑器中使用 `openai`、`anthropic` 或 `custom`
- `aiCommit.apiKey`: API 密钥（使用 cursor 提供商时不需要）
- `aiCommit.model`: 模型名称
- `aiCommit.customPrompt`: 自定义提示词
- `aiCommit.commitType`: 提交信息格式

## 使用

### 基本使用流程

1. **修改代码** - 在 Git 工作区中修改代码文件
2. **暂存文件** - 使用 `git add` 暂存要提交的文件
3. **生成提交信息** - 按快捷键 `Ctrl+H Ctrl+H`（Windows/Linux）或 `Cmd+H Cmd+H`（macOS），或打开命令面板（Ctrl+Shift+P / Cmd+Shift+P），运行 `生成 AI 提交信息` 命令
4. **确认提交** - 查看生成的提交信息，选择：
   - "使用此提交信息" - 直接提交
   - "编辑后提交" - 编辑后再提交
   - "取消" - 不提交

### 自定义快捷键

如果你想修改默认快捷键 `Ctrl+H Ctrl+H`：

1. 打开键盘快捷键设置：
   - Windows/Linux: `Ctrl+K Ctrl+S`
   - macOS: `Cmd+K Cmd+S`
2. 搜索 "生成 AI 提交信息" 或 "ai-commit.generate"
3. 双击该命令，按下你想要的新快捷键组合
4. 按 `Enter` 确认

### 配置步骤

#### 在 Cursor 中（推荐）
1. 安装插件后即可直接使用，无需配置！
2. 插件会自动使用 Cursor 内置 AI
3. 默认快捷键：`Ctrl+H Ctrl+H`（可在键盘快捷键设置中修改）

#### 在 VS Code 或其他编辑器中
1. 打开 VS Code 设置（Ctrl+, / Cmd+,）
2. 搜索 "AI Auto Commit"
3. 配置以下必要项：
   - `AI Commit: Api Provider` - 选择 AI 服务提供商（openai/anthropic/custom）
   - `AI Commit: Api Key` - 输入 API 密钥
   - `AI Commit: Model` - 输入模型名称（如 gpt-3.5-turbo）
4. （可选）配置高级选项：
   - `AI Commit: Custom Prompt` - 自定义提示词
   - `AI Commit: Commit Type` - 提交格式类型

## 开发

```bash
npm install
npm run compile
npm run watch
```

## 许可证

MIT
