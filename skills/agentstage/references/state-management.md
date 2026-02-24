# State Management

本文件说明 CLI 下的状态文件与调试命令。

## store.json 结构

每个页面状态在 `pages/<pageId>/store.json`：

```json
{
  "state": {
    "count": 1
  },
  "version": 3,
  "updatedAt": "2026-02-24T10:00:00.000Z",
  "pageId": "counter"
}
```

## 常用命令

```bash
# 文件模式读取
agentstage run get-state counter --file

# 文件模式写入（不依赖页面在线）
agentstage run set-state counter '{"count":1}'

# 在线模式写入（实时生效）
agentstage run set-state counter '{"count":2}' --live --wait 5000

# 监听变化
agentstage run watch counter

# 查看页面状态/动作信息
agentstage run inspect counter

# 调用动作
agentstage run exec counter someAction '{"x":1}'
```

## 文件模式 vs 在线模式

1. 文件模式：直接写 `store.json`，页面下次加载可见。  
2. 在线模式：要求 `agentstage serve <pageId>` 已运行且页面已打开；可立即生效。

## 故障排查

1. `Runtime is not running`：先执行 `agentstage serve <pageId>`。  
2. `Page is not connected`：去浏览器打开页面后再执行 `--live`。  
3. 如果只想落盘，不依赖页面在线，去掉 `--live`。
