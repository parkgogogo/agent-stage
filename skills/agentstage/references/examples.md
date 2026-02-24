# Examples

## 示例 1：最短可用流程（推荐）

```bash
agent-stage init -y --skip-cloudflared-check
agent-stage page add counter
agent-stage prompt ui --page counter
```

把 `prompt ui` 输出中的：

1. `SYSTEM PROMPT` 放到模型 system 消息  
2. `USER PROMPT` 放到模型 user 消息

再把模型生成结果整理为 `ui.json` 后回填：

```bash
agent-stage page add counter --ui '{"root":"main","elements":{...}}' --state '{"count":0}'
agent-stage serve counter
```

## 示例 2：脚本化生成 prompt

```bash
agent-stage prompt ui --page weather > /tmp/weather.prompt.txt
```

可用于自动化流水线（外部脚本拆分 SYSTEM/USER 两段后调用 LLM）。

## 示例 3：大 JSON 通过 stdin 回填

```bash
cat /tmp/generated-ui.json | agent-stage page add weather --ui-stdin --state '{"city":"shanghai"}'
```

## 示例 4：运行时状态调试

```bash
agent-stage run get-state counter --file
agent-stage run set-state counter '{"count":1}'
agent-stage run set-state counter '{"count":2}' --live --wait 5000
agent-stage run watch counter
```

## 示例 5：排查与停止

```bash
agent-stage status
agent-stage stop
```
