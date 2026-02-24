# UI Components & JSON Rules

本文件描述 `agentstage` 在 `@agentstage/render` 下的组件来源和 JSON 约束。

## 组件来源

当前 render registry 默认来自 `@json-render/shadcn`，并在 render 内部注入。  
不要假设可以在 render 外部注册自定义 React 组件。

常见组件（非完整列表）：

- Layout: `Stack`, `Card`, `Grid`, `Separator`
- Typography: `Heading`, `Text`, `Badge`
- Form: `Input`, `Button`, `Select`, `Checkbox`, `Switch`
- Data/Feedback: `Table`, `Tabs`, `Dialog`, `Accordion`, `Alert`, `Progress`, `Skeleton`, `Spinner`

## JSON 结构最小要求

```json
{
  "root": "main",
  "elements": {
    "main": {
      "type": "Stack",
      "props": { "direction": "vertical", "gap": "md" },
      "children": ["title"]
    },
    "title": {
      "type": "Heading",
      "props": { "text": "Hello Agentstage", "level": "h1" }
    }
  }
}
```

必须检查：

1. `root` 存在于 `elements`。  
2. 每个 `children` id 都能在 `elements` 找到。  
3. `type` 是已注册组件名。  
4. `props` 保持 JSON 可序列化（函数与 class 实例都不要写入）。

## 状态绑定写法

- 读取：`{ "$state": "/path" }`
- 双向绑定：`{ "$bindState": "/path" }`
- 列表 item：`{ "$item": "field" }`
- 列表 index：`{ "$index": true }`

## 动作写法

示例：

```json
{
  "type": "Button",
  "props": { "label": "Submit" },
  "on": {
    "press": {
      "action": "submitForm",
      "params": { "value": { "$state": "/form/value" } }
    }
  }
}
```

当使用自定义动作名（如 `submitForm`）时，必须在 `createRenderRuntime({ actions, actionHandlers })` 中同时提供：

1. `actions.submitForm` 定义（描述 + 参数 schema）  
2. `actionHandlers.submitForm` 处理函数
