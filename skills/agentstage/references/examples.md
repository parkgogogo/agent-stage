# Examples

## 示例 1：CLI 一次起页（推荐）

```bash
agentstage init -y --skip-cloudflared-check
agentstage page add counter --state '{"count":0}'
agentstage serve counter --port 3000
```

另开终端：

```bash
agentstage run set-state counter '{"count":1}' --live --wait 5000
agentstage run get-state counter
```

## 示例 2：通过 --ui 直接创建页面

```bash
agentstage page add hello --ui '{
  "root":"main",
  "elements":{
    "main":{"type":"Card","children":["title","desc"]},
    "title":{"type":"Heading","props":{"text":"Hello","level":"h1"}},
    "desc":{"type":"Text","children":["Welcome to agentstage"]}
  }
}' --state '{"ready":true}'
```

## 示例 3：让 AI 生成 JSON

```bash
agentstage page add weather
```

不传 `--ui` 时，CLI 会输出 `AI Prompts`。  
把该提示词发给模型，要求模型只输出合法 JSON spec，然后再用 `--ui` 回填。

## 示例 4：React 里最小接入 render

```tsx
import { RenderPage } from "@agentstage/render";

export function App() {
  return <RenderPage pageId="counter" />;
}
```

## 示例 5：给 LLM 提供 schema 与系统提示

```ts
import { createRenderAgentKit } from "@agentstage/render";

const kit = createRenderAgentKit();
const systemPrompt = kit.systemPrompt();
const schema = kit.jsonSchema();
```

把 `systemPrompt + schema` 作为约束，要求模型输出满足 schema 的 UI JSON。

## 示例 6：程序化启动渲染服务（Bun）

```ts
import { startRenderServe } from "@agentstage/render/serve";

const handle = await startRenderServe({
  workspaceDir: process.cwd(),
  pageId: "counter",
  port: 3000,
});

// ... later
await handle.close();
```

## 示例 7：服务端用 SDK 改状态

```ts
import { BridgeClient } from "@agentstage/bridge/sdk";

const client = new BridgeClient("ws://localhost:3000/_bridge");
await client.connect();
await client.setStateByKey("counter", "main", { count: 10 }, { waitForAck: true });
client.disconnect();
```
