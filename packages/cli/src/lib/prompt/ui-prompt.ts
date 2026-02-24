import { createRenderAgentKit, type Spec } from "@agentstage/render";

export interface BuildUiPromptInput {
  pageId?: string;
  uiSpec?: unknown;
  state?: unknown;
  compact?: boolean;
}

function toJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function toSpec(value: unknown): Spec | undefined {
  if (
    typeof value === "object" &&
    value !== null &&
    "root" in value &&
    "elements" in value
  ) {
    return value as Spec;
  }
  return undefined;
}

function toState(value: unknown): Record<string, unknown> | undefined {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return undefined;
}

export function buildUiPrompt(input: BuildUiPromptInput = {}): string {
  const kit = createRenderAgentKit();
  const systemPrompt = kit.systemPrompt();
  const sections: string[] = [];
  const compact = input.compact === true;

  const currentSpec = toSpec(input.uiSpec);
  const currentState = toState(input.state);
  const targetPrompt = input.pageId
    ? `Refine UI for page "${input.pageId}" based on current files.`
    : "Generate a new UI for the requested page.";
  const userPrompt = kit.buildUserPrompt({
    prompt: targetPrompt,
    currentSpec: currentSpec ?? null,
    state: currentState ?? null,
  });

  sections.push("=== SYSTEM PROMPT (createRenderAgentKit.systemPrompt) ===");
  sections.push(systemPrompt);
  sections.push("");
  sections.push("=== USER PROMPT ===");
  sections.push(userPrompt);

  if (currentSpec && !compact) {
    sections.push("");
    sections.push("=== CURRENT ui.json ===");
    sections.push(toJson(currentSpec));
  }

  if (currentState && !compact) {
    sections.push("");
    sections.push("=== CURRENT state ===");
    sections.push(toJson(currentState));
  }

  return sections.join("\n");
}
