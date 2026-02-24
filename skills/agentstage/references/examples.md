# Examples

## 示例 1：最短可用流程（推荐）

```bash
agentstage init -y --skip-cloudflared-check
agentstage page add counter
agentstage prompt ui --page counter
```

把 `prompt ui` 输出发给 LLM，让 LLM 只返回合法 JSON。  
然后把 JSON 回填：

```bash
agentstage page add counter --ui '{"root":"main","elements":{...}}' --state '{"count":0}'
agentstage serve counter
```

## 示例 2：脚本化生成 prompt

```bash
agentstage prompt ui --page weather > /tmp/weather.prompt.txt
```

可用于自动化流水线（例如外部脚本读取 prompt 后调用 LLM）。

## 示例 3：大 JSON 通过 stdin 回填

```bash
cat /tmp/generated-ui.json | agentstage page add weather --ui-stdin --state '{"city":"shanghai"}'
```

## 示例 4：运行时状态调试

```bash
agentstage run get-state counter --file
agentstage run set-state counter '{"count":1}'
agentstage run set-state counter '{"count":2}' --live --wait 5000
agentstage run watch counter
```

## 示例 5：排查与停止

```bash
agentstage status
agentstage stop
```
