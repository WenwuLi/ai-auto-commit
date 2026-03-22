# COTC AI Auto Commit

一个 VS Code/Cursor 插件，使用 AI 自动生成高质量的 Git 提交信息。

## 功能特性

- 🤖 **AI 生成提交信息**：自动分析代码变更，生成规范的提交信息
- 🎯 **多种 AI 模型支持**：支持 OpenAI、Anthropic 等主流 AI 服务
- 📋 **统一规则配置**：使用 `.cursorrules` 文件配置提交规则，Cursor 和 VS Code 通用
- 🔒 **安全可靠**：支持配置 API 密钥，数据安全可控
- 📝 **Conventional Commits**：默认支持 Conventional Commits 格式
- ⚙️ **灵活配置**：支持项目级别配置（通过 `.cursorrules` 文件）
- ⚡ **快捷操作**：支持快捷键快速生成提交信息

## 安装

### 从 VS Code Marketplace 安装（推荐）

1. 打开 VS Code 或 Cursor
2. 按 `Ctrl+Shift+X`（Windows/Linux）或 `Cmd+Shift+X`（macOS）打开扩展面板
3. 搜索 "COTC AI Auto Commit"
4. 点击 "Install" 安装

## 快速开始

### 在 Cursor 中使用（推荐，无需配置）

1. 安装插件
2. 在项目中暂存要提交的文件（`git add`）
3. 按 `Ctrl+H Ctrl+H`（或 `Cmd+H Cmd+H`）生成提交信息
4. 首次使用时，插件会提示生成 `.cursorrules` 文件

**工作原理**：在 Cursor 环境中，插件会调用 Cursor 内置 AI，自动读取项目中的 `.cursorrules` 文件来生成符合规范的提交信息。

### 在 VS Code 中使用

VS Code 环境需要配置 API 密钥：

1. 安装插件
2. 打开设置（`Ctrl+,`），搜索 "COTC"
3. 配置 `aiCommit.apiProvider`（选择 `openai` 或 `anthropic`）
4. 配置 `aiCommit.apiKey`（输入你的 API 密钥）
5. 使用 `Ctrl+H Ctrl+H` 生成提交信息

## 配置提交规则

### 使用 .cursorrules 文件（推荐）

插件使用项目根目录的 `.cursorrules` 文件来定义提交信息格式。这个文件在 Cursor 和 VS Code 中都会被读取。

**生成规则文件**：

1. 打开命令面板（`Ctrl+Shift+P`）
2. 运行 `COTC生成规则文件`
3. 插件会在项目根目录创建 `.cursorrules` 文件
4. 根据项目需要修改规则内容

**默认规则示例**：

```markdown
# Git 提交信息规则

## 格式
<类型>(<范围>): <主题>

## 类型
- feat: 新功能
- fix: 修复 bug
- docs: 文档更新
- style: 代码格式调整
- refactor: 代码重构
- test: 测试相关
- chore: 构建/工具变动

## 示例
feat(用户模块): 添加用户登录功能
```

**优点**：
- 规则跟着项目走，可以版本控制
- 团队成员使用相同的规则
- Cursor 和 VS Code 环境统一

### API 配置（VS Code 用户）

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `aiCommit.apiProvider` | AI 服务提供商 | `cursor` |
| `aiCommit.apiKey` | API 密钥 | 空 |
| `aiCommit.model` | AI 模型名称 | `gpt-3.5-turbo` |
| `aiCommit.maxTokens` | 最大生成 token 数 | `200` |
| `aiCommit.temperature` | 生成温度（0-2） | `0.7` |
| `aiCommit.apiEndpoint` | 自定义 API 端点 | 空 |
| `aiCommit.customPrompt` | 自定义提示词（高级） | 空 |

**配置示例**：

```json
{
  "aiCommit.apiProvider": "openai",
  "aiCommit.apiKey": "sk-你的OpenAI密钥",
  "aiCommit.model": "gpt-4"
}
```

## 使用方法

### 基本流程

1. **修改代码** - 在 Git 工作区中修改代码文件
2. **暂存文件** - 使用 `git add` 暂存要提交的文件
3. **生成提交信息** - 按 `Ctrl+H Ctrl+H`（或 `Cmd+H Cmd+H`）

### 命令列表

| 命令 | 说明 |
|------|------|
| `COTC生成提交信息` | 生成 AI 提交信息 |
| `COTC生成规则文件` | 生成 .cursorrules 文件 |
| `配置 AI 提交` | 打开插件设置 |

### 快捷键

| 快捷键 | 说明 |
|--------|------|
| `Ctrl+H Ctrl+H` / `Cmd+H Cmd+H` | 生成 AI 提交信息 |

![生成 AI 提交信息](https://i.mji.rip/2026/03/22/47500e175a5c32869e265602ca782181.gif)

## 常见问题

### Q: 生成的提交信息是英文怎么办？

A: 检查项目中是否有 `.cursorrules` 文件。如果没有，运行 `COTC生成规则文件` 命令生成一个默认的中文规则文件。

### Q: Cursor 和 VS Code 的区别是什么？

| 环境 | API 密钥 | 规则来源 |
|------|---------|---------|
| Cursor | 不需要 | `.cursorrules` 文件 |
| VS Code | 需要配置 | `.cursorrules` 文件 |

### Q: 如何自定义提交格式？

编辑项目根目录的 `.cursorrules` 文件，按照你的团队规范修改内容即可。

### Q: 支持哪些 AI 服务？

- **Cursor 内置 AI**（在 Cursor 中使用，无需配置）
- **OpenAI**（需要 API 密钥）
- **Anthropic (Claude)**（需要 API 密钥）
- **自定义 API**（需要配置 API 端点和密钥）

### Q: 快捷键冲突怎么办？

可以在键盘快捷键设置中修改：
1. 按 `Ctrl+K Ctrl+S`（Windows/Linux）或 `Cmd+K Cmd+S`（macOS）
2. 搜索 "COTC" 相关命令
3. 修改为你喜欢的快捷键组合

## 工作流程图

```
用户触发命令
    ↓
检测 .cursorrules 文件
    ├─ 存在 → 继续
    └─ 不存在 → 提示生成
    ↓
检测运行环境
    ├─ Cursor → 调用 Cursor 内置 AI（读取 .cursorrules）
    └─ VS Code → 读取 .cursorrules + 调用配置的 API
    ↓
生成提交信息
```

## 许可证

MIT
