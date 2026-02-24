---
name: agentstage
description: Use this skill when an agent needs to operate the `agentstage` CLI to create pages, generate AI prompts for ui.json, run a page runtime, and control page state. Covers command-level workflows only: `init`, `page`, `prompt ui`, `serve`, `run`, `status`, `stop`.
---

# Agentstage Skill

只介绍 CLI 用法，不介绍底层工具包概念。  
目标是让 agent 用最少命令完成页面创建、AI 生成 ui.json、启动与调试。

## 标准流程

1. 初始化工作区：
```bash
agentstage init --yes --skip-cloudflared-check
```

2. 创建页面骨架：
```bash
agentstage page add counter
```

3. 生成 AI Prompt（核心）：
```bash
# 通用 prompt
agentstage prompt ui

# 带页面上下文（推荐）
agentstage prompt ui --page counter
```

4. 将模型生成的 JSON 写回页面：
```bash
agentstage page add counter --ui '{"root":"main","elements":{...}}' --state '{"count":0}'
```

5. 启动与调试：
```bash
agentstage serve counter
agentstage run set-state counter '{"count":1}' --live --wait 5000
agentstage run watch counter
agentstage status
agentstage stop
```

## Prompt 生成规则（必须遵守）

当你使用 `agentstage prompt ui` 后，把输出原样发给 LLM，并要求 LLM：

1. 只输出一个合法 JSON 对象。  
2. 不要输出 markdown code fence。  
3. 不要输出解释文本。  
4. 输出结构必须包含 `root` 和 `elements`。  
5. `children` 引用必须都能在 `elements` 找到。

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
agentstage page add <name>
agentstage page rm <name>
agentstage page ls

agentstage prompt ui
agentstage prompt ui --page <name>

agentstage serve <name> --port 3000
agentstage run get-state <name> --file
agentstage run set-state <name> '{"k":"v"}'
agentstage run set-state <name> '{"k":"v"}' --live --wait 5000
agentstage run inspect <name>
agentstage run exec <name> <action> '{"payload":1}'

agentstage status
agentstage stop
agentstage guide --list
```

## 参考文件

- JSON 组件与结构规则：`references/ui-components.md`
- 状态与运行调试：`references/state-management.md`
- 端到端示例：`references/examples.md`
