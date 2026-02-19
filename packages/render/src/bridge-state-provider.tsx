'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// Bridge interface - matches agent-stage-bridge
interface BridgeStore {
  getState: () => Record<string, unknown>;
  subscribe: (callback: (state: Record<string, unknown>) => void) => () => void;
  setState: (updater: (prev: Record<string, unknown>) => Record<string, unknown>) => void;
}

interface Bridge {
  store: BridgeStore;
  connect: () => Promise<void>;
}

interface BridgeStateContextValue {
  state: Record<string, unknown>;
  get: (path: string) => unknown;
  set: (path: string, value: unknown) => void;
  update: (updates: Record<string, unknown>) => void;
  bridge: Bridge;
}

const BridgeStateContext = createContext<BridgeStateContextValue | null>(null);

export interface BridgeStateProviderProps {
  bridge: Bridge;
  children: React.ReactNode;
}

export function BridgeStateProvider({ bridge, children }: BridgeStateProviderProps) {
  const [state, setLocalState] = useState(() => bridge.store.getState());

  useEffect(() => {
    bridge.connect().catch(console.error);
    return bridge.store.subscribe((newState) => setLocalState(newState));
  }, [bridge]);

  const value: BridgeStateContextValue = {
    state,
    get: (path: string) => {
      const parts = path.split('.');
      let current: unknown = state;
      for (const part of parts) {
        if (current === null || current === undefined) return undefined;
        current = (current as Record<string, unknown>)[part];
      }
      return current;
    },
    set: (path: string, value: unknown) => {
      bridge.store.setState((prev) => {
        const next = { ...prev };
        const parts = path.split('.');
        let current: Record<string, unknown> = next;
        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i];
          if (!(part in current) || typeof current[part] !== 'object') {
            current[part] = {};
          }
          current = current[part] as Record<string, unknown>;
        }
        current[parts[parts.length - 1]] = value;
        return next;
      });
    },
    update: (updates: Record<string, unknown>) => {
      bridge.store.setState((prev) => {
        const next = { ...prev };
        for (const [path, value] of Object.entries(updates)) {
          const parts = path.split('.');
          let current: Record<string, unknown> = next;
          for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!(part in current) || typeof current[part] !== 'object') {
              current[part] = {};
            }
            current = current[part] as Record<string, unknown>;
          }
          current[parts[parts.length - 1]] = value;
        }
        return next;
      });
    },
    bridge,
  };

  return (
    <BridgeStateContext.Provider value={value}>
      {children}
    </BridgeStateContext.Provider>
  );
}

export function useBridgeStateContext(): BridgeStateContextValue {
  const context = useContext(BridgeStateContext);
  if (!context) {
    throw new Error('useBridgeStateContext must be used within BridgeStateProvider');
  }
  return context;
}

// Hook for using bridge state with selector
export function useBridgeState<T>(selector: (state: Record<string, unknown>) => T): T {
  const { state } = useBridgeStateContext();
  return selector(state);
}
