import { Command } from "commander";
import * as p from "@clack/prompts";
import consola from "consola";
import c from "picocolors";
import { execa } from "execa";
import { mkdir, readdir, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { resolve, join } from "pathe";
import { homedir } from "os";
import { setWorkspaceDir } from "../utils/paths.js";
import {
  checkCloudflared,
  printInstallInstructions,
} from "../utils/cloudflared.js";

const PROJECT_NAME = "webapp";

interface MinimalWorkspacePackageJson {
  name: string;
  private: boolean;
  version: string;
  type: "module";
  dependencies: Record<string, string>;
}

const workspaceDependencies: Record<string, string> = {
  "@agentstage/render": "^0.2.2",
  "@agentstage/bridge": "^0.1.2",
  react: "^19.0.0",
  "react-dom": "^19.0.0",
  zod: "^3.23.0",
};

export const initCommand = new Command("init")
  .description("Initialize a new Agentstage runtime workspace")
  .option("-y, --yes", "Use default settings (non-interactive)", false)
  .option(
    "--skip-cloudflared-check",
    "Skip cloudflared installation check",
    false,
  )
  .action(async (options) => {
    const useDefault = options.yes;

    try {
      await execa("bun", ["--version"], { stdio: "pipe" });
    } catch {
      consola.error("Bun is required to initialize workspace.");
      consola.info("Install Bun: https://bun.sh/docs/installation");
      process.exit(1);
    }

    if (!options.skipCloudflaredCheck) {
      const cloudflaredInfo = await checkCloudflared();
      if (!cloudflaredInfo.installed) {
        printInstallInstructions(cloudflaredInfo);

        const shouldContinue = await p.confirm({
          message:
            "Continue with initialization? (You can install cloudflared later)",
          initialValue: true,
        });

        if (p.isCancel(shouldContinue) || !shouldContinue) {
          consola.info("Cancelled");
          process.exit(0);
        }
      } else {
        consola.success(
          `Cloudflare Tunnel available: ${c.dim(cloudflaredInfo.version)}`,
        );
      }
    }

    let locationMode: string;
    if (useDefault) {
      locationMode = "default";
    } else {
      const result = await p.select({
        message: "Where to store the workspace?",
        options: [
          {
            value: "default",
            label: `Default (~/.agentstage/${PROJECT_NAME})`,
            hint: "Recommended",
          },
          {
            value: "current",
            label: "Current directory (./.agentstage)",
          },
          {
            value: "custom",
            label: "Custom path",
          },
        ],
      });

      if (p.isCancel(result)) {
        consola.info("Cancelled");
        return;
      }
      locationMode = result as string;
    }

    let targetDir: string;
    switch (locationMode) {
      case "default":
        targetDir = join(homedir(), ".agentstage", PROJECT_NAME);
        break;
      case "current":
        targetDir = join(process.cwd(), ".agentstage");
        break;
      case "custom": {
        const customPath = await p.text({
          message: "Enter custom path:",
          placeholder: "/path/to/workspace",
          validate: (value) => {
            if (!value || value.trim() === "") {
              return "Path is required";
            }
          },
        });

        if (p.isCancel(customPath)) {
          consola.info("Cancelled");
          return;
        }
        targetDir = resolve(customPath);
        break;
      }
      default:
        targetDir = join(homedir(), ".agentstage", PROJECT_NAME);
    }

    if (existsSync(targetDir)) {
      const files = await readdirSafe(targetDir);
      if (files.length > 0) {
        console.log();
        consola.info("Workspace already initialized!");
        console.log(`  Location: ${c.cyan(targetDir)}`);
        console.log();
        console.log(`  cd ${c.cyan(targetDir)}`);
        console.log(`  ${c.cyan("agentstage serve <pageId>")}`);
        console.log();
        await setWorkspaceDir(targetDir);
        return;
      }
    }

    await setWorkspaceDir(targetDir);

    const s = p.spinner();
    try {
      s.start("Creating workspace structure...");
      await mkdir(join(targetDir, "pages"), { recursive: true });
      await mkdir(join(targetDir, ".agentstage"), { recursive: true });

      const packageJson: MinimalWorkspacePackageJson = {
        name: "agentstage-workspace",
        private: true,
        version: "0.0.0",
        type: "module",
        dependencies: workspaceDependencies,
      };
      await writeFile(
        join(targetDir, "package.json"),
        JSON.stringify(packageJson, null, 2),
      );
      s.stop("Workspace created");

      s.start("Installing dependencies with Bun...");
      await execa("bun", ["install"], { cwd: targetDir, stdio: "pipe" });
      s.stop("Dependencies installed");

      console.log();
      consola.success("Workspace initialized successfully");
      console.log(`  Location: ${c.cyan(targetDir)}`);
      console.log(`  Pages:    ${c.cyan("pages/<pageId>/ui.json")}`);
      console.log();
      console.log(`  cd ${c.cyan(targetDir)}`);
      console.log(`  ${c.cyan("agentstage page add counter")}`);
      console.log(`  ${c.cyan("agentstage serve counter")}`);
      console.log();
    } catch (error) {
      s.stop("Failed to initialize workspace");
      const message =
        error instanceof Error ? error.message : "Unknown initialization error";
      consola.error(message);
      process.exit(1);
    }
  });

async function readdirSafe(dir: string): Promise<string[]> {
  try {
    return await readdir(dir);
  } catch {
    return [];
  }
}
