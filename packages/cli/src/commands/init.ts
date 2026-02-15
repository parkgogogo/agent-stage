import { Command } from 'commander';
import * as p from '@clack/prompts';
import consola from 'consola';
import c from 'picocolors';
import { mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { resolve, join } from 'pathe';
import { 
  getProjectTemplate, 
  getPageTemplate, 
  getMetaTemplate,
  getViteConfigTemplate,
  getTsConfigTemplate,
  getIndexHtmlTemplate,
  getMainTsxTemplate,
  getRouterTsxTemplate 
} from '../templates/index.js';

export const initCommand = new Command('init')
  .description('Initialize a new Agentstage project')
  .argument('[directory]', 'Target directory', '.')
  .option('-t, --template <template>', 'Project template', 'default')
  .action(async (directory, options) => {
    const targetDir = resolve(directory);
    
    // Check if directory exists and is not empty
    if (existsSync(targetDir)) {
      const files = await readdirSafe(targetDir);
      if (files.length > 0) {
        const shouldContinue = await p.confirm({
          message: `Directory ${c.cyan(targetDir)} is not empty. Continue?`,
          initialValue: false,
        });
        
        if (p.isCancel(shouldContinue) || !shouldContinue) {
          consola.info('Cancelled');
          return;
        }
      }
    }
    
    // Get project name
    const projectName = await p.text({
      message: 'Project name?',
      placeholder: 'my-agentstage-app',
      initialValue: directory === '.' ? 'my-agentstage-app' : directory,
      validate: (value) => {
        if (!value || value.trim() === '') {
          return 'Project name is required';
        }
      },
    });
    
    if (p.isCancel(projectName)) {
      consola.info('Cancelled');
      return;
    }
    
    // Confirm package manager
    const packageManager = await p.select({
      message: 'Package manager?',
      options: [
        { value: 'pnpm', label: 'pnpm' },
        { value: 'npm', label: 'npm' },
        { value: 'yarn', label: 'yarn' },
      ],
      initialValue: 'pnpm',
    });
    
    if (p.isCancel(packageManager)) {
      consola.info('Cancelled');
      return;
    }
    
    // Create project
    const s = p.spinner();
    s.start('Creating project...');
    
    try {
      await createProject(targetDir, projectName, packageManager as string);
      s.stop('Project created successfully!');
      
      // Next steps
      console.log();
      consola.success('Next steps:');
      console.log(`  cd ${c.cyan(targetDir === process.cwd() ? '.' : directory)}`);
      console.log(`  ${c.cyan(`${packageManager} install`)}`);
      console.log(`  ${c.cyan('agentstage dev')}`);
      console.log();
      
    } catch (error: any) {
      s.stop('Failed to create project');
      consola.error(error.message);
      process.exit(1);
    }
  });

async function readdirSafe(dir: string): Promise<string[]> {
  try {
    const { readdir } = await import('fs/promises');
    return await readdir(dir);
  } catch {
    return [];
  }
}

async function createProject(
  targetDir: string, 
  projectName: string, 
  packageManager: string
): Promise<void> {
  const pmRun = packageManager === 'npm' ? 'npm run' : packageManager;
  
  // Create directories
  await mkdir(targetDir, { recursive: true });
  await mkdir(join(targetDir, 'src', 'pages'), { recursive: true });
  await mkdir(join(targetDir, 'src', 'main'), { recursive: true });
  
  // Write package.json
  await writeFile(
    join(targetDir, 'package.json'),
    getProjectTemplate(projectName, pmRun)
  );
  
  // Write vite.config.ts
  await writeFile(
    join(targetDir, 'vite.config.ts'),
    getViteConfigTemplate()
  );
  
  // Write tsconfig.json
  await writeFile(
    join(targetDir, 'tsconfig.json'),
    getTsConfigTemplate()
  );
  
  // Write index.html
  await writeFile(
    join(targetDir, 'index.html'),
    getIndexHtmlTemplate(projectName)
  );
  
  // Write main.tsx
  await writeFile(
    join(targetDir, 'src', 'main.tsx'),
    getMainTsxTemplate()
  );
  
  // Write router.tsx
  await writeFile(
    join(targetDir, 'src', 'main', 'router.tsx'),
    getRouterTsxTemplate()
  );
  
  // Write example page
  await mkdir(join(targetDir, 'src', 'pages', 'demo-counter'), { recursive: true });
  await writeFile(
    join(targetDir, 'src', 'pages', 'demo-counter', 'page.tsx'),
    getPageTemplate('demo-counter', 'Demo Counter')
  );
  await writeFile(
    join(targetDir, 'src', 'pages', 'demo-counter', 'meta.json'),
    getMetaTemplate('demo-counter', 'Demo Counter')
  );
  
  // Write README
  await writeFile(
    join(targetDir, 'README.md'),
    `# ${projectName}\n\nCreated with Agentstage CLI.\n\n## Development\n\n\`\`\`bash\n${pmRun} dev\n\`\`\`\n\n## Create new page\n\n\`\`\`bash\nagentstage page:new my-page\n\`\`\`\n`
  );
}
