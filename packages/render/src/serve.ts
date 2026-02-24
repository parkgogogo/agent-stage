import { startBridgeBunServer } from "@agentstage/bridge/bun";
import { existsSync } from "node:fs";
import { mkdir, readFile, stat } from "node:fs/promises";
import { join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

interface BunBuildOutput {
  path?: string;
  text(): Promise<string>;
}

interface BunBuildResult {
  success: boolean;
  outputs: BunBuildOutput[];
  logs?: Array<{ message?: string }>;
}

interface BunLike {
  write(path: string, data: string): Promise<number>;
  build(options: {
    entrypoints: string[];
    target: "browser";
    format: "esm";
    sourcemap?: "inline" | "none";
    minify?: boolean;
  }): Promise<BunBuildResult>;
}

function getBun(): BunLike {
  const bun = (globalThis as { Bun?: BunLike }).Bun;
  if (!bun) {
    throw new Error(
      "Bun runtime is required. Install Bun and run this command via bun/bunx.",
    );
  }
  return bun;
}

export interface StartRenderServeOptions {
  workspaceDir: string;
  pageId: string;
  pagesDir?: string;
  port?: number;
  host?: string;
}

export interface RenderServeHandle {
  close: () => Promise<void>;
}

function resolveContentType(path: string): string {
  if (path.endsWith(".json")) {
    return "application/json; charset=utf-8";
  }
  if (path.endsWith(".js")) {
    return "application/javascript; charset=utf-8";
  }
  if (path.endsWith(".html")) {
    return "text/html; charset=utf-8";
  }
  return "text/plain; charset=utf-8";
}

function isWithin(base: string, target: string): boolean {
  const normalizedBase = resolve(base);
  const normalizedTarget = resolve(target);
  return (
    normalizedTarget === normalizedBase ||
    normalizedTarget.startsWith(`${normalizedBase}${sep}`)
  );
}

function createHtml(pageId: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Agentstage - ${pageId}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/__agentstage/app.js"></script>
  </body>
</html>`;
}

async function buildClientBundle(cacheDir: string, pageId: string): Promise<string> {
  const bun = getBun();
  await mkdir(cacheDir, { recursive: true });
  const runtimeModulePath = fileURLToPath(new URL("./runtime.js", import.meta.url));

  const entryPath = join(cacheDir, `entry-${pageId}.tsx`);
  const entryContent = `import React from "react";
import { createRoot } from "react-dom/client";
import { RenderPage } from ${JSON.stringify(runtimeModulePath)};

const root = document.getElementById("root");
if (!root) {
  throw new Error("Missing #root");
}

createRoot(root).render(React.createElement(RenderPage, { pageId: ${JSON.stringify(pageId)} }));
`;

  await bun.write(entryPath, entryContent);

  const result = await bun.build({
    entrypoints: [entryPath],
    target: "browser",
    format: "esm",
    sourcemap: "inline",
    minify: false,
  });

  if (!result.success || result.outputs.length === 0) {
    const logs = result.logs?.map((log) => log.message).filter(Boolean).join("\n");
    throw new Error(`Failed to bundle client app${logs ? `:\n${logs}` : ""}`);
  }

  const entryOutput =
    result.outputs.find((output) => output.path?.endsWith(".js")) ??
    result.outputs[0];
  return entryOutput.text();
}

export async function startRenderServe(
  options: StartRenderServeOptions,
): Promise<RenderServeHandle> {
  const workspaceDir = resolve(options.workspaceDir);
  const pagesDir = resolve(options.pagesDir ?? join(workspaceDir, "pages"));
  const pageId = options.pageId;
  const port = options.port ?? 3000;
  const host = options.host ?? "0.0.0.0";

  const pageDir = join(pagesDir, pageId);
  const uiJsonPath = join(pageDir, "ui.json");

  if (!existsSync(uiJsonPath)) {
    throw new Error(`Page "${pageId}" not found: ${uiJsonPath}`);
  }

  const cacheDir = join(workspaceDir, ".agentstage", ".cache", "render-serve");
  const clientBundle = await buildClientBundle(cacheDir, pageId);

  const server = await startBridgeBunServer({
    pagesDir,
    port,
    host,
    requestHandler: async (req, res) => {
      const reqUrl = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
      const pathname = reqUrl.pathname;

      if (pathname === "/" || pathname === `/${pageId}`) {
        res.statusCode = 200;
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.end(createHtml(pageId));
        return;
      }

      if (pathname === "/health") {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ ok: true, pageId }));
        return;
      }

      if (pathname === "/__agentstage/app.js") {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/javascript; charset=utf-8");
        res.end(clientBundle);
        return;
      }

      if (pathname.startsWith("/pages/")) {
        const relativePath = decodeURIComponent(pathname.slice("/pages/".length));
        const absolutePath = resolve(pagesDir, relativePath);

        if (!isWithin(pagesDir, absolutePath)) {
          res.statusCode = 403;
          res.end("Forbidden");
          return;
        }

        try {
          const fileStat = await stat(absolutePath);
          if (!fileStat.isFile()) {
            res.statusCode = 404;
            res.end("Not Found");
            return;
          }

          const content = await readFile(absolutePath);
          res.statusCode = 200;
          res.setHeader("Content-Type", resolveContentType(absolutePath));
          res.end(content);
          return;
        } catch {
          res.statusCode = 404;
          res.end("Not Found");
          return;
        }
      }

      res.statusCode = 404;
      res.end("Not Found");
    },
  });

  return {
    close: server.close,
  };
}
