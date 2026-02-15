import { Command } from 'commander';
import * as p from '@clack/prompts';
import consola from 'consola';
import c from 'picocolors';
import { execa } from 'execa';
import { existsSync } from 'fs';
import { resolve, join } from 'pathe';

export const devCommand = new Command('dev')
  .description('Start development server (Vite + Bridge Gateway)')
  .option('-p, --port <port>', 'Vite port', '3000')
  .option('--bridge-port <port>', 'Bridge Gateway port', '8787')
  .action(async (options) => {
    const cwd = process.cwd();
    
    // Check if we're in an agentstage project
    if (!isAgentstageProject(cwd)) {
      consola.error('Not an Agentstage project. Run `agentstage init` first.');
      process.exit(1);
    }
    
    consola.info(`Starting development server...`);
    consola.info(`  Vite: ${c.cyan(`http://localhost:${options.port}`)}`);
    consola.info(`  Bridge: ${c.cyan(`ws://localhost:${options.bridgePort}/_bridge`)}`);
    console.log();
    
    // Start Bridge Gateway in background (if we had a standalone server)
    // For now, gateway is part of the app
    
    // Start Vite
    try {
      const vite = execa('npx', ['vite', '--port', options.port], {
        cwd,
        stdio: 'inherit',
        env: {
          ...process.env,
          BRIDGE_PORT: options.bridgePort,
        },
      });
      
      await vite;
    } catch (error: any) {
      consola.error('Failed to start dev server:', error.message);
      process.exit(1);
    }
  });

function isAgentstageProject(dir: string): boolean {
  return existsSync(join(dir, 'package.json')) && existsSync(join(dir, 'vite.config.ts'));
}
