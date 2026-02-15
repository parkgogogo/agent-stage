import { createStore, type StoreApi } from 'zustand/vanilla';
import { zodToJsonSchema } from 'zod-to-json-schema';
import type { CreateBridgeStoreOptions, BridgeStore } from './types.js';
import type { StoreDescription, GatewayMessage } from '../shared/types.js';

const WS_PATH = '/_bridge';

function generateStoreId(pageId: string): string {
  const random = Math.random().toString(36).substring(2, 10);
  return `${pageId}#${random}`;
}

function getGatewayUrl(): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}${WS_PATH}`;
}

export function createBridgeStore<
  TState,
  TActions extends Record<string, { payload?: unknown }> = Record<string, never>
>(
  options: CreateBridgeStoreOptions<TState, TActions>
): BridgeStore<TState> {
  const gatewayUrl = options.gatewayUrl || getGatewayUrl();
  const storeKey = options.storeKey || 'main';
  const storeId = generateStoreId(options.pageId);
  
  const store = createStore<TState>((set, get) => 
    options.createState(
      (fn) => set(fn(get())),
      get
    )
  );
  
  const description: StoreDescription = {
    pageId: options.pageId,
    storeKey,
    schema: zodToJsonSchema(options.description.schema, { name: 'State' }),
    actions: Object.fromEntries(
      Object.entries(options.description.actions).map(([key, def]) => [
        key,
        {
          description: def.description,
          payload: def.payload 
            ? zodToJsonSchema(def.payload, { name: `${key}Payload` })
            : undefined,
        },
      ])
    ),
    events: options.description.events 
      ? Object.fromEntries(
          Object.entries(options.description.events).map(([key, def]) => [
            key,
            {
              description: def.description,
              payload: def.payload 
                ? zodToJsonSchema(def.payload, { name: `${key}Payload` })
                : undefined,
            },
          ])
        )
      : undefined,
  };
  
  let ws: WebSocket | null = null;
  let version = 0;
  let isConnected = false;
  let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  
  function send(message: GatewayMessage) {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }
  
  function startHeartbeat() {
    heartbeatInterval = setInterval(() => {
      send({ type: 'store.heartbeat' });
    }, 30000);
  }
  
  function stopHeartbeat() {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
  }
  
  function handleGatewayMessage(data: string) {
    try {
      const msg = JSON.parse(data);
      
      switch (msg.type) {
        case 'client.setState': {
          const { state, expectedVersion } = msg.payload;
          if (expectedVersion !== undefined && expectedVersion !== version) {
            console.warn('[BridgeStore] Version mismatch, ignoring setState');
            return;
          }
          store.setState(state as TState);
          break;
        }
        
        case 'client.dispatch': {
          const { action } = msg.payload;
          const current = store.getState();
          if (typeof (current as any).dispatch === 'function') {
            (current as any).dispatch(action);
          }
          break;
        }
        
        case 'client.ping':
          break;
      }
    } catch (err) {
      console.error('[BridgeStore] Failed to handle message:', err);
    }
  }
  
  const unsubscribe = store.subscribe((state) => {
    version += 1;
    send({
      type: 'store.stateChanged',
      payload: {
        storeId,
        state,
        version,
        source: 'browser',
      },
    });
  });
  
  return {
    store,
    
    describes() {
      return description;
    },
    
    get isConnected() {
      return isConnected;
    },
    
    connect(): Promise<{ storeId: string; disconnect: () => void }> {
      return new Promise((resolve, reject) => {
        if (ws?.readyState === WebSocket.OPEN) {
          resolve({ storeId, disconnect: () => ws?.close() });
          return;
        }
        
        ws = new WebSocket(gatewayUrl);
        
        ws.onopen = () => {
          isConnected = true;
          
          send({
            type: 'store.register',
            payload: {
              storeId,
              pageId: options.pageId,
              storeKey,
              description,
              initialState: store.getState(),
            },
          });
          
          startHeartbeat();
          resolve({
            storeId,
            disconnect: () => {
              send({ type: 'store.disconnect' });
              stopHeartbeat();
              unsubscribe();
              ws?.close();
            },
          });
        };
        
        ws.onmessage = (event) => {
          handleGatewayMessage(event.data);
        };
        
        ws.onclose = () => {
          isConnected = false;
          stopHeartbeat();
        };
        
        ws.onerror = (err) => {
          reject(err);
        };
      });
    },
  };
}
