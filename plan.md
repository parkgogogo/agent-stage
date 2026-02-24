# Runtime 重构方案（Bun 适配层 + `serve` 命令）

## 目标

移除 `packages/cli/template`，由 `render` 直接起运行时并渲染页面；  
CLI 改为薄层编排，不再暴露含糊的 `dev` 语义，统一使用 `serve`。

## 已确认决策

- 命令改为：`agentstage serve <pageId>`（单页进程模型）
- Bun 必须，不做 Node fallback
- 页面目录改为：`pages/<pageId>/ui.json|store.json`
- bridge 需要 Bun 适配层
- 允许 breaking（MVP 阶段）

## 架构

### 1) Bridge Bun 适配层

- 新增 `@agentstage/bridge/bun`
- 提供 `startBridgeBunServer(options)`
  - 内部创建 gateway
  - 挂载 websocket `/ _bridge`
  - 提供 `close()`

### 2) Render Runtime Server

- 新增 `@agentstage/render/serve`
- 提供 `startRenderServe({ workspaceDir, pageId, pagesDir, port, host })`
- Bun 负责构建浏览器端 bundle（无 Vite）
- 运行时服务：
  - `/` 与 `/${pageId}`：渲染单页壳
  - `/__agentstage/app.js`：客户端 bundle
  - `/pages/**`：页面数据文件
  - `/_bridge`：bridge websocket

### 3) CLI 命令收敛

- 顶层命令：
  - `init`
  - `serve <pageId>`
  - `stop`
  - `status`
  - `page ...`
  - `run ...`
- `page add` 仅写 JSON 文件，不再生成 TSX/路由
- `init` 改为最小工作区初始化（`pages/` + `package.json` + Bun install）

## 实施顺序

1. 落地 bridge bun 适配层  
2. 落地 render serve 运行时  
3. CLI 接线 `serve` + `init` + `page add`  
4. 删除 template 并清理文案  

## 验收标准

- `agentstage init` 后不再生成 template 工程
- `agentstage page add counter` 仅生成：
  - `pages/counter/ui.json`
  - `pages/counter/store.json`
- `agentstage serve counter` 可启动运行时并渲染页面
- `agentstage run ...` 与新路径兼容

## 风险

- Bun 未安装：命令直接失败并提示安装
- 单页进程心智变化：CLI 与错误信息明确说明
- 删除 template 可能影响旧文档：后续统一更新

## E2E 执行

- 无 Bun 环境：运行缺失分支校验
  - `pnpm -C packages/cli test:e2e`
- 有 Bun 环境：同一脚本会自动跑完整链路
  - `init -> page add -> serve -> status -> run set-state -> stop`
