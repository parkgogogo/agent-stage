# Agentstage CLI Review Report

## 1. 当前 CLI 结构总览

```
agentstage
├── dev
│   ├── init     - 初始化项目
│   ├── start    - 启动开发服务器
│   ├── stop     - 停止服务器
│   └── status   - 查看状态
├── page
│   ├── add      - 创建页面 (--ui, --state)
│   ├── rm       - 删除页面
│   ├── ls       - 列出页面
│   └── manifest - 生成 manifest
└── run
    ├── set-state - 设置状态 (--live)
    ├── get-state - 获取状态 (--file)
    ├── watch     - 监听状态变化
    └── exec      - 执行 action
```

## 2. 功能完整性评估

### ✅ 已支持的功能

| 功能 | 命令 | 状态 |
|------|------|------|
| 创建空页面 | `page add <name>` | ✅ |
| 创建完整页面 | `page add <name> --ui '{}' --state '{}'` | ✅ |
| 删除页面 | `page rm <name>` | ✅ |
| 列出页面 | `page ls` | ✅ |
| 设置状态 | `run set-state <page> '{}'` | ✅ |
| 读取状态 | `run get-state <page>` | ✅ |
| 实时监听 | `run watch <page>` | ✅ |
| 执行 action | `run exec <page> <action>` | ✅ |

### ❌ 发现的问题

#### 问题 1: page add 不支持 stdin（高优先级）

**现状**:
```bash
# 目前只支持命令行参数
agentstage page add todo --ui '{"root":"main",...}' --state '{...}'

# 不支持管道
echo '{"root":"main",...}' | agentstage page add todo  # ❌ 失败
```

**影响**: AI 生成的大型 JSON 无法通过管道直接写入

**修复建议**:
```typescript
// 当 --ui 省略时，从 stdin 读取
.action(async (name, options) => {
  let uiContent: Record<string, unknown>;
  
  if (options.ui) {
    uiContent = JSON.parse(options.ui);
  } else if (!process.stdin.isTTY) {
    // 从 stdin 读取
    const input = await readStdin();
    uiContent = JSON.parse(input);
  } else {
    uiContent = generateDefaultUi(name);
  }
})
```

#### 问题 2: 缺少 page update 命令（中优先级）

**现状**: 只能创建和删除，不能修改已存在的页面 UI

**影响**: 如果要修改页面，需要手动编辑文件（违背 CLI 封装原则）

**修复建议**:
```bash
# 添加 page update 命令
agentstage page update <name> --ui '{...}' --state '{...}'
```

#### 问题 3: run exec 与 json-render 内置 actions 的兼容性问题（高优先级）

**现状**: `run exec` 调用的是 bridge 的 action handler，但 json-render 的内置 actions（setState, pushState, removeState）是在客户端解析的

**影响**: 无法通过 CLI 触发 json-render 的内置 actions

**修复建议**:
```bash
# 添加专门的 state 操作命令
agentstage run state-set <page> <path> <value>   # 替代 setState
agentstage run state-push <page> <path> <value>  # 替代 pushState
agentstage run state-rm <page> <path> <index>    # 替代 removeState
```

#### 问题 4: 缺少批量操作命令（低优先级）

**现状**: 只能单个页面操作

**修复建议**:
```bash
# 批量删除
agentstage page rm page1 page2 page3

# 批量设置状态
agentstage run set-state-all '{"common": "data"}'
```

#### 问题 5: init 配置的依赖版本问题（中优先级）

**现状**: init.ts 配置了 `@agentstage/render`，但 template/package.json 可能没有正确声明

**修复建议**: 验证 template 的 package.json 包含:
```json
{
  "dependencies": {
    "@agentstage/render": "workspace:*"
  }
}
```

## 3. 第一性原理分析

### ✅ 符合第一性原理的设计

1. **单一职责**: page 管理 CRUD，run 管理运行时操作
2. **文件隔离**: AI 不直接操作文件，全部走 CLI
3. **组合优于继承**: page add 支持 --ui 和 --state 组合

### ❌ 违反第一性原理的地方

1. **命令分裂**: page add 和 page update 应该是同一概念的不同表现
2. **stdin 支持缺失**: 没有 stdin 支持的 CLI 不完整
3. **state 操作不统一**: set-state 是文件写入，但内置 actions 是客户端执行

## 4. 改进建议（按优先级）

### P0 - 阻塞使用

1. **添加 stdin 支持到 page add**
   - 允许 `echo '{}' | agentstage page add <name>`
   - 这是 AI 集成的基础

2. **验证 template 依赖**
   - 确保 PageRenderer 组件存在
   - 确保 @agentstage/render 可解析

### P1 - 严重影响体验

3. **添加 page update 命令**
   - 与 add 共享逻辑，只是不创建路由文件
   - 支持 --ui 和 --state

4. **修复 run exec 与内置 actions 的兼容**
   - 或者添加专门的 state-* 命令
   - 或者让 exec 能触发 json-render 的内置 actions

### P2 - 锦上添花

5. **添加 page export/import**
   - 导出页面为 zip/json
   - 从文件导入页面

6. **添加 run snapshot**
   - 保存当前所有页面状态快照
   - 支持回滚

## 5. 代码质量问题

### 发现的代码问题

1. **page add 中的 FileStore 和 writeFile 混用**
   - state 有 --state 时用 FileStore
   - 否则用 writeFile
   - 应该统一使用 FileStore

2. **缺少输入验证**
   - ui.json 只检查 root 和 elements
   - 没有验证 component types 是否合法
   - 没有验证 action names

3. **错误处理不一致**
   - 有些用 consola.error + exit
   - 有些直接 throw

## 6. 总结

**当前状态**: 可用但不够完善

**核心缺失**:
1. stdin 支持（AI 集成必需）
2. page update（完整 CRUD）
3. 内置 actions 的 CLI 触发

**建议优先级**:
1. 立即修复 stdin 支持
2. 添加 page update
3. 统一 state 操作方式

**Agent 使用体验**: 6/10
- 可以创建页面 ✅
- 可以设置状态 ✅
- 无法管道输入大型 JSON ❌
- 无法更新已存在页面 ❌
- 无法触发内置 actions ❌
