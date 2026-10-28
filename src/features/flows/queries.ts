import "server-only";
import { cache } from "react";
import { revalidateTag, unstable_cache } from "next/cache";
import { sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import type { FlowRow } from "@/server/db/schema";
import { parseDocumentSafe } from "@/lib/validation/flow";
import { getWorkspaceContext, UUID_RE } from "@/server/auth/session";
import {
  flowDocMemCache,
  wsFlowsMemCache,
  type CachedFlowCard,
} from "@/server/cache/memory-cache";

export const sharedFlowCacheTag = (token: string) => `share-flow-${token}`;

export function invalidateSharedFlowCache(token: string | null | undefined) {
  if (!token) return;
  try {
    revalidateTag(sharedFlowCacheTag(token));
  } catch {
    // Aman diabaikan di luar konteks Next request
  }
}

export function invalidateWorkspaceFlowsCache(workspaceId: string | null | undefined) {
  if (!workspaceId) return;
  wsFlowsMemCache.delete(workspaceId);
}

export function invalidateFlowDocCache(flowId: string | null | undefined) {
  if (!flowId) return;
  flowDocMemCache.delete(flowId);
}

export function primeFlowCache(row: FlowRow) {
  flowDocMemCache.set(row.id, row);
}

export function evictPrimedFlow(flowId: string | null | undefined) {
  if (!flowId) return;
  flowDocMemCache.delete(flowId);
}

function normalizeFlowRow(raw: Record<string, any>): FlowRow {
  return {
    id: raw.id,
    workspaceId: raw.workspaceId ?? raw.workspace_id,
    title: raw.title,
    description: raw.description ?? null,
    kind: raw.kind,
    status: raw.status,
    document: raw.document,
    version: Number(raw.version ?? 1),
    shareToken: raw.shareToken ?? raw.share_token ?? null,
    shareEnabled: Boolean(raw.shareEnabled ?? raw.share_enabled),
    createdBy: raw.createdBy ?? raw.created_by ?? null,
    createdAt:
      (raw.createdAt ?? raw.created_at) instanceof Date
        ? (raw.createdAt ?? raw.created_at)
        : new Date(raw.createdAt ?? raw.created_at),
    updatedAt:
      (raw.updatedAt ?? raw.updated_at) instanceof Date
        ? (raw.updatedAt ?? raw.updated_at)
        : new Date(raw.updatedAt ?? raw.updated_at),
  };
}

export type FlowCardData = CachedFlowCard;

export const listFlows = cache(
  async (
    userId: string,
    workspaceId: string,
    opts: { status?: "draft" | "published"; limit?: number } = {},
  ): Promise<FlowCardData[]> => {
    if (!UUID_RE.test(workspaceId)) return [];

    // Verifikasi keanggotaan workspace terlebih dahulu (0ms karena getWorkspaceContext sudah di-cache)
    const { workspaces } = await getWorkspaceContext(userId);
    if (!workspaces.some((w) => w.id === workspaceId)) {
      return [];
    }

    const limit = opts.limit ?? 200;
    const isDefaultQuery = !opts.status && limit === 200;

    if (isDefaultQuery) {
      const mem = wsFlowsMemCache.get(workspaceId);
      if (mem) return mem;
    }

    const rows = await db.execute<{
      id: string;
      title: string;
      description: string | null;
      kind: "sop" | "journey" | "architect";
      status: "draft" | "published" | "archived";
      updated_at: Date | string;
      share_enabled: boolean;
    }>(
      sql`select * from public.zf_list_workspace_flows(${userId}::uuid, ${workspaceId}::uuid, ${opts.status ?? null}::flow_status, ${limit})`,
    );

    const mapped: FlowCardData[] = rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      kind: r.kind,
      status: r.status,
      updatedAt: r.updated_at instanceof Date ? r.updated_at : new Date(r.updated_at),
      shareEnabled: Boolean(r.share_enabled),
    }));

    if (isDefaultQuery) {
      wsFlowsMemCache.set(workspaceId, mapped);
    }

    return mapped;
  },
);

/** Ambil satu flow dalam <1ms (cache memori) atau 1 round-trip RPC terverifikasi keanggotaan. */
export const getFlow = cache(async (userId: string, flowId: string) => {
  if (!UUID_RE.test(flowId)) return null;

  const { workspaces } = await getWorkspaceContext(userId);
  const memberWsIds = new Set(workspaces.map((w) => w.id));

  // 1. Cek L1 cache (termasuk flow baru dari "Gunakan Template" -> 0.01ms, 0 query DB!)
  const mem = flowDocMemCache.get(flowId);
  if (mem && memberWsIds.has(mem.workspaceId)) {
    const normalized = normalizeFlowRow(mem);
    const { doc, corrupted } = parseDocumentSafe(normalized.document);
    return { ...normalized, doc, corrupted };
  }

  // 2. 1 round-trip SQL `zf_get_flow` (memvalidasi keanggotaan workspace langsung di PostgreSQL)
  const rows = await db.execute<Record<string, any>>(
    sql`select * from public.zf_get_flow(${userId}::uuid, ${flowId}::uuid)`,
  );
  const raw = rows[0];
  if (!raw) return null;

  const row = normalizeFlowRow(raw);
  flowDocMemCache.set(flowId, row);
  const { doc, corrupted } = parseDocumentSafe(row.document);
  return { ...row, doc, corrupted };
});

async function fetchSharedFlowFromDb(token: string) {
  const rows = await db.execute<{
    id: string;
    title: string;
    description: string | null;
    kind: string;
    document: unknown;
    updated_at: Date | string;
  }>(sql`select * from public.get_shared_flow(${token})`);
  const row = rows[0];
  if (!row) return null;
  const { doc, corrupted } = parseDocumentSafe(row.document);
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    kind: row.kind,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
    doc,
    corrupted,
  };
}

/** Flow publik via token (1 round-trip RPC + Data Cache 30 detik). */
export const getSharedFlow = cache(async (token: string) => {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return null;
  try {
    const cached = await unstable_cache(
      () => fetchSharedFlowFromDb(token),
      ["zf-shared-flow", token],
      { revalidate: 30, tags: [sharedFlowCacheTag(token)] },
    )();
    if (!cached) return null;
    return {
      ...cached,
      updatedAt: new Date(cached.updatedAt),
    };
  } catch {
    return null;
  }
});
