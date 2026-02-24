# State Management

本文件说明 `agentstage` 的状态文件、live/file 双模式和桥接行为。

## store.json 结构

每个页面状态位于 `pages/<pageId>/store.json`：

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

`version` 由 `FileStore` 维护并递增，用于并发写入冲突检测。

## CLI 两种状态操作模式

### 文件模式（默认）

- 命令：`agentstage run set-state <pageId> '<json>'`
- 特点：不要求 runtime 运行，也不要求浏览器已打开
- 结果：写入 `store.json`，页面下次加载时生效

### 实时模式（live）

- 命令：`agentstage run set-state <pageId> '<json>' --live --wait 5000`
- 特点：通过 websocket 推送给已连接页面
- 要求：`agentstage serve <pageId>` 已运行，且页面在浏览器中已连接 bridge

## 常用命令

```bash
# 读状态（优先文件）
agentstage run get-state counter --file

# 读状态（优先 live，失败可退回 --file）
agentstage run get-state counter

# 监听状态变化
agentstage run watch counter

# 查看 schema / actions / 当前状态
agentstage run inspect counter

# 执行动作
agentstage run exec counter someAction '{"x":1}'
```

## 一致性行为

1. 浏览器上报 `store.stateChanged` 后，gateway 写入文件并广播给订阅客户端。  
2. 当发生版本冲突时，gateway 会以文件中的最新状态回推浏览器。  
3. `setState --wait` 依赖 ACK，超时会报错并暴露连接/处理问题。  
4. 页面断开连接时，live 命令会提示 page not connected。

## 实践建议

1. 批量初始化数据时先用文件模式。  
2. 演示或联调时用 live + wait，确保操作成功落地。  
3. 需要可回放时，把关键状态更新也落盘（CLI 默认就是落盘）。  
4. 遇到 live 失败先执行：`agentstage status`，再检查页面是否已打开。
