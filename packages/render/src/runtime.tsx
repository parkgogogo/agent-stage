'use client';

import { createBridgeStore, type BridgeStore, type CreateBridgeStoreOptions } from "@agentstage/bridge/browser";
import type { Spec } from "@json-render/core";
import { Renderer } from "@json-render/react";
import React, { useEffect, useMemo, useState } from "react";
import type { ZodType } from "zod";
import { z } from "zod";
import { createRenderAgentKit, type CreateRenderAgentKitOptions } from "./agent-kit.js";
import { BridgeStateProvider } from "./bridge-state-provider.js";
import {
  createRenderRegistry,
  type CreateRenderRegistryOptions,
  type RenderActionDefinition,
  type RenderActionHandler,
} from "./registry.js";

type BridgeStateModel = Record<string, unknown>;
type BridgeActions = Record<string, { payload?: unknown }>;
type RenderBridge = BridgeStore<BridgeStateModel>;
type BridgeCreateStoreOptions = CreateBridgeStoreOptions<
  BridgeStateModel,
  BridgeActions
>;

const defaultBridgeSchema = z.record(z.unknown()) as unknown as ZodType<BridgeStateModel>;

export type SpecLoader = (context: { pageId: string }) => Promise<Spec>;
export type SpecPathResolver = string | ((context: { pageId: string }) => string);

export interface RenderBridgeOptions {
  gatewayUrl?: BridgeCreateStoreOptions["gatewayUrl"];
  storeKey?: BridgeCreateStoreOptions["storeKey"];
  schema?: BridgeCreateStoreOptions["description"]["schema"];
  actions?: BridgeCreateStoreOptions["description"]["actions"];
  events?: BridgeCreateStoreOptions["description"]["events"];
  createState?: BridgeCreateStoreOptions["createState"];
}

export interface RenderRuntimeOptions {
  actions?: Record<string, RenderActionDefinition>;
  actionHandlers?: Record<string, RenderActionHandler>;
  loadSpec?: SpecLoader;
  specPath?: SpecPathResolver;
  bridge?: RenderBridgeOptions;
}

type SlotRenderer<TProps> = React.ReactNode | ((props: TProps) => React.ReactNode);

export interface RenderPageSlots {
  loading: SlotRenderer<{ pageId: string }>;
  error: SlotRenderer<{ pageId: string; error: Error }>;
  empty: SlotRenderer<{ pageId: string }>;
}

export interface RenderPageProps {
  pageId: string;
  spec?: Spec;
  bridge?: RenderBridge;
  options?: RenderRuntimeOptions;
  slots?: Partial<RenderPageSlots>;
  className?: string;
}

export interface RenderRuntime {
  RenderPage: (props: RenderPageProps) => React.JSX.Element;
  createAgentKit: (
    options?: Pick<CreateRenderAgentKitOptions, "actions">,
  ) => ReturnType<typeof createRenderAgentKit>;
}

const defaultSlots: RenderPageSlots = {
  loading: () => (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading UI...</div>
    </div>
  ),
  error: ({ error }) => (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-destructive">Error: {error.message}</div>
    </div>
  ),
  empty: () => (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-muted-foreground">No UI spec found</div>
    </div>
  ),
};

function mergeBridgeOptions(
  base?: RenderBridgeOptions,
  override?: RenderBridgeOptions,
): RenderBridgeOptions | undefined {
  if (!base && !override) {
    return undefined;
  }

  return {
    ...base,
    ...override,
    actions: {
      ...(base?.actions ?? {}),
      ...(override?.actions ?? {}),
    },
    events: {
      ...(base?.events ?? {}),
      ...(override?.events ?? {}),
    },
  };
}

function mergeRuntimeOptions(
  base: RenderRuntimeOptions,
  override?: RenderRuntimeOptions,
): RenderRuntimeOptions {
  if (!override) {
    return base;
  }

  return {
    ...base,
    ...override,
    actions: {
      ...(base.actions ?? {}),
      ...(override.actions ?? {}),
    },
    actionHandlers: {
      ...(base.actionHandlers ?? {}),
      ...(override.actionHandlers ?? {}),
    },
    bridge: mergeBridgeOptions(base.bridge, override.bridge),
  };
}

function resolveSpecPath(
  pageId: string,
  specPath?: SpecPathResolver,
): string {
  if (typeof specPath === "function") {
    return specPath({ pageId });
  }
  return specPath ?? `/pages/${pageId}/ui.json`;
}

function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  return new Error(String(error));
}

function createDefaultSpecLoader(specPath?: SpecPathResolver): SpecLoader {
  return async ({ pageId }) => {
    const path = resolveSpecPath(pageId, specPath);
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to load ui.json from ${path}: ${response.status}`);
    }
    return (await response.json()) as Spec;
  };
}

function renderSlot<TProps>(
  slot: SlotRenderer<TProps>,
  props: TProps,
): React.ReactNode {
  return typeof slot === "function"
    ? (slot as (input: TProps) => React.ReactNode)(props)
    : slot;
}

function createInternalBridge(
  pageId: string,
  bridgeOptions?: RenderBridgeOptions,
): RenderBridge {
  return createBridgeStore<BridgeStateModel, BridgeActions>({
    pageId,
    gatewayUrl: bridgeOptions?.gatewayUrl,
    storeKey: bridgeOptions?.storeKey ?? "main",
    description: {
      schema: bridgeOptions?.schema ?? defaultBridgeSchema,
      actions: bridgeOptions?.actions ?? {},
      events: bridgeOptions?.events,
    },
    createState: bridgeOptions?.createState ?? (() => ({})),
  });
}

function RuntimeRenderPage({
  pageId,
  spec,
  bridge,
  options,
  slots,
  className,
  runtimeDefaults,
}: RenderPageProps & { runtimeDefaults: RenderRuntimeOptions }) {
  const mergedOptions = useMemo(
    () => mergeRuntimeOptions(runtimeDefaults, options),
    [runtimeDefaults, options],
  );

  const resolvedSlots = useMemo(
    () => ({ ...defaultSlots, ...(slots ?? {}) }),
    [slots],
  );

  const specLoader = useMemo(
    () => mergedOptions.loadSpec ?? createDefaultSpecLoader(mergedOptions.specPath),
    [mergedOptions.loadSpec, mergedOptions.specPath],
  );

  const { registry } = useMemo(
    () =>
      createRenderRegistry({
        actions: mergedOptions.actions,
        actionHandlers: mergedOptions.actionHandlers,
      } satisfies CreateRenderRegistryOptions),
    [mergedOptions.actions, mergedOptions.actionHandlers],
  );

  const activeBridge = useMemo(
    () => bridge ?? createInternalBridge(pageId, mergedOptions.bridge),
    [bridge, mergedOptions.bridge, pageId],
  );

  const [resolvedSpec, setResolvedSpec] = useState<Spec | null>(() => spec ?? null);
  const [loading, setLoading] = useState<boolean>(() => spec === undefined);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (spec !== undefined) {
      setResolvedSpec(spec);
      setLoading(false);
      setError(null);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    void specLoader({ pageId })
      .then((nextSpec) => {
        if (!active) {
          return;
        }
        setResolvedSpec(nextSpec);
        setLoading(false);
      })
      .catch((loadError) => {
        if (!active) {
          return;
        }
        setResolvedSpec(null);
        setError(toError(loadError));
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [pageId, spec, specLoader]);

  if (loading) {
    return (
      <>
        {renderSlot(resolvedSlots.loading, {
          pageId,
        })}
      </>
    );
  }

  if (error) {
    return (
      <>
        {renderSlot(resolvedSlots.error, {
          pageId,
          error,
        })}
      </>
    );
  }

  if (!resolvedSpec) {
    return (
      <>
        {renderSlot(resolvedSlots.empty, {
          pageId,
        })}
      </>
    );
  }

  return (
    <BridgeStateProvider bridge={activeBridge}>
      <div className={className ?? "min-h-screen bg-background p-8"}>
        <Renderer spec={resolvedSpec} registry={registry} />
      </div>
    </BridgeStateProvider>
  );
}

export function createRenderRuntime(
  defaultOptions: RenderRuntimeOptions = {},
): RenderRuntime {
  function RenderPage(props: RenderPageProps): React.JSX.Element {
    return <RuntimeRenderPage {...props} runtimeDefaults={defaultOptions} />;
  }

  return {
    RenderPage,
    createAgentKit: (options?: Pick<CreateRenderAgentKitOptions, "actions">) =>
      createRenderAgentKit({
        actions: {
          ...(defaultOptions.actions ?? {}),
          ...(options?.actions ?? {}),
        },
      }),
  };
}

const defaultRuntime = createRenderRuntime();

export const RenderPage = defaultRuntime.RenderPage;
export const createAgentKit = defaultRuntime.createAgentKit;
