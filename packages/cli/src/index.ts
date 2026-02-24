#!/usr/bin/env node
import { Command } from 'commander';
import consola from 'consola';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'pathe';

// Read version from package.json
const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));

import { initCommand } from './commands/init.js';
import { stopCommand } from './commands/stop.js';
import { statusCommand } from './commands/status.js';
import { pageCommand } from './commands/page/index.js';
import { runCommand } from './commands/run/index.js';
import { guideCommand } from './commands/guide.js';
import { cleanupCommand } from './commands/cleanup.js';
import { componentsCommand } from './commands/components.js';
import { doctorCommand } from './commands/doctor.js';
import { verifyCommand } from './commands/verify.js';
import { serveCommand } from './commands/serve.js';

const program = new Command();

program
  .name('agentstage')
  .description('Agent UI Stage CLI - Create interactive UI for AI agents')
  .version(pkg.version);

// Register commands
program.addCommand(initCommand);  // init
program.addCommand(serveCommand);    // serve <pageId>
program.addCommand(stopCommand);  // stop
program.addCommand(statusCommand); // status
program.addCommand(pageCommand);     // page add/rm/ls/manifest
program.addCommand(runCommand);      // run get-state/set-state/exec/inspect/watch
program.addCommand(guideCommand);    // guide
program.addCommand(cleanupCommand);  // cleanup
program.addCommand(componentsCommand); // components
program.addCommand(doctorCommand);   // doctor
program.addCommand(verifyCommand);   // verify

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
