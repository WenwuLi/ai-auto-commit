# COTC AI Auto Commit

一个 VS Code/Cursor 插件，使用 AI 自动生成高质量的 Git 提交信息。

## 功能特性

- 🤖 **AI 生成提交信息**：自动分析代码变更，生成规范的提交信息
- 🎯 **多种 AI 模型支持**：支持 OpenAI、Anthropic 等主流 AI 服务
- ✏️ **自定义提示词**：支持自定义提示词模板，适配团队规范
- 🔒 **安全可靠**：支持配置 API 密钥，数据安全可控
- 📝 **多种提交格式**：支持 Conventional Commits、简单格式等
- ⚙️ **灵活配置**：支持全局和项目级别配置
- ⚡ **快捷操作**：支持快捷键快速生成和提交

## 安装

### 从 VS Code Marketplace 安装（推荐）

1. 打开 VS Code 或 Cursor
2. 按 `Ctrl+Shift+X`（Windows/Linux）或 `Cmd+Shift+X`（macOS）打开扩展面板
3. 搜索 "COTC AI Auto Commit"
4. 点击 "Install" 安装

或者直接访问：[Marketplace 链接](https://marketplace.visualstudio.com/items?itemName=menmou.cotc-ai-auto-commit)

## 配置

### 在 Cursor 中使用（推荐）

在 Cursor 中，插件会自动检测环境并尝试使用 Cursor 内置 AI，**无需配置 API 密钥**！

只需：
1. 安装插件
2. 使用命令 `生成 AI 提交信息` 即可

如果 Cursor 内置 AI 不可用，插件会提示你配置其他 AI 提供商。

### 在 VS Code 或其他编辑器中配置

在 VS Code 设置中配置：

#### 必填配置（使用 openai/anthropic/custom 时）

- `aiCommit.apiProvider` **[必填]**：AI 服务提供商
  - 可选值：`openai`、`anthropic`、`custom`
  - 默认值：`openai`（如果未配置）
- `aiCommit.apiKey` **[必填]**：API 密钥
  - 使用 `openai` 或 `anthropic` 时必须配置
  - 使用 `custom` 时根据自定义接口要求配置

#### 可选配置

- `aiCommit.model` **[可选]**：模型名称
  - 默认值：`gpt-3.5-turbo`
  - 示例：`gpt-4`、`claude-3-opus` 等
- `aiCommit.customPrompt` **[可选]**：自定义提示词
  - 默认值：空（使用内置提示词模板）
  - 用于自定义提交信息的生成规则
- `aiCommit.commitType` **[可选]**：提交信息格式
  - 可选值：`conventional`（Conventional Commits）、`simple`（简单格式）、`custom`（自定义）
  - 默认值：`conventional`

#### 在 Cursor 中使用

在 Cursor 中，所有配置均为 **[非必填]**：
- 插件会自动检测 Cursor 环境并使用内置 AI（`cursor` provider）
- 无需配置 `apiProvider` 和 `apiKey` 即可使用
- 如需使用其他 AI 提供商，可按照上述必填配置进行设置

## 使用

### 基本使用流程

1. **修改代码** - 在 Git 工作区中修改代码文件
2. **暂存文件** - 使用 `git add` 暂存要提交的文件
3. **生成提交信息** - 有两种方式：
   - **方式1（仅生成）**：按快捷键 `Ctrl+H Ctrl+H`（Windows/Linux）或 `Cmd+H Cmd+H`（macOS）
   - **方式2（生成并提交）**：按快捷键 `Ctrl+M Ctrl+M`（Windows/Linux）或 `Cmd+M Cmd+M`（macOS）
   - 或打开命令面板（`Ctrl+Shift+P` / `Cmd+Shift+P`），运行：
     - `生成 AI 提交信息` - 仅生成提交信息
     - `生成 AI 提交信息并提交` - 生成后询问是否提交
4. **确认提交**（使用方式2时）：
   - "使用此提交信息" - 直接提交
   - "编辑后提交" - 编辑后再提交
   - "取消" - 不提交

### 快捷键说明

- `Ctrl+H Ctrl+H` / `Cmd+H Cmd+H`：生成 AI 提交信息（仅生成，不提交）
- `Ctrl+M Ctrl+M` / `Cmd+M Cmd+M`：生成 AI 提交信息并询问是否提交

**自定义快捷键**：

如果你想修改默认快捷键：

1. 打开键盘快捷键设置：
   - Windows/Linux: `Ctrl+K Ctrl+S`
   - macOS: `Cmd+K Cmd+S`
2. 搜索 "生成 AI 提交信息" 或 "ai-commit.generate"
3. 双击该命令，按下你想要的新快捷键组合
4. 按 `Enter` 确认

## 常见问题

### Q: 在 Cursor 中使用需要配置 API 密钥吗？
A: 不需要！在 Cursor 中，插件会自动使用 Cursor 内置 AI，无需任何配置即可使用。

### Q: 如何修改提交信息格式？
A: 在设置中搜索 "AI Commit: Commit Type"，可以选择：
- `conventional` - Conventional Commits 格式（推荐）
- `simple` - 简单格式
- `custom` - 自定义格式

### Q: 支持哪些 AI 服务？
A: 目前支持：
- **Cursor 内置 AI**（在 Cursor 中使用，无需配置）
- **OpenAI**（需要 API 密钥）
- **Anthropic (Claude)**（需要 API 密钥）
- **自定义 API**（需要配置 API 端点和密钥）

### Q: 生成的提交信息不符合要求怎么办？
A: 你可以：
1. 使用 `Ctrl+M Ctrl+M` 生成后选择 "编辑后提交" 进行修改
2. 在设置中配置自定义提示词（`AI Commit: Custom Prompt`）来调整生成规则

### Q: 快捷键冲突怎么办？
A: 可以在键盘快捷键设置中修改：
1. 按 `Ctrl+K Ctrl+S`（Windows/Linux）或 `Cmd+K Cmd+S`（macOS）
2. 搜索 "COTC AI Auto Commit" 相关命令
3. 修改为你喜欢的快捷键组合

## 许可证

MIT
