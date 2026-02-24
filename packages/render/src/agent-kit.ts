import {
  buildUserPrompt,
  type PromptOptions,
  type UserPromptOptions,
} from "@json-render/core";
import {
  createRenderCatalog,
  type CreateRenderCatalogOptions,
  type RenderCatalogInput,
} from "./registry.js";

export type CreateRenderAgentKitOptions = CreateRenderCatalogOptions;

export interface RenderAgentKit {
  systemPrompt: (options?: PromptOptions) => string;
  jsonSchema: () => object;
  buildUserPrompt: (options: UserPromptOptions) => string;
  catalog: ReturnType<typeof createRenderCatalog>["catalog"];
  catalogData: RenderCatalogInput;
}

export function createRenderAgentKit(
  options: CreateRenderAgentKitOptions = {},
): RenderAgentKit {
  const { catalog, catalogData } = createRenderCatalog(options);

  return {
    systemPrompt: (promptOptions?: PromptOptions) =>
      catalog.prompt(promptOptions),
    jsonSchema: () => catalog.jsonSchema(),
    buildUserPrompt: (userPromptOptions: UserPromptOptions) =>
      buildUserPrompt(userPromptOptions),
    catalog,
    catalogData,
  };
}
