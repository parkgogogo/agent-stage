import { Command } from "commander";
import * as p from "@clack/prompts";
import consola from "consola";
import c from "picocolors";
import { spawn, type ChildProcess } from "node:child_process";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import { execa } from "execa";
import { existsSync } from "fs";
import { dirname, join } from "pathe";
import {
  getWorkspaceDir,
  isInitialized,
  readRuntimeConfig,
  saveRuntimeConfig,
  type RuntimeConfig,
} from "../utils/paths.js";
import { canStartTunnel, startTunnel, printTunnelInfo } from "../utils/tunnel.js";
import { checkCloudflared, printInstallInstructions } from "../utils/cloudflared.js";

const require = createRequire(import.meta.url);

async function ensurePortAvailable(port: number, host: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const probe = createServer();
    probe.once("error", (error: NodeJS.ErrnoException) => {
      probe.close();
      if (error.code === "EADDRINUSE") {
        reject(new Error(`Port ${port} is already in use`));
        return;
      }
      reject(error);
    });
    probe.listen(port, host, () => {
      probe.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  });
}

async function waitForRuntimeReady(
  port: number,
  pageId: string,
  timeoutMs = 5000,
): Promise<void> {
  const start = Date.now();
  let lastError: unknown = null;

  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/health`, {
        signal: AbortSignal.timeout(500),
      });
      if (response.ok) {
        const health = (await response.json()) as {
          ok?: boolean;
          pageId?: string;
        };
        if (health.ok === true && health.pageId === pageId) {
          return;
        }
        lastError = new Error("runtime health mismatch");
      } else {
        lastError = new Error(`health returned ${response.status}`);
      }
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Runtime health check timed out");
}

function resolveRenderServeBin(): string | null {
  const override = process.env.AGENTSTAGE_RENDER_SERVE_BIN;
  if (override) {
    return override;
  }

  try {
    const serveModulePath = require.resolve("@agentstage/render/serve");
    const candidate = join(dirname(serveModulePath), "serve-cli.js");
    if (existsSync(candidate)) {
      return candidate;
    }
  } catch {
    // ignore resolution failure
  }

  return null;
}

async function waitForRuntimeProcessOrReady(
  subprocess: ChildProcess,
  ready: Promise<void>,
): Promise<void> {
  let onError: ((error: Error) => void) | null = null;
  let onExit: ((code: number | null, signal: NodeJS.Signals | null) => void) | null = null;
  const exited = new Promise<void>((_, reject) => {
    onError = (error) => {
      reject(error);
    };
    onExit = (code, signal) => {
      const detail = code !== null ? `code ${code}` : `signal ${signal ?? "unknown"}`;
      reject(new Error(`Runtime process exited before becoming ready (${detail})`));
    };
    subprocess.once("error", onError);
    subprocess.once("exit", onExit);
  });

  try {
    await Promise.race([ready, exited]);
  } finally {
    if (onError) {
      subprocess.off("error", onError);
    }
    if (onExit) {
      subprocess.off("exit", onExit);
    }
  }
}

export const serveCommand = new Command("serve")
  .description("Serve a single page runtime (Bun required)")
  .argument("<pageId>", "Page id to serve")
  .option("-p, --port <port>", "Port to run the server on", "3000")
  .option("--host <host>", "Host to bind", "0.0.0.0")
  .option("-t, --tunnel", "Expose server to internet via Cloudflare Tunnel", false)
  .option("--open", "Open browser automatically", false)
  .action(async (pageId: string, options) => {
    if (!isInitialized()) {
      consola.error("Project not initialized. Please run `agentstage init` first.");
      process.exit(1);
    }

    if (!/^[a-z0-9-]+$/.test(pageId)) {
      consola.error("Invalid pageId. Allowed: lowercase letters, numbers, hyphen");
      process.exit(1);
    }

    const workspaceDir = await getWorkspaceDir();
    const port = Number.parseInt(String(options.port), 10);
    const host = String(options.host || "0.0.0.0");

    if (!Number.isFinite(port) || port <= 0 || port > 65535) {
      consola.error(`Invalid port: ${options.port}`);
      process.exit(1);
    }

    const pageUiPath = join(workspaceDir, "pages", pageId, "ui.json");
    if (!existsSync(pageUiPath)) {
      consola.error(`Page "${pageId}" not found: ${pageUiPath}`);
      process.exit(1);
    }

    try {
      await execa("bun", ["--version"], { stdio: "pipe" });
    } catch {
      consola.error("Bun is required but not found.");
      consola.info("Install Bun: https://bun.sh/docs/installation");
      process.exit(1);
    }

    const serveBin = resolveRenderServeBin();
    if (!serveBin) {
      consola.error("Cannot resolve @agentstage/render serve runtime entry.");
      process.exit(1);
    }

    const existingConfig = await readRuntimeConfig();
    if (existingConfig) {
      try {
        process.kill(existingConfig.pid, 0);
        consola.warn(
          `Runtime is already running (PID: ${existingConfig.pid}, Port: ${existingConfig.port})`,
        );
        console.log(`  Web:    ${c.cyan(`http://localhost:${existingConfig.port}`)}`);
        if (existingConfig.tunnelUrl) {
          console.log(`  Public: ${c.cyan(c.underline(existingConfig.tunnelUrl))}`);
        }
        console.log(`  Bridge: ${c.cyan(`ws://localhost:${existingConfig.port}/_bridge`)}`);
        return;
      } catch {
        // stale runtime config
      }
    }
    await ensurePortAvailable(port, host);

    let tunnelUrl: string | undefined;
    if (options.tunnel) {
      const canTunnel = await canStartTunnel();
      if (!canTunnel) {
        const info = await checkCloudflared();
        printInstallInstructions(info);
        consola.error("Cannot start with --tunnel: cloudflared not installed");
        process.exit(1);
      }
    }

    const s = p.spinner();
    s.start(`Starting page runtime (${pageId})...`);

    try {
      const subprocess = spawn(
        "bun",
        [
          serveBin,
          "--workspace",
          workspaceDir,
          "--page",
          pageId,
          "--port",
          String(port),
          "--host",
          host,
        ],
        {
          cwd: workspaceDir,
          detached: true,
          stdio: "ignore",
        },
      );

      if (!subprocess.pid) {
        throw new Error("Failed to start runtime process");
      }
      subprocess.unref();

      if (options.tunnel) {
        s.message("Starting Cloudflare Tunnel...");
        const tunnel = await startTunnel(port);
        tunnelUrl = tunnel.url;
      }

      await waitForRuntimeProcessOrReady(
        subprocess,
        waitForRuntimeReady(port, pageId),
      );

      const config: RuntimeConfig = {
        pid: subprocess.pid,
        port,
        startedAt: new Date().toISOString(),
        tunnelUrl,
      };
      await saveRuntimeConfig(config);

      s.stop(`Runtime started (${pageId})`);
      console.log();
      consola.success("Agentstage runtime is running");
      console.log(`  Page:   ${c.cyan(pageId)}`);
      console.log(`  Web:    ${c.cyan(`http://localhost:${port}`)}`);
      if (tunnelUrl) {
        printTunnelInfo(tunnelUrl);
      }
      console.log(`  Bridge: ${c.cyan(`ws://localhost:${port}/_bridge`)}`);
      console.log(`  Workspace: ${c.gray(workspaceDir)}`);
      console.log();

      if (options.open) {
        const openUrl = tunnelUrl || `http://localhost:${port}`;
        try {
          await execa("open", [openUrl]);
        } catch {
          // ignore open errors
        }
      }
    } catch (error) {
      s.stop("Failed to start runtime");
      const message =
        error instanceof Error ? error.message : "Unknown error";
      consola.error(message);
      process.exit(1);
    }
  });
