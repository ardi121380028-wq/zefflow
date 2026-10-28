import "server-only";
import { createHash } from "crypto";
import { cache } from "react";
import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import type { User } from "@supabase/supabase-js";
import { sql } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import {
  verifiedTokenCache,
  wsContextMemCache,
  wsFlowsMemCache,
  type CachedFlowCard,
} from "@/server/cache/memory-cache";
import { db } from "@/server/db/client";
import type { MemberRole, Profile, Workspace } from "@/server/db/schema";
import { AppError } from "@/server/errors";

export const ACTIVE_WORKSPACE_COOKIE = "lf_ws";

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const userWorkspaceCacheTag = (userId: string) => `user-ws-${userId}`;

/** Invalidasi instan cache konteks workspace seorang user saat profil/tim/workspace berubah. */
export function invalidateUserWorkspaceCache(userId: string) {
  wsContextMemCache.delete(userId);
  try {
    revalidateTag(userWorkspaceCacheTag(userId));
  } catch {
    // Aman diabaikan di luar konteks Next request
  }
}

export function evictUserAuthCache(userId: string) {
  verifiedTokenCache.evictUser(userId);
}

function hashAccessToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Verifikasi sesi user secara aman & instan:
 * - Hash SHA-256 dari `access_token` yang sudah terverifikasi GoTrue disimpan di memori (maks 2 menit & selalu < `expires_at`),
 *   memangkas latensi `supabase.auth.getUser()` dari ~150–350ms HTTP menjadi ~0.02ms pada klik/navigasi berikutnya!
 */
export const getUser = cache(async (): Promise<User | null> => {
  const cookieStore = cookies();
  const hasSbCookie = cookieStore.getAll().some((c) => c.name.startsWith("sb-"));
  if (!hasSbCookie) return null;

  try {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const accessToken = session?.access_token;
    const expiresAtSec = session?.expires_at ?? 0;
    const nowMs = Date.now();

    if (accessToken && expiresAtSec * 1000 - nowMs > 15_000) {
      const tokenHash = hashAccessToken(accessToken);
      const cachedUser = verifiedTokenCache.get(tokenHash);
      if (cachedUser) {
        return cachedUser;
      }

      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) return null;

      const ttlMs = Math.min(expiresAtSec * 1000 - nowMs - 10_000, 120_000);
      verifiedTokenCache.set(tokenHash, data.user, ttlMs);
      return data.user;
    }

    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return data.user;
  } catch {
    return null;
  }
});

export async function requireUser(): Promise<User> {
  const user = await getUser();
  if (!user) throw new AppError("UNAUTHORIZED", "Sesi berakhir. Silakan masuk kembali.");
  return user;
}

export interface WorkspaceContext {
  profile: Profile | null;
  workspaces: (Workspace & { role: MemberRole })[];
  active: Workspace & { role: MemberRole };
}

interface BootstrapRpcPayload {
  profile: {
    id: string;
    email: string;
    fullName: string | null;
    avatarUrl: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
  workspaces: {
    id: string;
    name: string;
    slug: string;
    plan: Workspace["plan"];
    createdBy: string | null;
    createdAt: string;
    updatedAt: string;
    role: MemberRole;
  }[];
  flowsWorkspaceId: string | null;
  flows: {
    id: string;
    title: string;
    description: string | null;
    kind: "sop" | "journey" | "architect";
    status: "draft" | "published" | "archived";
    updatedAt: string;
    shareEnabled: boolean;
  }[];
}

function normalizeDates<T extends { createdAt: Date | string; updatedAt: Date | string }>(obj: T): T {
  return {
    ...obj,
    createdAt: obj.createdAt instanceof Date ? obj.createdAt : new Date(obj.createdAt),
    updatedAt: obj.updatedAt instanceof Date ? obj.updatedAt : new Date(obj.updatedAt),
  };
}

/**
 * Ambil konteks workspace + profil user dalam:
 * - 0.01ms dari L1 memory cache (termasuk saat berpindah workspace tanpa query ulang!), ATAU
 * - 1 round-trip tunggal via `public.zf_get_workspace_context` yang sekaligus mem-bootstrap
 *   daftar flow workspace aktif sehingga `listFlows` di `/dashboard` tidak butuh query ke-2!
 */
export const getWorkspaceContext = cache(async (userId: string): Promise<WorkspaceContext> => {
  const cookieStore = cookies();
  const rawPreferred = cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value;
  const preferredWsId = rawPreferred && UUID_RE.test(rawPreferred) ? rawPreferred : null;

  let cached = wsContextMemCache.get(userId);

  if (!cached) {
    const authUser = await getUser();
    const email = authUser?.email ?? null;
    const fullName = (authUser?.user_metadata?.full_name as string | undefined) ?? null;
    const avatarUrl = (authUser?.user_metadata?.avatar_url as string | undefined) ?? null;

    const rows = await db.execute<{ ctx: BootstrapRpcPayload }>(
      sql`select public.zf_get_workspace_context(${userId}::uuid, ${preferredWsId}::uuid, ${email}, ${fullName}, ${avatarUrl}) as ctx`,
    );

    const payload = rows[0]?.ctx;
    if (!payload || !payload.workspaces || payload.workspaces.length === 0) {
      throw new AppError("NOT_FOUND", "Workspace tidak ditemukan.");
    }

    const profile: Profile | null = payload.profile
      ? {
          id: payload.profile.id,
          email: payload.profile.email,
          fullName: payload.profile.fullName,
          avatarUrl: payload.profile.avatarUrl,
          createdAt: new Date(payload.profile.createdAt),
          updatedAt: new Date(payload.profile.updatedAt),
        }
      : null;

    const workspaces: (Workspace & { role: MemberRole })[] = payload.workspaces.map((w) => ({
      id: w.id,
      name: w.name,
      slug: w.slug,
      plan: w.plan,
      createdBy: w.createdBy,
      createdAt: new Date(w.createdAt),
      updatedAt: new Date(w.updatedAt),
      role: w.role,
    }));

    cached = { profile, workspaces };
    wsContextMemCache.set(userId, cached);

    // Seed cache daftar flow untuk workspace aktif sekaligus dalam 1 panggilan DB yang sama!
    if (payload.flowsWorkspaceId && Array.isArray(payload.flows)) {
      const normalizedFlows: CachedFlowCard[] = payload.flows.map((f) => ({
        id: f.id,
        title: f.title,
        description: f.description,
        kind: f.kind,
        status: f.status,
        updatedAt: new Date(f.updatedAt),
        shareEnabled: Boolean(f.shareEnabled),
      }));
      wsFlowsMemCache.set(payload.flowsWorkspaceId, normalizedFlows);
    }
  }

  const list = cached.workspaces.map(normalizeDates);
  const profile = cached.profile ? normalizeDates(cached.profile) : null;
  const active = (preferredWsId ? list.find((w) => w.id === preferredWsId) : undefined) ?? list[0]!;
  return { profile, workspaces: list, active };
});
