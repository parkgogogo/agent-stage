import { Command } from 'commander';
import consola from 'consola';
import c from 'picocolors';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'pathe';
import { getWorkspaceDir, isInitialized, readRuntimeConfig } from '../../utils/paths.js';

export const pageAddCommand = new Command('add')
  .description('Add a new page with json-render UI')
  .argument('<name>', 'Page name (e.g., counter, about)')
  .action(async (name) => {
    // 检查是否已初始化
    if (!isInitialized()) {
      consola.error('Project not initialized. Please run `agentstage dev init` first.');
      process.exit(1);
    }

    if (!/^[a-z0-9-]+$/.test(name)) {
      consola.error('Page name must be lowercase letters, numbers, and hyphens');
      process.exit(1);
    }

    try {
      const workspaceDir = await getWorkspaceDir();
      const config = await readRuntimeConfig();
      const routesDir = join(workspaceDir, 'src', 'routes');
      const pagesDir = join(workspaceDir, 'src', 'pages', name);
      const pageFile = join(routesDir, `${name}.tsx`);

      // 确保目录存在
      await mkdir(routesDir, { recursive: true });
      await mkdir(pagesDir, { recursive: true });

      if (existsSync(pageFile)) {
        consola.error(`Page "${name}" already exists at src/routes/${name}.tsx`);
        process.exit(1);
      }

      // 生成 .tsx 路由文件（简化版）
      const pageContent = generateTsxContent(name);

      // 生成默认 ui.json
      const uiContent = generateUiJson(name);

      // 生成默认 store.json
      const storeContent = generateStoreJson(name);

      // 写入文件
      await writeFile(pageFile, pageContent);
      await writeFile(join(pagesDir, 'ui.json'), JSON.stringify(uiContent, null, 2));
      await writeFile(join(pagesDir, 'store.json'), JSON.stringify(storeContent, null, 2));

      consola.success(`Page "${name}" created`);
      console.log(`  Route:    ${c.cyan(`src/routes/${name}.tsx`)}`);
      console.log(`  UI:       ${c.cyan(`src/pages/${name}/ui.json`)}`);
      console.log(`  Store:    ${c.cyan(`src/pages/${name}/store.json`)}`);
      const port = config?.port || 3000;
      console.log(`  URL:      ${c.cyan(`http://localhost:${port}/${name}`)}`);
      console.log();
      console.log(c.dim('Next steps:'));
      console.log(`  1. Edit ${c.cyan(`src/pages/${name}/ui.json`)} to customize UI`);
      console.log(`  2. Visit ${c.cyan(`http://localhost:${port}/${name}`)} to see the page`);
      console.log(`  3. Use ${c.cyan(`agentstage run set-state ${name} '{...}' --live`)} to update state`);

    } catch (error: any) {
      consola.error('Failed to create page:', error.message);
      process.exit(1);
    }
  });

function generateTsxContent(name: string): string {
  const pascalName = toPascalCase(name);

  return `import { createFileRoute } from '@tanstack/react-router'
import { useMemo } from 'react'
import { PageRenderer } from '../components/PageRenderer'
import { createPageBridge } from '../lib/bridge'

export const Route = createFileRoute('/${name}')({
  component: ${pascalName}Page,
})

function ${pascalName}Page() {
  const bridge = useMemo(() => createPageBridge({
    pageId: '${name}',
  }), [])

  return <PageRenderer pageId="${name}" bridge={bridge} />
}
`;
}

function generateUiJson(name: string): Record<string, unknown> {
  const titleName = toTitleCase(name);

  return {
    root: 'main',
    elements: {
      main: {
        type: 'Stack',
        props: {
          direction: 'vertical',
          gap: 'md',
          align: 'center',
        },
        children: ['header', 'card'],
      },
      header: {
        type: 'Stack',
        props: {
          direction: 'vertical',
          gap: 'sm',
          align: 'center',
        },
        children: ['title', 'description'],
      },
      title: {
        type: 'Heading',
        props: {
          text: titleName,
          level: 'h1',
        },
      },
      description: {
        type: 'Text',
        props: {
          text: 'This page is rendered with json-render and connected to Agentstage Bridge.',
          variant: 'muted',
        },
      },
      card: {
        type: 'Card',
        props: {
          title: 'Welcome',
          description: 'Edit ui.json to customize this page',
        },
        children: ['content'],
      },
      content: {
        type: 'Stack',
        props: {
          direction: 'vertical',
          gap: 'sm',
          align: 'center',
        },
        children: ['hint'],
      },
      hint: {
        type: 'Text',
        props: {
          text: 'State is persisted to store.json and synced via bridge.',
          variant: 'caption',
        },
      },
    },
  };
}

function generateStoreJson(name: string): Record<string, unknown> {
  return {
    state: {},
    version: 1,
    updatedAt: new Date().toISOString(),
    pageId: name,
  };
}

function toPascalCase(str: string): string {
  return str.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
}

function toTitleCase(str: string): string {
  return str.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
