---
name: agentstage-cli
description: Guide for using Agentstage CLI to create interactive UI pages controlled by AI agents. Use when you need to (1) Initialize an Agentstage project, (2) Create or manage UI pages with Bridge stores, (3) Start/stop the Runtime service, (4) Execute actions or set state on pages, (5) Add shadcn/ui components to the project. Essential for building agent-controlled user interfaces with React, Tailwind, and real-time state synchronization.
---

# Agentstage CLI

## Overview

Agentstage is a framework for creating interactive UI pages that can be controlled by AI agents through a CLI. It combines:

- **TanStack Start** - Full-stack React framework with file-based routing
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Pre-built accessible components
- **Bridge** - Real-time state synchronization between agents and browser pages

Use this skill when building agent-controlled dashboards, forms, or interactive UIs.

## Core Concepts

### Workspace Directory

Agentstage CLI operates on a single workspace directory (stored in `~/.config/agentstage/workspace`).

The workspace contains:
```
~/.agentstage/my-app/          # Default location
├── app/routes/pages/          # Your UI pages
├── components/ui/             # shadcn/ui components
├── app/routes/api/bridge.ts   # Bridge Gateway API
└── .agentstage/pid            # Runtime process ID
```

### Pages and Stores

Each page in `app/routes/pages/<name>/page.tsx` exposes a **Bridge Store** with:
- **State** - Current data (e.g., `{ count: 5 }`)
- **Actions** - Operations that modify state (e.g., `increment`, `reset`)
- **Schema** - Zod schema describing state structure

Agents control pages by:
1. Connecting to Bridge Gateway (`ws://localhost:8787/_bridge`)
2. Dispatching actions or setting state directly
3. Subscribing to real-time state changes

## Quick Start

### Initialize Project

```bash
agentstage init my-app
```

Choose workspace location:
- **Default**: `~/.agentstage/my-app/` (recommended)
- **Current**: `./.agentstage/` in current directory
- **Custom**: Specify any path

This creates a complete project with TanStack Start + Tailwind + shadcn/ui + Bridge.

### Start Runtime

```bash
agentstage start
```

Starts the background service:
- Web server: http://localhost:3000
- Bridge Gateway: ws://localhost:8787/_bridge

### Check Status

```bash
agentstage status
```

Shows:
```
Agentstage Runtime
────────────────────
Workspace: ~/.agentstage/my-app
Status:    ● Running
PID:       12345
Web:       http://localhost:3000
Bridge:    ws://localhost:8787/_bridge
```

## Managing Pages

### List Pages

```bash
agentstage ls
```

Output:
```
Pages:
  ● counter              (online, v5)
      └─ main            v5 {count: 5}
  ○ user-profile         (offline)
```

### Add New Page

```bash
agentstage add-page todo-list
```

Creates `app/routes/pages/todo-list/page.tsx` with Bridge Store template.

### Remove Page

```bash
agentstage rm-page todo-list
```

## Controlling Pages

### Inspect Page Capabilities

```bash
agentstage inspect counter
```

Shows schema, actions, and current state:
```
counter/main
────────────────────────────────
Schema:
  count: number

Actions:
  increment(by: number)  - Increment counter by N
  reset()                - Reset counter to 0

Current State:
  { count: 5 }
```

### Execute Action

```bash
agentstage exec counter increment '{"by": 10}'
```

Dispatches the `increment` action with payload `{ by: 10 }`.

### Set State Directly

```bash
agentstage exec counter --state '{"count": 100}'
```

Bypasses actions, sets state directly.

### Watch Real-time Changes

```bash
agentstage watch counter
```

Streams all state changes:
```
[2025-02-15T10:30:00Z] { type: 'stateChanged', state: { count: 6 } }
[2025-02-15T10:30:05Z] { type: 'stateChanged', state: { count: 11 } }
```

Press Ctrl+C to exit.

## shadcn/ui Components

### List Components

```bash
agentstage components list
```

Shows installed vs available:
```
Installed (6):
  button  card  input  dialog  tabs  table

Available (40):
  accordion  alert  avatar  badge  ...
```

### Install Component

```bash
agentstage add button
agentstage add card input dialog
```

Uses `npx shadcn add` internally.

### Search Components

```bash
agentstage components search drop
```

Finds dropdown-menu, dropzone, etc.

## Page Implementation Pattern

When implementing a page, follow this pattern:

```typescript
// app/routes/pages/my-page/page.tsx
import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useStore } from 'zustand';
import { z } from 'zod';
import { createBridgeStore } from '@agentstage/bridge/browser';
import { Button } from '@/components/ui/button';

interface State {
  items: string[];
  dispatch: (action: { type: string; payload?: unknown }) => void;
}

const bridge = createBridgeStore<State, {
  addItem: { payload: { text: string } };
  removeItem: { payload: { id: string } };
}>({
  pageId: 'my-page',
  storeKey: 'main',
  description: {
    schema: z.object({
      items: z.array(z.string()),
    }),
    actions: {
      addItem: {
        description: 'Add a new item',
        payload: z.object({ text: z.string() }),
      },
      removeItem: {
        description: 'Remove item by ID',
        payload: z.object({ id: z.string() }),
      },
    },
  },
  createState: (set, get) => ({
    items: [],
    dispatch: (action) => {
      if (action.type === 'addItem') {
        set({ items: [...get().items, action.payload.text] });
      }
      // ... handle other actions
    },
  }),
});

export default function MyPage() {
  const items = useStore(bridge.store, (s) => s.items);
  
  React.useEffect(() => {
    let disconnect = () => {};
    bridge.connect().then((conn) => { disconnect = conn.disconnect; });
    return () => disconnect();
  }, []);
  
  return (
    <div>
      {items.map((item) => (
        <div key={item}>{item}</div>
      ))}
    </div>
  );
}
```

## Best Practices

### Page Design

1. **Expose clear actions** - Agents should understand what operations are available
2. **Include descriptions** - Every action should have a `description` field
3. **Use Zod schemas** - Type-safe state and action payloads
4. **Handle errors** - Pages should gracefully handle invalid actions

### State Management

1. **Keep state minimal** - Only expose what agents need to control
2. **Derive UI state** - Use selectors to derive computed values
3. **Batch updates** - Multiple rapid changes should be batched

### Security

1. **Validate payloads** - Zod schemas protect against malformed data
2. **Sanitize inputs** - Never render user input without sanitization
3. **Rate limiting** - Consider implementing action rate limits for public pages

## Troubleshooting

### Runtime won't start

```bash
agentstage status        # Check if already running
agentstage stop          # Force stop if stale PID
agentstage start         # Try again
```

### Page not found

```bash
agentstage ls            # Verify page exists
# Check file location: app/routes/pages/<name>/page.tsx
```

### Bridge connection failed

```bash
agentstage status        # Verify Bridge port (8787)
# Check if firewall blocks WebSocket connections
```

### Component not found

```bash
agentstage components list    # Check if installed
agentstage add <component>    # Install if missing
```

## Resources

### references/
- `page-templates.md` - Common page implementation patterns
- `bridge-protocol.md` - WebSocket message format details

### assets/
- `starter-page/` - Boilerplate page template with Bridge Store
