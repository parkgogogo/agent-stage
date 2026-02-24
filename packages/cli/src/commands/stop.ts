import { Command } from "commander";
import consola from "consola";
import c from "picocolors";
import {
  readRuntimeConfig,
  removeRuntimeConfig,
  isInitialized,
} from "../utils/paths.js";

export const stopCommand = new Command("stop")
  .description("Stop the Agentstage Runtime")
  .action(async () => {
    if (!isInitialized()) {
      consola.error("Project not initialized. Please run `agentstage init` first.");
      process.exit(1);
    }

    const config = await readRuntimeConfig();
    if (!config) {
      consola.warn("Runtime is not running");
      return;
    }

    try {
      process.kill(config.pid, 0);
      process.kill(config.pid, "SIGTERM");

      await new Promise((resolve) => setTimeout(resolve, 1000));

      try {
        process.kill(config.pid, 0);
        process.kill(config.pid, "SIGKILL");
      } catch {
        // process already stopped
      }

      await removeRuntimeConfig();

      consola.success("Runtime stopped");
      console.log(`  PID: ${c.gray(config.pid)}`);
      console.log(`  Port: ${c.gray(config.port)}`);
      if (config.tunnelUrl) {
        console.log(`  Tunnel: ${c.gray(config.tunnelUrl)}`);
      }
    } catch {
      await removeRuntimeConfig();
      consola.info("Runtime was not running (stale config cleaned up)");
    }
  });
