---
name: agentstage
description: "Use this skill when an agent needs to operate the `agent-stage` CLI to create pages, generate AI prompts for ui.json, run a page runtime, and control page state. Covers command-level workflows only: `init`, `page`, `prompt ui`, `serve`, `run`, `status`, `stop`."
---

# Agentstage Skill

只介绍 CLI 用法，不介绍底层工具包概念。  
目标是让 agent 用最少命令完成页面创建、AI 生成 ui.json、启动与调试。

## 标准流程

1. 初始化工作区：
```bash
agent-stage init --yes --skip-cloudflared-check
```

2. 创建页面骨架：
```bash
agent-stage page add counter
```

3. 生成 AI Prompt（核心）：
```bash
# 通用 prompt
agent-stage prompt ui

# 带页面上下文（推荐）
agent-stage prompt ui --page counter
```

4. 将模型结果写回页面：
```bash
agent-stage page add counter --ui '{"root":"main","elements":{...}}' --state '{"count":0}'
```

5. 启动与调试：
```bash
agent-stage serve counter
agent-stage run set-state counter '{"count":1}' --live --wait 5000
agent-stage run watch counter
agent-stage status
agent-stage stop
```

## Prompt 生成规则（核心）

`agent-stage prompt ui` 输出两段内容：

1. `SYSTEM PROMPT`：来自 `createRenderAgentKit().systemPrompt()`（render 核心提示词）。  
2. `USER PROMPT`：由 `createRenderAgentKit().buildUserPrompt(...)` 生成，`--page` 时会注入当前 `ui.json/store.json` 上下文。

使用方式：

1. 把 `SYSTEM PROMPT` 放到 LLM 的 system 消息。  
2. 把 `USER PROMPT` 放到 LLM 的 user 消息。  
3. 按你的目标决定让模型输出 patch 或最终 `ui.json`，然后再通过 CLI 写回页面文件。

## 页面与路径约束

默认工作区：`~/.agentstage/webapp`  
核心文件：

```text
pages/<pageId>/ui.json
pages/<pageId>/store.json
```

约束：

1. `pageId` 仅允许小写字母、数字、连字符：`^[a-z0-9-]+$`。  
2. `init` 和 `serve` 依赖 Bun。  
3. `run --live` 需要页面已运行并在浏览器连接。

## 常见命令速查

```bash
agent-stage page add <name>
agent-stage page rm <name>
agent-stage page ls

agent-stage prompt ui
agent-stage prompt ui --page <name>

agent-stage serve <name> --port 3000
agent-stage run get-state <name> --file
agent-stage run set-state <name> '{"k":"v"}'
agent-stage run set-state <name> '{"k":"v"}' --live --wait 5000
agent-stage run inspect <name>
agent-stage run exec <name> <action> '{"payload":1}'

agent-stage status
agent-stage stop
agent-stage guide --list
```

## 参考文件

- JSON 组件与结构规则：`references/ui-components.md`
- 状态与运行调试：`references/state-management.md`
- 端到端示例：`references/examples.md`
