'use client';

import type { BridgeStore as AgentBridgeStore } from '@agentstage/bridge/browser';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

type BridgeStateModel = Record<string, unknown>;
export type BridgeStateBridge<TState extends BridgeStateModel = BridgeStateModel> = AgentBridgeStore<TState>;

type PathFormat = 'auto' | 'dot' | 'slash';
export type { PathFormat as BridgeStatePathFormat };

interface BridgeStateContextValue {
  state: BridgeStateModel;
  get: (path: string) => unknown;
  set: (path: string, value: unknown) => void;
  update: (updates: Record<string, unknown>) => void;
  bridge: BridgeStateBridge;
}

const BridgeStateContext = createContext<BridgeStateContextValue | null>(null);

export interface BridgeStateProviderProps<TState extends BridgeStateModel = BridgeStateModel> {
  bridge: BridgeStateBridge<TState>;
  pathFormat?: PathFormat;
  children: React.ReactNode;
}

type MutableContainer = Record<string, unknown> | unknown[];

function isContainer(value: unknown): value is MutableContainer {
  return typeof value === 'object' && value !== null;
}

function toArrayIndex(segment: string): number {
  if (!/^\d+$/.test(segment)) {
    return -1;
  }
  const index = Number(segment);
  return Number.isSafeInteger(index) ? index : -1;
}

function parsePath(path: string, pathFormat: PathFormat): string[] {
  const input = path.trim();
  if (!input) {
    return [];
  }

  const format =
    pathFormat === 'auto'
      ? input.includes('/')
        ? 'slash'
        : 'dot'
      : pathFormat;

  if (format === 'slash') {
    return input.split('/').filter(Boolean);
  }
  return input.split('.').filter(Boolean);
}

function getChild(container: unknown, segment: string): unknown {
  if (!isContainer(container)) {
    return undefined;
  }
  if (Array.isArray(container)) {
    const index = toArrayIndex(segment);
    if (index >= 0) {
      return container[index];
    }
    return (container as unknown as Record<string, unknown>)[segment];
  }
  return container[segment];
}

function cloneContainerForPath(value: unknown, nextSegment: string): MutableContainer {
  if (Array.isArray(value)) {
    return [...value];
  }
  if (isContainer(value)) {
    return { ...(value as Record<string, unknown>) };
  }
  return toArrayIndex(nextSegment) >= 0 ? [] : {};
}

function assignChild(container: MutableContainer, segment: string, value: unknown): void {
  if (Array.isArray(container)) {
    const index = toArrayIndex(segment);
    if (index >= 0) {
      container[index] = value;
      return;
    }
    (container as unknown as Record<string, unknown>)[segment] = value;
    return;
  }
  container[segment] = value;
}

function getAtPath(source: BridgeStateModel, path: string[]): unknown {
  let current: unknown = source;
  for (const segment of path) {
    current = getChild(current, segment);
    if (current === undefined) {
      return undefined;
    }
  }
  return current;
}

function setAtPath(source: BridgeStateModel, path: string[], value: unknown): BridgeStateModel {
  if (path.length === 0) {
    if (isContainer(value) && !Array.isArray(value)) {
      return { ...(value as Record<string, unknown>) };
    }
    return source;
  }

  const root: MutableContainer = { ...source };
  let nextCursor: MutableContainer = root;
  let prevCursor: unknown = source;

  for (let i = 0; i < path.length - 1; i += 1) {
    const segment = path[i];
    const nextSegment = path[i + 1];
    if (!segment || !nextSegment) {
      return source;
    }

    const prevChild = getChild(prevCursor, segment);
    const nextChild = cloneContainerForPath(prevChild, nextSegment);
    assignChild(nextCursor, segment, nextChild);

    nextCursor = nextChild;
    prevCursor = prevChild;
  }

  const finalSegment = path[path.length - 1];
  if (!finalSegment) {
    return source;
  }
  assignChild(nextCursor, finalSegment, value);
  return root as BridgeStateModel;
}

export function BridgeStateProvider<TState extends BridgeStateModel = BridgeStateModel>({
  bridge,
  pathFormat = 'auto',
  children,
}: BridgeStateProviderProps<TState>) {
  const [state, setLocalState] = useState<TState>(() => bridge.store.getState());

  useEffect(() => {
    let active = true;
    let disconnect: (() => void) | null = null;

    setLocalState(bridge.store.getState());

    void bridge
      .connect()
      .then((connection) => {
        if (!active) {
          connection.disconnect();
          return;
        }
        disconnect = connection.disconnect;
      })
      .catch((error) => {
        if (active) {
          console.error('[BridgeStateProvider] Failed to connect bridge', error);
        }
      });

    const unsubscribe = bridge.store.subscribe((newState) => {
      if (active) {
        setLocalState(newState);
      }
    });

    return () => {
      active = false;
      unsubscribe();
      disconnect?.();
    };
  }, [bridge]);

  const value: BridgeStateContextValue = useMemo(
    () => ({
      state,
      get: (path: string) => getAtPath(state, parsePath(path, pathFormat)),
      set: (path: string, valueToSet: unknown) => {
        bridge.store.setState((prev) => {
          const segments = parsePath(path, pathFormat);
          return setAtPath(prev as BridgeStateModel, segments, valueToSet) as TState;
        });
      },
      update: (updates: Record<string, unknown>) => {
        bridge.store.setState((prev) => {
          let next = prev as BridgeStateModel;
          for (const [path, valueToSet] of Object.entries(updates)) {
            const segments = parsePath(path, pathFormat);
            next = setAtPath(next, segments, valueToSet);
          }
          return next as TState;
        });
      },
      bridge,
    }),
    [bridge, pathFormat, state],
  );

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
export function useBridgeState<T>(
  selector: (state: BridgeStateModel) => T,
  isEqual: (prev: T, next: T) => boolean = Object.is,
): T {
  const { bridge } = useBridgeStateContext();
  const selectorRef = useRef(selector);
  const isEqualRef = useRef(isEqual);

  selectorRef.current = selector;
  isEqualRef.current = isEqual;

  const [selected, setSelected] = useState(() => selector(bridge.store.getState()));

  useEffect(() => {
    setSelected(selectorRef.current(bridge.store.getState()));

    return bridge.store.subscribe((nextState) => {
      const nextSelected = selectorRef.current(nextState);
      setSelected((prevSelected) =>
        isEqualRef.current(prevSelected, nextSelected) ? prevSelected : nextSelected,
      );
    });
  }, [bridge]);

  return selected;
}
