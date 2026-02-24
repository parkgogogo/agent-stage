import { Command } from "commander";
import consola from "consola";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { join } from "pathe";
import { buildUiPrompt } from "../../lib/prompt/ui-prompt.js";
import { getWorkspaceDir, isInitialized } from "../../utils/paths.js";

function parsePageId(pageId: string): void {
  if (!/^[a-z0-9-]+$/.test(pageId)) {
    throw new Error("Invalid pageId. Allowed: lowercase letters, numbers, hyphen");
  }
}

async function readJson(path: string): Promise<unknown> {
  const content = await readFile(path, "utf8");
  return JSON.parse(content);
}

export const promptUiCommand = new Command("ui")
  .description("Print prompt text for generating json-render ui.json")
  .option("--page <pageId>", "Use an existing page as context")
  .option("--compact", "Hide verbose context sections", false)
  .action(async (options) => {
    const pageId = options.page as string | undefined;
    const compact = options.compact === true;

    try {
      if (!pageId) {
        process.stdout.write(`${buildUiPrompt({ compact })}\n`);
        return;
      }

      parsePageId(pageId);

      if (!isInitialized()) {
        throw new Error("Project not initialized. Please run `agentstage init` first.");
      }

      const workspaceDir = await getWorkspaceDir();
      const pageDir = join(workspaceDir, "pages", pageId);
      const uiPath = join(pageDir, "ui.json");
      const storePath = join(pageDir, "store.json");

      if (!existsSync(uiPath)) {
        throw new Error(`Page "${pageId}" not found: ${uiPath}`);
      }

      const uiSpec = await readJson(uiPath);
      let state: unknown = undefined;

      if (existsSync(storePath)) {
        const store = await readJson(storePath);
        if (typeof store === "object" && store !== null && "state" in store) {
          state = (store as { state?: unknown }).state;
        }
      }

      process.stdout.write(
        `${buildUiPrompt({
          pageId,
          uiSpec,
          state,
          compact,
        })}\n`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to build ui prompt";
      consola.error(message);
      process.exit(1);
    }
  });

