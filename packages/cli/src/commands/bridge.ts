import { Command } from 'commander';
import * as p from '@clack/prompts';
import consola from 'consola';
import c from 'picocolors';
import { BridgeClient } from '@agentstage/bridge/sdk';
import type { BridgeEvent } from '@agentstage/bridge/sdk';

export const bridgeCommand = new Command('bridge')
  .description('Interact with Bridge Gateway')
  .addCommand(
    new Command('list')
      .description('List all connected stores')
      .option('-u, --url <url>', 'Gateway URL', 'ws://localhost:8787/_bridge')
      .action(async (options) => {
        const client = new BridgeClient(options.url);
        
        try {
          await client.connect();
          const stores = await client.listStores();
          
          if (stores.length === 0) {
            consola.info('No stores connected');
            return;
          }
          
          console.log();
          console.log(c.bold('Connected Stores:'));
          console.log();
          
          for (const store of stores) {
            console.log(`  ${c.cyan(store.id)}`);
            console.log(`    pageId: ${store.pageId}`);
            console.log(`    storeKey: ${store.storeKey}`);
            console.log(`    version: ${store.version}`);
            console.log();
          }
          
          client.disconnect();
        } catch (error: any) {
          consola.error('Failed to connect:', error.message);
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('watch')
      .description('Watch a store for changes')
      .argument('<storeId>', 'Store ID')
      .option('-u, --url <url>', 'Gateway URL', 'ws://localhost:8787/_bridge')
      .action(async (storeId, options) => {
        consola.info(`Watching store: ${c.cyan(storeId)}`);
        console.log();
        
        const client = new BridgeClient(options.url);
        
        client.onEvent((event: BridgeEvent) => {
          const timestamp = new Date().toISOString();
          console.log(c.gray(`[${timestamp}]`), event);
        });
        
        try {
          await client.connect();
          client.subscribe(storeId);
          
          consola.success('Connected. Press Ctrl+C to exit.');
          console.log();
          
          // Keep running
          await new Promise(() => {});
        } catch (error: any) {
          consola.error('Failed to watch:', error.message);
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('set')
      .description('Set store state')
      .argument('<storeId>', 'Store ID')
      .argument('<json>', 'State as JSON')
      .option('-u, --url <url>', 'Gateway URL', 'ws://localhost:8787/_bridge')
      .action(async (storeId, json, options) => {
        const client = new BridgeClient(options.url);
        
        try {
          const state = JSON.parse(json);
          
          await client.connect();
          await client.setState(storeId, state);
          
          consola.success('State set successfully');
          client.disconnect();
        } catch (error: any) {
          consola.error('Failed:', error.message);
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('dispatch')
      .description('Dispatch action to store')
      .argument('<storeId>', 'Store ID')
      .argument('<action>', 'Action type')
      .argument('[payload]', 'Action payload as JSON')
      .option('-u, --url <url>', 'Gateway URL', 'ws://localhost:8787/_bridge')
      .action(async (storeId, action, payload, options) => {
        const client = new BridgeClient(options.url);
        
        try {
          const actionObj = {
            type: action,
            payload: payload ? JSON.parse(payload) : undefined,
          };
          
          await client.connect();
          await client.dispatch(storeId, actionObj);
          
          consola.success('Action dispatched successfully');
          client.disconnect();
        } catch (error: any) {
          consola.error('Failed:', error.message);
          process.exit(1);
        }
      })
  );
