#!/usr/bin/env node
import { Command } from 'commander';
import consola from 'consola';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'pathe';

// Read version from package.json
const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));

import { devCommand } from './commands/dev/index.js';
import { pageCommand } from './commands/page/index.js';
import { runCommand } from './commands/run/index.js';
import { guideCommand } from './commands/guide.js';
import { cleanupCommand } from './commands/cleanup.js';
import { componentsCommand } from './commands/components.js';
import { doctorCommand } from './commands/doctor.js';
import { execCommand } from './commands/exec.js';
import { initCommand } from './commands/init.js';
import { inspectCommand } from './commands/inspect.js';
import { lsCommand } from './commands/ls.js';
import { restartCommand } from './commands/restart.js';
import { rmPageCommand } from './commands/rm-page.js';
import { startCommand } from './commands/start.js';
import { statusCommand } from './commands/status.js';
import { stopCommand } from './commands/stop.js';
import { verifyCommand } from './commands/verify.js';
import { watchCommand } from './commands/watch.js';

const program = new Command();

program
  .name('agentstage')
  .description('Agent UI Stage CLI - Create interactive UI for AI agents')
  .version(pkg.version);

// Register all commands
program.addCommand(devCommand);
program.addCommand(pageCommand);
program.addCommand(runCommand);
program.addCommand(guideCommand);
program.addCommand(cleanupCommand);
program.addCommand(componentsCommand);
program.addCommand(doctorCommand);
program.addCommand(execCommand);
program.addCommand(initCommand);
program.addCommand(inspectCommand);
program.addCommand(lsCommand);
program.addCommand(restartCommand);
program.addCommand(rmPageCommand);
program.addCommand(startCommand);
program.addCommand(statusCommand);
program.addCommand(stopCommand);
program.addCommand(verifyCommand);
program.addCommand(watchCommand);

// Error handling
program.exitOverride();

try {
  await program.parseAsync(process.argv);
} catch (error: any) {
  if (error.code !== 'commander.help' && error.code !== 'commander.version') {
    consola.error(error.message || 'Unknown error');
    process.exit(1);
  }
}
