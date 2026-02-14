# bridge-store

A tiny WebSocket bridge that exposes a browser-side zustand store to Node/Agent.

## What it is
- **Bridge Server (Node)**: routes JSON-RPC messages between Agents/clients and browser pages.
- **Bridge Client (Browser)**: attaches a zustand store, registers `{storeId, meta, initialState}`, pushes updates, and accepts remote `setState/dispatch`.

## Dev
```bash
pnpm -C packages/bridge-store dev
```

This runs:
- bridge server (`dev:server`)
- TypeScript typecheck in watch mode (`dev:typecheck`)

## Node client (DB-like SDK)
```ts
import { BridgeClient } from 'bridge-store/node'

const bridge = await BridgeClient.connect('ws://127.0.0.1:8787')
const { storeId } = await bridge.page.resolve('demo:counter', 'main')
const { state } = await bridge.store.getState(storeId)
```

## Protocol (MVP)
- Browser -> Server notifications:
  - `host.register` (includes `pageId` + optional `storeKey`)
  - `host.stateChanged`
- Agent/Client -> Server requests:
  - `store.getMeta`, `store.getState`, `store.setState`, `store.dispatch`, `store.subscribe`
  - `page.listStores`, `page.getStoresMeta`, `page.resolve`
- Server -> Browser requests:
  - `client.setState`, `client.dispatch`
- Server -> subscribers notifications:
  - `store.stateChanged`
