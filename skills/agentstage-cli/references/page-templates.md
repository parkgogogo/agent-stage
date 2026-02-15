# Page Templates

## Basic Bridge Store Page

```typescript
import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useStore } from 'zustand';
import { z } from 'zod';
import { createBridgeStore } from '@agentstage/bridge/browser';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export const Route = createFileRoute('/p/my-page')({
  component: MyPage,
});

interface State {
  value: number;
  dispatch: (action: { type: string; payload?: unknown }) => void;
}

const stateSchema = z.object({
  value: z.number(),
});

const bridge = createBridgeStore<State, {
  update: { payload: { value: number } };
}>({
  pageId: 'my-page',
  storeKey: 'main',
  description: {
    schema: stateSchema,
    actions: {
      update: {
        description: 'Update value',
        payload: z.object({ value: z.number() }),
      },
    },
  },
  createState: (set) => ({
    value: 0,
    dispatch: (action) => {
      if (action.type === 'update') {
        set({ value: action.payload.value });
      }
    },
  }),
});

const store = bridge.store;

function MyPage() {
  const value = useStore(store, (s) => s.value);
  
  React.useEffect(() => {
    let disconnect = () => {};
    bridge.connect().then((conn) => { disconnect = conn.disconnect; });
    return () => disconnect();
  }, []);
  
  return (
    <div className="p-8">
      <Card>
        <CardHeader>
          <CardTitle>My Page</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl">Value: {value}</p>
          <Button onClick={() => store.getState().dispatch({ type: 'update', payload: { value: value + 1 } })} >
            Increment
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

## Form Page Pattern

```typescript
// For pages that handle form data
interface FormState {
  data: {
    name: string;
    email: string;
  };
  isSubmitting: boolean;
  dispatch: (action: { type: string; payload?: unknown }) => void;
}

const formSchema = z.object({
  data: z.object({
    name: z.string(),
    email: z.string().email(),
  }),
  isSubmitting: z.boolean(),
});

const bridge = createBridgeStore<FormState, {
  updateField: { payload: { field: string; value: string } };
  submit: { payload: void };
  setSubmitting: { payload: { value: boolean } };
}>({
  pageId: 'form-page',
  storeKey: 'main',
  description: {
    schema: formSchema,
    actions: {
      updateField: {
        description: 'Update form field value',
        payload: z.object({ field: z.string(), value: z.string() }),
      },
      submit: {
        description: 'Submit form',
      },
      setSubmitting: {
        description: 'Set submitting state',
        payload: z.object({ value: z.boolean() }),
      },
    },
  },
  createState: (set, get) => ({
    data: { name: '', email: '' },
    isSubmitting: false,
    dispatch: (action) => {
      switch (action.type) {
        case 'updateField':
          set({
            data: { ...get().data, [action.payload.field]: action.payload.value },
          });
          break;
        case 'setSubmitting':
          set({ isSubmitting: action.payload.value });
          break;
      }
    },
  }),
});
```

## List/CRUD Page Pattern

```typescript
interface ListState {
  items: Array<{ id: string; text: string }>;
  dispatch: (action: { type: string; payload?: unknown }) => void;
}

const listSchema = z.object({
  items: z.array(z.object({ id: z.string(), text: z.string() })),
});

const bridge = createBridgeStore<ListState, {
  add: { payload: { text: string } };
  remove: { payload: { id: string } };
  update: { payload: { id: string; text: string } };
  clear: { payload: void };
}>({
  pageId: 'list-page',
  storeKey: 'main',
  description: {
    schema: listSchema,
    actions: {
      add: {
        description: 'Add new item',
        payload: z.object({ text: z.string() }),
      },
      remove: {
        description: 'Remove item by ID',
        payload: z.object({ id: z.string() }),
      },
      update: {
        description: 'Update item text',
        payload: z.object({ id: z.string(), text: z.string() }),
      },
      clear: {
        description: 'Clear all items',
      },
    },
  },
  createState: (set, get) => ({
    items: [],
    dispatch: (action) => {
      const items = get().items;
      switch (action.type) {
        case 'add':
          set({
            items: [...items, { id: crypto.randomUUID(), text: action.payload.text }],
          });
          break;
        case 'remove':
          set({ items: items.filter((i) => i.id !== action.payload.id) });
          break;
        case 'update':
          set({
            items: items.map((i) =>
              i.id === action.payload.id ? { ...i, text: action.payload.text } : i
            ),
          });
          break;
        case 'clear':
          set({ items: [] });
          break;
      }
    },
  }),
});
```
