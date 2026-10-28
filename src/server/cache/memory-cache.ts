import "server-only";
import type { User } from "@supabase/supabase-js";
import type { FlowRow, MemberRole, Profile, Workspace } from "@/server/db/schema";

interface TtlEntry<V> {
  value: V;
  expiresAt: number;
}

class BoundedTtlCache<V> {
  private map = new Map<string, TtlEntry<V>>();

  constructor(private readonly maxEntries: number) {}

  get(key: string): V | null {
    const entry = this.map.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.map.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key: string, value: V, ttlMs: number) {
    if (ttlMs <= 0) return;
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.maxEntries) {
      const oldest = this.map.keys().next().value;
      if (oldest !== undefined) this.map.delete(oldest);
    }
    this.map.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  delete(key: string) {
    this.map.delete(key);
  }

  deleteMatching(predicate: (key: string, value: V) => boolean) {
    for (const [k, v] of this.map.entries()) {
      if (predicate(k, v.value)) {
        this.map.delete(k);
      }
    }
  }
}

export interface CachedWorkspaceData {
  profile: Profile | null;
  workspaces: (Workspace & { role: MemberRole })[];
}

export interface CachedFlowCard {
  id: string;
  title: string;
  description: string | null;
  kind: "sop" | "journey" | "architect";
  status: "draft" | "published" | "archived";
  updatedAt: Date;
  shareEnabled: boolean;
}

interface GlobalServerCaches {
  verifiedTokens: BoundedTtlCache<User>;
  wsContexts: BoundedTtlCache<CachedWorkspaceData>;
  wsFlows: BoundedTtlCache<CachedFlowCard[]>;
  flowDocs: BoundedTtlCache<FlowRow>;
}

const g = globalThis as unknown as { __zfServerCaches?: GlobalServerCaches };

function caches(): GlobalServerCaches {
  if (!g.__zfServerCaches) {
    g.__zfServerCaches = {
      verifiedTokens: new BoundedTtlCache<User>(2000),
      wsContexts: new BoundedTtlCache<CachedWorkspaceData>(1000),
      wsFlows: new BoundedTtlCache<CachedFlowCard[]>(1000),
      flowDocs: new BoundedTtlCache<FlowRow>(400),
    };
  }
  return g.__zfServerCaches;
}

export const verifiedTokenCache = {
  get: (hash: string) => caches().verifiedTokens.get(hash),
  set: (hash: string, user: User, ttlMs: number) => caches().verifiedTokens.set(hash, user, ttlMs),
  evictUser: (userId: string) => caches().verifiedTokens.deleteMatching((_, u) => u.id === userId),
};

export const wsContextMemCache = {
  get: (userId: string) => caches().wsContexts.get(userId),
  set: (userId: string, data: CachedWorkspaceData, ttlMs = 45_000) =>
    caches().wsContexts.set(userId, data, ttlMs),
  delete: (userId: string) => caches().wsContexts.delete(userId),
};

export const wsFlowsMemCache = {
  get: (workspaceId: string) => caches().wsFlows.get(workspaceId),
  set: (workspaceId: string, rows: CachedFlowCard[], ttlMs = 45_000) =>
    caches().wsFlows.set(workspaceId, rows, ttlMs),
  delete: (workspaceId: string) => caches().wsFlows.delete(workspaceId),
};

export const flowDocMemCache = {
  get: (flowId: string) => caches().flowDocs.get(flowId),
  set: (flowId: string, row: FlowRow, ttlMs = 45_000) =>
    caches().flowDocs.set(flowId, row, ttlMs),
  delete: (flowId: string) => caches().flowDocs.delete(flowId),
};

