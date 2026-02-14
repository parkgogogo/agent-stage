import React from 'react'
import { useStore } from 'zustand'
import { z } from 'zod'

import { createStoreBridgeBrowser } from 'bridge-store/browser'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/ui'

type State = {
  updatedAt: number
  items: Array<{ id: string; text: string }>
  dispatch: (action: { type: string; payload?: any }) => void
}

const stateSchema = z.object({
  updatedAt: z.number().describe('unix ms timestamp'),
  items: z.array(z.object({ id: z.string(), text: z.string() })),
})

const { store } = await createStoreBridgeBrowser<State>({
  bridgeUrl: (window as any).__STOREBRIDGE_WS__ ?? 'ws://127.0.0.1:8787',
  pageId: "test-page-1771075772243",
  storeKey: 'main',
  meta: {
    id: "test-page-1771075772243",
    title: "test-page-1771075772243",
    store: {
      stateSchema,
      actions: [
        {
          type: 'test-page-1771075772243.setData',
          description: 'Agent writes new data to render',
          payloadSchema: z.object({
            updatedAt: z.number(),
            items: z.array(z.object({ id: z.string(), text: z.string() })),
          }),
        },
      ],
    },
  },
  createState: (set, get) => ({
    updatedAt: Date.now(),
    items: [],
    dispatch: (action) => {
      if (action.type === 'test-page-1771075772243.setData') {
        const p = action.payload ?? {}
        set({ updatedAt: Number(p.updatedAt ?? Date.now()), items: p.items ?? [] })
      }
    },
  }),
})

export default function Page() {
  const updatedAt = useStore(store as any, (s: any) => s.updatedAt)
  const items = useStore(store as any, (s: any) => s.items)

  return (
    <div className="p-6">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>test-page-1771075772243</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-xs text-muted-foreground">updatedAt: {new Date(updatedAt).toLocaleString()}</div>

          <div className="space-y-2">
            {items.length === 0 ? (
              <div className="text-sm text-muted-foreground">No data yet. Use StoreBridge SDK to dispatch 'test-page-1771075772243.setData'.</div>
            ) : (
              <ul className="list-disc pl-5 space-y-1">
                {items.map((it: any) => (
                  <li key={it.id} className="text-sm">{it.text}</li>
                ))}
              </ul>
            )}
          </div>

          <Button variant="secondary" onClick={() => store.getState().dispatch({ type: 'test-page-1771075772243.setData', payload: { updatedAt: Date.now(), items: [{ id: crypto.randomUUID?.() ?? String(Math.random()), text: 'hello from browser' }] } })}>
            Write sample data (local)
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
