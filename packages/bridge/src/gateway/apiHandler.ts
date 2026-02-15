import type { Gateway } from './types.js';

export function createBridgeApiHandler(gateway: Gateway) {
  return {
    GET: async ({ request }: { request: Request }) => {
      const url = new URL(request.url);
      const path = url.pathname.replace('/api/bridge', '').split('/').filter(Boolean);
      
      if (path.length === 1 && path[0] === 'stores') {
        return Response.json({ stores: gateway.listStores() });
      }
      
      if (path.length === 2 && path[0] === 'stores') {
        const storeId = path[1];
        const store = gateway.getStore(storeId);
        if (!store) {
          return new Response(JSON.stringify({ error: 'Store not found' }), { 
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        return Response.json({
          id: store.id,
          pageId: store.pageId,
          storeKey: store.storeKey,
          description: store.description,
          version: store.version,
          connectedAt: store.connectedAt,
          lastActivity: store.lastActivity,
        });
      }
      
      if (path.length === 3 && path[0] === 'stores' && path[2] === 'state') {
        const storeId = path[1];
        const state = gateway.getState(storeId);
        if (!state) {
          return new Response(JSON.stringify({ error: 'Store not found' }), { 
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        return Response.json(state);
      }
      
      if (path.length === 3 && path[0] === 'pages' && path[2] === 'stores') {
        const pageId = path[1];
        const stores = gateway.stores;
        const pageStores = Array.from(stores.values())
          .filter(s => s.pageId === pageId)
          .map(s => ({
            id: s.id,
            storeKey: s.storeKey,
            version: s.version,
            connectedAt: s.connectedAt,
          }));
        return Response.json({ stores: pageStores });
      }
      
      return new Response(JSON.stringify({ error: 'Not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    },
    
    POST: async ({ request }: { request: Request }) => {
      const url = new URL(request.url);
      const path = url.pathname.replace('/api/bridge', '').split('/').filter(Boolean);
      
      if (path.length === 3 && path[0] === 'stores' && path[2] === 'state') {
        const storeId = path[1];
        const body = await request.json();
        
        try {
          await gateway.setState(storeId, body.state, { 
            expectedVersion: body.expectedVersion 
          });
          return Response.json({ ok: true });
        } catch (err) {
          return new Response(
            JSON.stringify({ error: err instanceof Error ? err.message : 'Failed to set state' }), 
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
      
      if (path.length === 3 && path[0] === 'stores' && path[2] === 'dispatch') {
        const storeId = path[1];
        const body = await request.json();
        
        try {
          await gateway.dispatch(storeId, body.action);
          return Response.json({ ok: true });
        } catch (err) {
          return new Response(
            JSON.stringify({ error: err instanceof Error ? err.message : 'Failed to dispatch' }), 
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
      
      return new Response(JSON.stringify({ error: 'Not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    },
  };
}
