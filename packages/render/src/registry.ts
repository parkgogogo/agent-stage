import type { Catalog, SchemaDefinition, StateModel } from "@json-render/core";
import { defineCatalog } from "@json-render/core";
import {
  defineRegistry,
  schema,
  type DefineRegistryResult,
  type SetState,
} from "@json-render/react";
import type { ZodType } from "zod";
import { shadcnComponentDefinitions, shadcnComponents } from "./shadcn.js";

type ComponentDefinition =
  (typeof shadcnComponentDefinitions)[keyof typeof shadcnComponentDefinitions];
type ComponentRenderer =
  (typeof shadcnComponents)[keyof typeof shadcnComponents];

export interface RenderActionDefinition {
  params?: ZodType;
  description?: string;
}

export type RenderActionHandler = (
  params: Record<string, unknown> | undefined,
  setState: SetState,
  state: StateModel,
) => Promise<void>;

export interface RenderCatalogInput {
  components: Record<string, ComponentDefinition>;
  actions: Record<string, RenderActionDefinition>;
}

export interface CreateRenderCatalogOptions {
  actions?: Record<string, RenderActionDefinition>;
}

export interface CreateRenderCatalogResult {
  catalog: Catalog<SchemaDefinition, RenderCatalogInput>;
  catalogData: RenderCatalogInput;
}

export interface CreateRenderRegistryOptions
  extends CreateRenderCatalogOptions {
  actionHandlers?: Record<string, RenderActionHandler>;
}

export interface CreateRenderRegistryResult extends DefineRegistryResult {
  catalog: Catalog<SchemaDefinition, RenderCatalogInput>;
}

function assertNoMissingActionHandlers(
  actions: Record<string, RenderActionDefinition>,
  handlers: Record<string, RenderActionHandler>,
): void {
  const missing = Object.keys(actions).filter(
    (name) => typeof handlers[name] !== "function",
  );
  if (missing.length === 0) {
    return;
  }
  throw new Error(
    `Missing action handlers for actions: ${missing.join(", ")}. ` +
    "Provide them via createRenderRegistry({ actionHandlers }).",
  );
}

export function createRenderCatalog(
  options: CreateRenderCatalogOptions = {},
): CreateRenderCatalogResult {
  const catalogData: RenderCatalogInput = {
    components: {
      ...shadcnComponentDefinitions,
    },
    actions: {
      ...(options.actions ?? {}),
    },
  };

  const catalog = defineCatalog(schema, catalogData);
  return { catalog, catalogData };
}

export function createRenderRegistry(
  options: CreateRenderRegistryOptions = {},
): CreateRenderRegistryResult {
  const { catalog, catalogData } = createRenderCatalog(options);

  const renderers: Record<string, ComponentRenderer> = { ...shadcnComponents };
  const actionHandlers = { ...(options.actionHandlers ?? {}) };
  if (Object.keys(catalogData.actions).length > 0) {
    assertNoMissingActionHandlers(catalogData.actions, actionHandlers);
  }

  const result = defineRegistry(catalog, {
    components: renderers as never,
    actions: actionHandlers as never,
  });
  return { catalog, ...result };
}
