import { Command } from "commander";
import * as p from "@clack/prompts";
import consola from "consola";
import c from "picocolors";
import { execa } from "execa";
import { existsSync } from "fs";
import { join } from "pathe";
import {
  getWorkspaceDir,
  isInitialized,
  readRuntimeConfig,
  saveRuntimeConfig,
} from "../utils/paths.js";
import { canStartTunnel, startTunnel, printTunnelInfo } from "../utils/tunnel.js";
import { checkCloudflared, printInstallInstructions } from "../utils/cloudflared.js";

interface RuntimeConfig {
  pid: number;
  port: number;
  startedAt: string;
  tunnelUrl?: string;
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
      const subprocess = execa(
        "bunx",
        [
          "--bun",
          "agentstage-render-serve",
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

      if (options.tunnel) {
        s.message("Starting Cloudflare Tunnel...");
        const tunnel = await startTunnel(port);
        tunnelUrl = tunnel.url;
      }

      const config: RuntimeConfig = {
        pid: subprocess.pid,
        port,
        startedAt: new Date().toISOString(),
        tunnelUrl,
      };
      await saveRuntimeConfig(config);

      await new Promise((resolve) => setTimeout(resolve, 1000));

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
