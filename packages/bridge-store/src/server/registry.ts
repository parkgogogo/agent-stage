import type WebSocket from "ws";
import type { JsonRpcId } from "../shared/protocol.js";
import type { PageId, StageMeta, StoreId, StoreKey } from "../shared/types.js";

export type HostConn = {
  ws: WebSocket;
  storeId: StoreId;
  pageId: PageId;
  storeKey?: StoreKey;
  meta: StageMeta | null;
  state: unknown;
  version: number;
};

export type SubscriberConn = { ws: WebSocket };

export class BridgeRegistry {
  hosts = new Map<StoreId, HostConn>();
  subscribers = new Map<StoreId, Set<SubscriberConn>>();

  // Indexes
  pageToStores = new Map<PageId, Set<StoreId>>();
  pageToStoreKeys = new Map<PageId, Map<StoreKey, StoreId>>();

  // Forwards: bridge request id -> { clientWs, clientId }
  forwardSeq = 0;
  pendingForwards = new Map<number, { clientWs: WebSocket; clientId: JsonRpcId }>();

  setHost(storeId: StoreId, host: HostConn) {
    // If replacing an existing host, remove old indexes first
    const prev = this.hosts.get(storeId);
    if (prev) this.unindexHost(prev);

    this.hosts.set(storeId, host);
    this.indexHost(host);
  }

  private indexHost(host: HostConn) {
    const set = this.pageToStores.get(host.pageId) ?? new Set<StoreId>();
    set.add(host.storeId);
    this.pageToStores.set(host.pageId, set);

    if (host.storeKey) {
      const map = this.pageToStoreKeys.get(host.pageId) ?? new Map<StoreKey, StoreId>();
      map.set(host.storeKey, host.storeId);
      this.pageToStoreKeys.set(host.pageId, map);
    }
  }

  private unindexHost(host: HostConn) {
    const set = this.pageToStores.get(host.pageId);
    if (set) {
      set.delete(host.storeId);
      if (set.size === 0) this.pageToStores.delete(host.pageId);
    }

    if (host.storeKey) {
      const map = this.pageToStoreKeys.get(host.pageId);
      if (map) {
        const cur = map.get(host.storeKey);
        if (cur === host.storeId) map.delete(host.storeKey);
        if (map.size === 0) this.pageToStoreKeys.delete(host.pageId);
      }
    }
  }

  getHost(storeId: StoreId) {
    return this.hosts.get(storeId);
  }

  removeWs(ws: WebSocket) {
    for (const [storeId, host] of this.hosts.entries()) {
      if (host.ws === ws) {
        this.unindexHost(host);
        this.hosts.delete(storeId);
      }
    }

    for (const subs of this.subscribers.values()) {
      for (const s of subs) {
        if (s.ws === ws) subs.delete(s);
      }
    }

    for (const [fid, pending] of this.pendingForwards.entries()) {
      if (pending.clientWs === ws) this.pendingForwards.delete(fid);
    }
  }

  addSubscriber(storeId: StoreId, ws: WebSocket) {
    const set = this.subscribers.get(storeId) ?? new Set<SubscriberConn>();
    set.add({ ws });
    this.subscribers.set(storeId, set);
  }
}
