# UI Components & JSON Rules

本文件用于指导通过 CLI 生成和校验 `pages/<pageId>/ui.json`。

## 必须输出的 JSON 结构

```json
{
  "root": "main",
  "elements": {
    "main": {
      "type": "Stack",
      "props": {},
      "children": ["title"]
    },
    "title": {
      "type": "Heading",
      "props": { "text": "Hello", "level": "h1" }
    }
  }
}
```

## 结构约束

1. `root` 必须是 `elements` 里的 key。  
2. `children` 里引用的 id 必须存在。  
3. `props` 必须是 JSON 可序列化内容。  
4. 推荐先用 `agentstage prompt ui --page <id>` 生成带上下文 prompt 再让 LLM 产出 JSON。

## 常见组件（示例）

- Layout: `Stack`, `Card`, `Grid`, `Separator`
- Typography: `Heading`, `Text`, `Badge`
- Inputs: `Input`, `Button`, `Select`, `Checkbox`, `Switch`
- Data/Feedback: `Table`, `Tabs`, `Dialog`, `Accordion`, `Alert`, `Progress`, `Skeleton`, `Spinner`

## 状态绑定语法

- 读取：`{ "$state": "/path" }`
- 双向绑定：`{ "$bindState": "/path" }`
- 列表项：`{ "$item": "fieldName" }`
- 列表索引：`{ "$index": true }`

## 动作语法

```json
{
  "type": "Button",
  "props": { "label": "Save" },
  "on": {
    "press": {
      "action": "setState",
      "params": { "statePath": "/saved", "value": true }
    }
  }
}
```
