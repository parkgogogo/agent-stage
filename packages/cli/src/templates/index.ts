export function getProjectTemplate(projectName: string, pmRun: string): string {
  return JSON.stringify(
    {
      name: projectName,
      private: true,
      version: '0.0.0',
      type: 'module',
      scripts: {
        dev: 'vite',
        build: 'vite build',
        preview: 'vite preview',
        typecheck: 'tsc --noEmit',
      },
      dependencies: {
        '@agentstage/bridge': 'workspace:*',
        '@tanstack/react-router': '^1.160.0',
        react: '^19.0.0',
        'react-dom': '^19.0.0',
        zod: '^3.23.0',
        zustand: '^4.5.0',
      },
      devDependencies: {
        '@types/react': '^19.0.0',
        '@types/react-dom': '^19.0.0',
        '@vitejs/plugin-react': '^4.3.0',
        typescript: '^5.6.0',
        vite: '^6.0.0',
      },
    },
    null,
    2
  );
}

export function getViteConfigTemplate(): string {
  return `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
  },
});
`;
}

export function getTsConfigTemplate(): string {
  return JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2022',
        lib: ['ES2022', 'DOM', 'DOM.Iterable'],
        module: 'ESNext',
        skipLibCheck: true,
        moduleResolution: 'bundler',
        allowImportingTsExtensions: true,
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        jsx: 'react-jsx',
        strict: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        noFallthroughCasesInSwitch: true,
        baseUrl: '.',
        paths: {
          '@/*': ['src/*'],
        },
      },
      include: ['src/**/*'],
      references: [{ path: './tsconfig.node.json' }],
    },
    null,
    2
  );
}

export function getTsConfigNodeTemplate(): string {
  return JSON.stringify(
    {
      compilerOptions: {
        composite: true,
        skipLibCheck: true,
        module: 'ESNext',
        moduleResolution: 'bundler',
        allowSyntheticDefaultImports: true,
      },
      include: ['vite.config.ts'],
    },
    null,
    2
  );
}

export function getIndexHtmlTemplate(projectName: string): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
}

export function getMainTsxTemplate(): string {
  return `import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { router } from './main/router';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
`;
}

export function getRouterTsxTemplate(): string {
  return `import { createRootRoute, createRoute, createRouter, Outlet } from '@tanstack/react-router';
import React from 'react';

// Page modules will be loaded dynamically
const pageModules = import.meta.glob('./pages/*/page.tsx');

const rootRoute = createRootRoute({
  component: function Root() {
    return (
      <div className="min-h-screen bg-background">
        <Outlet />
      </div>
    );
  },
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: function Index() {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Agentstage</h1>
        <p className="mt-4 text-muted-foreground">
          Open /p/&lt;pageId&gt; to view pages
        </p>
        <div className="mt-8">
          <a href="/p/demo-counter" className="text-blue-500 hover:underline">
            View Demo Counter →
          </a>
        </div>
      </div>
    );
  },
});

const pageRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/p/\$pageId',
  component: function PageRoute() {
    const { pageId } = pageRoute.useParams();
    const [Component, setComponent] = React.useState<React.ComponentType | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
      const loader = pageModules[\`./pages/\${pageId}/page.tsx\`];
      if (!loader) {
        setError(\`Page not found: \${pageId}\`);
        return;
      }

      loader()
        .then((mod: any) => setComponent(() => mod.default))
        .catch((e: any) => setError(String(e?.message ?? e)));
    }, [pageId]);

    if (error) return <div className="p-8 text-red-500">{error}</div>;
    if (!Component) return <div className="p-8">Loading...</div>;
    return <Component />;
  },
});

const routeTree = rootRoute.addChildren([indexRoute, pageRoute]);

export const router = createRouter({ routeTree });

// Type augmentation for TanStack Router
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
`;
}

export function getPageTemplate(pageId: string, title: string): string {
  return `import React from 'react';
import { useStore } from 'zustand';
import { z } from 'zod';
import { createBridgeStore } from '@agentstage/bridge/browser';

interface State {
  count: number;
  dispatch: (action: { type: string; payload?: unknown }) => void;
}

const stateSchema = z.object({
  count: z.number().describe('Counter value'),
});

const bridge = createBridgeStore<State, {
  increment: { payload: { by: number } };
}>({
  pageId: '${pageId}',
  storeKey: 'main',
  description: {
    schema: stateSchema,
    actions: {
      increment: {
        description: 'Increment counter by N',
        payload: z.object({ by: z.number() }),
      },
    },
  },
  createState: (set, get) => ({
    count: 0,
    dispatch: (action) => {
      if (action.type === 'increment') {
        const { by = 1 } = action.payload as { by?: number };
        set({ count: get().count + by });
      }
    },
  }),
});

const store = bridge.store;

export default function ${toPascalCase(pageId)}Page() {
  const count = useStore(store, (s) => s.count);

  React.useEffect(() => {
    let closed = false;
    let disconnect = () => {};

    bridge.connect().then((conn) => {
      if (closed) {
        conn.disconnect();
        return;
      }
      disconnect = conn.disconnect;
    });

    return () => {
      closed = true;
      disconnect();
    };
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">${title}</h1>
      
      <div className="mt-8">
        <p className="text-lg">Count: <span className="font-mono text-2xl">{count}</span></p>
        
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => store.getState().dispatch({ type: 'increment', payload: { by: 1 } })}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            +1
          </button>
          <button
            onClick={() => store.getState().dispatch({ type: 'increment', payload: { by: 5 } })}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            +5
          </button>
        </div>
      </div>
      
      <p className="mt-8 text-sm text-gray-500">
        Use Agentstage CLI to control this page: agentstage bridge:list
      </p>
    </div>
  );
}

function toPascalCase(str: string): string {
  return str.replace(/[-_](\\w)/g, (_, c) => c.toUpperCase()).replace(/^\\w/, (c) => c.toUpperCase());
}
`;
}

function toPascalCase(str: string): string {
  return str
    .replace(/[-_](\w)/g, (_, c) => c.toUpperCase())
    .replace(/^\w/, (c) => c.toUpperCase());
}

export function getMetaTemplate(pageId: string, title: string): string {
  return JSON.stringify(
    {
      id: pageId,
      title,
      description: `Page: ${title}`,
    },
    null,
    2
  );
}
