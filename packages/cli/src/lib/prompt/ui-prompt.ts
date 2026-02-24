export interface BuildUiPromptInput {
  pageId?: string;
  uiSpec?: unknown;
  state?: unknown;
  compact?: boolean;
}

function toJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export function buildUiPrompt(input: BuildUiPromptInput = {}): string {
  const sections: string[] = [];
  const compact = input.compact === true;
  const pageLabel = input.pageId ? ` for page "${input.pageId}"` : "";

  sections.push(`Generate a json-render UI spec${pageLabel}.`);
  sections.push("Return ONLY one valid JSON object.");
  sections.push("Do not output markdown fences.");
  sections.push("Do not output explanations.");

  sections.push("");
  sections.push("Required output shape:");
  sections.push('{ "root": "element-id", "elements": { "element-id": { "type": "ComponentName", "props": {}, "children": [] } } }');

  sections.push("");
  sections.push("Rules:");
  sections.push("1. root must reference an existing element key in elements.");
  sections.push("2. Every children element id must exist in elements.");
  sections.push("3. Use only registered component names.");
  sections.push("4. Keep all props JSON-serializable.");
  sections.push('5. State read binding: { "$state": "/path" }');
  sections.push('6. Two-way binding: { "$bindState": "/path" }');
  sections.push('7. List item binding: { "$item": "fieldName" }');
  sections.push('8. List index binding: { "$index": true }');

  sections.push("");
  sections.push("Common components:");
  sections.push("Layout: Stack, Card, Grid, Separator");
  sections.push("Typography: Heading, Text, Badge");
  sections.push("Input: Input, Button, Select, Checkbox, Switch");
  sections.push("Data/Feedback: Table, Tabs, Dialog, Accordion, Alert, Progress, Skeleton, Spinner");

  sections.push("");
  sections.push("Actions:");
  sections.push('Use event handlers like: "on": { "press": { "action": "setState", "params": { ... } } }');
  sections.push("Common actions: setState, pushState, removeState");

  if (input.state !== undefined) {
    sections.push("");
    sections.push("Current state context:");
    sections.push(toJson(input.state));
  }

  if (input.uiSpec !== undefined && !compact) {
    sections.push("");
    sections.push("Existing ui.json context:");
    sections.push(toJson(input.uiSpec));
    sections.push("If you improve it, keep ids stable when possible.");
  }

  sections.push("");
  sections.push("Now output the final JSON object only.");

  return sections.join("\n");
}

