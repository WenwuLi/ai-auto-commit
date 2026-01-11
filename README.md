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

### 环境要求

- Node.js >= 18.0.0
- npm 或 yarn
- VS Code 或 Cursor（用于开发和调试）

### 开发步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd ai-auto-commit
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **编译项目**
   ```bash
   npm run compile
   ```
   这将 TypeScript 代码编译到 `out/` 目录。

4. **启动监听模式**（可选）
   ```bash
   npm run watch
   ```
   在开发时，此命令会监听文件变化并自动重新编译。

5. **调试插件**
   - 按 `F5` 启动调试模式
   - 这会打开一个新的 VS Code/Cursor 窗口（扩展开发宿主）
   - 在新窗口中测试插件功能
   - 在原始窗口中查看调试日志和断点

6. **打包插件**
   ```bash
   # 安装打包工具（如果未安装）
   npm install -g @vscode/vsce
   
   # 方式1：使用 build 命令（推荐）
   npm run build
   # 这会编译代码并打包到 release/ 目录
   
   # 方式2：手动打包
   vsce package
   # 打包后会生成 `.vsix` 文件到当前目录
   ```
   
   **说明**：
   - `npm run build` 会自动编译 TypeScript 代码，然后打包插件到 `release/` 目录
   - 打包后会生成 `ai-auto-commit-<version>.vsix` 文件
   - 可以通过 VS Code 的扩展面板安装 `.vsix` 文件（扩展面板 → 三个点 → 从 VSIX 安装）

### 项目结构

```
ai-auto-commit/
├── src/                    # 源代码目录
│   ├── extension.ts        # 插件入口文件
│   └── services/          # 服务模块
│       ├── gitService.ts      # Git 服务
│       ├── aiService.ts       # AI 服务
│       ├── promptService.ts   # 提示词服务
│       └── commitService.ts   # 提交服务
├── out/                   # 编译输出目录
├── package.json           # 插件配置和依赖
├── tsconfig.json          # TypeScript 配置
└── README.md             # 项目说明文档
```

### 开发注意事项

- 修改代码后需要重新编译（`npm run compile`）或使用监听模式（`npm run watch`）
- 调试时需要在新的扩展开发宿主窗口中测试，而不是在原始窗口
- 查看调试日志：在调试控制台中查看 `[AI Commit]` 和 `[AI Service]` 开头的日志
- 快捷键配置在 `package.json` 的 `keybindings` 字段中

## 许可证

MIT
