#!/usr/bin/env bun
import { startRenderServe } from "./serve.js";

interface ParsedArgs {
  workspaceDir: string;
  pageId: string;
  port: number;
  host: string;
}

function parseArgs(argv: string[]): ParsedArgs {
  const parsed: ParsedArgs = {
    workspaceDir: process.cwd(),
    pageId: "",
    port: 3000,
    host: "0.0.0.0",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const current = argv[i];
    const next = argv[i + 1];

    if (!current) {
      continue;
    }

    if (current === "--workspace" && next) {
      parsed.workspaceDir = next;
      i += 1;
      continue;
    }

    if (current === "--page" && next) {
      parsed.pageId = next;
      i += 1;
      continue;
    }

    if (current === "--port" && next) {
      const port = Number.parseInt(next, 10);
      if (Number.isFinite(port) && port > 0) {
        parsed.port = port;
      }
      i += 1;
      continue;
    }

    if (current === "--host" && next) {
      parsed.host = next;
      i += 1;
      continue;
    }
  }

  if (!parsed.pageId) {
    throw new Error("Missing required argument: --page <pageId>");
  }

  return parsed;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const runtime = await startRenderServe({
    workspaceDir: args.workspaceDir,
    pageId: args.pageId,
    port: args.port,
    host: args.host,
  });

  process.on("SIGINT", async () => {
    await runtime.close();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    await runtime.close();
    process.exit(0);
  });

  await new Promise(() => {});
}

void main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Failed to start render serve",
  );
  process.exit(1);
});
