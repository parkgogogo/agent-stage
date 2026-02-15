import { Command } from 'commander';
import * as p from '@clack/prompts';
import consola from 'consola';
import c from 'picocolors';
import { mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { resolve, join } from 'pathe';
import { getPageTemplate, getMetaTemplate } from '../templates/index.js';

export const pageNewCommand = new Command('page:new')
  .description('Create a new page')
  .argument('<name>', 'Page ID (e.g., counter, user-profile)')
  .option('-t, --title <title>', 'Page title')
  .action(async (name, options) => {
    const cwd = process.cwd();
    
    // Validate page name
    if (!/^[a-z0-9-]+$/.test(name)) {
      consola.error('Page name must be lowercase letters, numbers, and hyphens only');
      process.exit(1);
    }
    
    // Check if we're in an agentstage project
    const pagesDir = join(cwd, 'src', 'pages');
    if (!existsSync(pagesDir)) {
      consola.error('Not an Agentstage project. Run `agentstage init` first.');
      process.exit(1);
    }
    
    const pageDir = join(pagesDir, name);
    
    // Check if page already exists
    if (existsSync(pageDir)) {
      const overwrite = await p.confirm({
        message: `Page ${c.cyan(name)} already exists. Overwrite?`,
        initialValue: false,
      });
      
      if (p.isCancel(overwrite) || !overwrite) {
        consola.info('Cancelled');
        return;
      }
    }
    
    // Get title
    const title = options.title || await p.text({
      message: 'Page title?',
      placeholder: toTitleCase(name),
      initialValue: toTitleCase(name),
    });
    
    if (p.isCancel(title)) {
      consola.info('Cancelled');
      return;
    }
    
    // Create page
    const s = p.spinner();
    s.start('Creating page...');
    
    try {
      await mkdir(pageDir, { recursive: true });
      
      await writeFile(
        join(pageDir, 'page.tsx'),
        getPageTemplate(name, title as string)
      );
      
      await writeFile(
        join(pageDir, 'meta.json'),
        getMetaTemplate(name, title as string)
      );
      
      s.stop('Page created successfully!');
      
      console.log();
      consola.success(`Created: ${c.cyan(join('src/pages', name))}`);
      console.log();
      consola.info('Next steps:');
      console.log(`  1. Edit ${c.cyan(`src/pages/${name}/page.tsx`)}`);
      console.log(`  2. Run ${c.cyan('agentstage dev')}`);
      console.log(`  3. Open ${c.cyan(`http://localhost:3000/p/${name}`)}`);
      console.log();
      
    } catch (error: any) {
      s.stop('Failed to create page');
      consola.error(error.message);
      process.exit(1);
    }
  });

function toTitleCase(str: string): string {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
