---
name: agentstage
description: Use this skill when working with the agent-stage stack: creating/running page runtimes with the `agentstage` CLI, generating JSON UI specs for `@agentstage/render`, controlling page state via `@agentstage/bridge`, or preparing AI prompt/schema for JSON generation. Cover the high-integration workflow (`init -> page add -> serve -> run`), Bun runtime requirements, built-in shadcn registry behavior, and practical integration boundaries.
---

# Agentstage Skill

把 agent-stage 作为“高集成 JSON UI 运行时”来使用：  
先产出 `pages/<pageId>/ui.json` 与 `store.json`，再用 `serve` 拉起页面和 bridge，最后用 `run` 命令驱动状态或动作。

## 先判断工作模式

优先判断当前任务属于哪一类：

1. CLI 运行页：使用 `agentstage init/page add/serve/run`，目标是尽快起页并可远程操控。  
2. 包集成：在 React/Bun 项目中使用 `@agentstage/render` 和 `@agentstage/bridge` API。  
3. AI 生成 JSON：用 `createRenderAgentKit()` 输出 system prompt + schema，引导模型只产出合法 spec。

## CLI 标准流程（首选）

1. 初始化工作区（Bun 必须）：
```bash
agentstage init --yes --skip-cloudflared-check
```

2. 创建页面：
```bash
# 默认骨架 + AI Prompt Generation 输出
agentstage page add counter

# 直接写入 UI 与初始状态
agentstage page add counter --ui '{"root":"main","elements":{...}}' --state '{"count":0}'
```

3. 启动页面运行时（单页进程）：
```bash
agentstage serve counter --port 3000
```

4. 状态与动作控制：
```bash
# 文件模式（不依赖浏览器连接）
agentstage run set-state counter '{"count":1}'
agentstage run get-state counter --file

# 实时模式（要求页面已连接 bridge）
agentstage run set-state counter '{"count":2}' --live --wait 5000
agentstage run watch counter
agentstage run inspect counter
agentstage run exec counter someAction '{"x":1}'
```

5. 查看与停止：
```bash
agentstage status
agentstage stop
```

## 关键目录与约束

默认工作区在 `~/.agentstage/webapp`，核心目录：

```text
pages/
  <pageId>/
    ui.json
    store.json
.agentstage/
  runtime.json
package.json
```

执行约束：

1. 要求安装 Bun；`init` 和 `serve` 都依赖 Bun。  
2. `serve <pageId>` 是单页进程模型；切换页面通常重新起一个进程。  
3. 页面 id 只用小写字母、数字、连字符（`^[a-z0-9-]+$`）。

## JSON Spec 生成规则

始终输出 json-render 规范结构：

```json
{
  "root": "main",
  "elements": {
    "main": {
      "type": "Card",
      "props": {},
      "children": ["title"]
    },
    "title": {
      "type": "Heading",
      "props": { "text": "Hello" }
    }
  }
}
```

遵守以下约束：

1. `root` 必须指向 `elements` 中存在的节点。  
2. `children` 引用的元素 id 必须存在。  
3. `type` 使用已注册组件（当前默认来自 `@json-render/shadcn`）。  
4. 状态读取/绑定使用 `$state`、`$bindState`。  
5. 动作调用放在 `on.press.action`（或对应事件）中。

## Render/Bridge 程序化集成

在 React 中最小化接入：

```tsx
import { RenderPage } from "@agentstage/render";

export function App() {
  return <RenderPage pageId="counter" />;
}
```

自定义动作（不自定义组件）：

```tsx
import { createRenderRuntime } from "@agentstage/render";
import { z } from "zod";

const runtime = createRenderRuntime({
  actions: {
    submitForm: {
      description: "Submit form data",
      params: z.object({ value: z.string() }),
    },
  },
  actionHandlers: {
    submitForm: async (params) => {
      console.log("submitForm", params);
    },
  },
});
```

为 LLM 生成提示与 schema：

```ts
import { createRenderAgentKit } from "@agentstage/render";

const kit = createRenderAgentKit();
const systemPrompt = kit.systemPrompt();
const schema = kit.jsonSchema();
```

自建 Bun 服务时：

1. 用 `startRenderServe()` 直接起渲染运行时。  
2. 或用 `startBridgeBunServer()` 单独挂 bridge 网关。  
3. 用 `BridgeClient`（`@agentstage/bridge/sdk`）从 CLI/服务端执行 `setState/dispatch/subscribe`。

## 明确边界（避免误用）

1. `@agentstage/render` 当前默认内置 shadcn registry；不在 render 外部注册自定义组件。  
2. 扩展点主要是 actions（声明 + handler），不是组件注入。  
3. `run --live` 依赖浏览器已连接；否则使用文件模式。  
4. 部分 CLI 子命令仍有旧结构兼容代码；生产流程优先使用 `init/page add/serve/run/status/stop`。

## 读取扩展参考

- 需要组件与 JSON 细节时，读取 [references/ui-components.md](references/ui-components.md)。  
- 需要状态一致性与 live/file 模式细节时，读取 [references/state-management.md](references/state-management.md)。  
- 需要端到端示例（CLI 与代码接入）时，读取 [references/examples.md](references/examples.md)。
