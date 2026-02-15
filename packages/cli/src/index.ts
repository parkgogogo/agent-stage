#!/usr/bin/env node
import { Command } from 'commander';
import consola from 'consola';
import { initCommand } from './commands/init.js';
import { devCommand } from './commands/dev.js';
import { pageNewCommand } from './commands/page-new.js';
import { bridgeCommand } from './commands/bridge.js';

const program = new Command();

program
  .name('agentstage')
  .description('Agent UI Stage CLI - Create interactive UI for AI agents')
  .version('0.1.0')
  .configureOutput({
    outputError: (str, write) => write(`Error: ${str}`),
  });

// Register commands
program.addCommand(initCommand);
program.addCommand(devCommand);
program.addCommand(pageNewCommand);
program.addCommand(bridgeCommand);

// Global error handler
program.exitOverride();

try {
  await program.parseAsync(process.argv);
} catch (error: any) {
  if (error.code !== 'commander.help' && error.code !== 'commander.version') {
    consola.error(error.message || 'Unknown error');
    process.exit(1);
  }
}
