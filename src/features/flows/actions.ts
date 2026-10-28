"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { EMPTY_DOCUMENT, flowDocumentSchema } from "@/lib/validation/flow";
import {
  ACTIVE_WORKSPACE_COOKIE,
  evictUserAuthCache,
  getUser,
  getWorkspaceContext,
  invalidateUserWorkspaceCache,
  requireUser,
  UUID_RE,
} from "@/server/auth/session";
import { db, withUser } from "@/server/db/client";
import { flows, memberships, profiles, workspaces, type FlowRow } from "@/server/db/schema";
import { AppError, safeAction } from "@/server/errors";
import {
  evictPrimedFlow,
  invalidateFlowDocCache,
  invalidateSharedFlowCache,
  invalidateWorkspaceFlowsCache,
  primeFlowCache,
} from "./queries";
import { buildDocument, getTemplate } from "./templates";

const MAX_DOCUMENT_BYTES = 5_000_000; // 5 MB — mendukung hingga ribuan langkah / tabel ERD besar

const flowIdSchema = z.string().uuid("ID diagram tidak valid");

function mapRpcFlowRow(raw: Record<string, any>): FlowRow {
  return {
    id: raw.id,
    workspaceId: raw.workspace_id ?? raw.workspaceId,
    title: raw.title,
    description: raw.description ?? null,
    kind: raw.kind,
    status: raw.status,
    document: raw.document,
    version: Number(raw.version ?? 1),
    shareToken: raw.share_token ?? raw.shareToken ?? null,
    shareEnabled: Boolean(raw.share_enabled ?? raw.shareEnabled),
    createdBy: raw.created_by ?? raw.createdBy ?? null,
    createdAt: raw.created_at instanceof Date ? raw.created_at : new Date(raw.created_at ?? Date.now()),
    updatedAt: raw.updated_at instanceof Date ? raw.updated_at : new Date(raw.updated_at ?? Date.now()),
  };
}

/**
 * Buat flow baru (kosong atau dari template) dalam 1 round-trip SQL tunggal (`zf_create_flow`),
 * simpan di memori (`primeFlowCache`), dan langsung `redirect` ke `/flows/[id]` dalam 1 HTTP request!
 */
export async function createFlowAction(input: {
  title?: string;
  kind?: "sop" | "journey" | "architect";
  templateId?: string;
}) {
  return safeAction(async () => {
    const parsed = z
      .object({
        title: z.string().trim().min(1).max(120).optional(),
        kind: z.enum(["sop", "journey", "architect"]).optional(),
        templateId: z.string().max(64).optional(),
      })
      .parse(input);

    const user = await requireUser();
    const template = parsed.templateId ? getTemplate(parsed.templateId) : undefined;
    if (parsed.templateId && !template) throw new AppError("NOT_FOUND", "Template tidak ditemukan.");

    const rawPreferredWs = cookies().get(ACTIVE_WORKSPACE_COOKIE)?.value;
    const preferredWsId = rawPreferredWs && UUID_RE.test(rawPreferredWs) ? rawPreferredWs : null;

    const title = parsed.title ?? template?.title ?? "Flow tanpa judul";
    const description = template?.description ?? null;
    const kind = parsed.kind ?? template?.kind ?? "sop";
    const docJson = JSON.stringify(template ? buildDocument(template) : EMPTY_DOCUMENT);

    let rawRow: Record<string, any> | undefined;
    try {
      const rows = await db.execute<Record<string, any>>(
        sql`select * from public.zf_create_flow(${user.id}::uuid, ${preferredWsId}::uuid, ${title}, ${description}, ${kind}::flow_kind, ${docJson}::jsonb)`,
      );
      rawRow = rows[0];
    } catch (err) {
      if ((err as { code?: string })?.code === "42501") {
        throw new AppError("FORBIDDEN", "Anda tidak memiliki izin membuat diagram di workspace ini.");
      }
      throw err;
    }

    if (!rawRow) {
      throw new AppError("FORBIDDEN", "Anda tidak memiliki izin membuat diagram di workspace ini.");
    }

    const row = mapRpcFlowRow(rawRow);
    primeFlowCache(row);
    invalidateWorkspaceFlowsCache(row.workspaceId);

    // Server-side redirect langsung me-render `/flows/[id]` dalam 1 round-trip HTTP yang sama!
    redirect(`/flows/${row.id}`);
  });
}

/** Simpan dokumen diagram dengan optimistic locking 1 round-trip (`zf_save_flow_document`). */
export async function saveFlowDocumentAction(input: {
  flowId: string;
  document: unknown;
  expectedVersion: number;
}) {
  return safeAction(async () => {
    const flowId = flowIdSchema.parse(input.flowId);
    const expectedVersion = z.number().int().positive().parse(input.expectedVersion);
    const document = flowDocumentSchema.parse(input.document);
    const serialized = JSON.stringify(document);
    if (Buffer.byteLength(serialized, "utf8") > MAX_DOCUMENT_BYTES) {
      throw new AppError("VALIDATION", "Diagram terlalu besar untuk disimpan (maks. 5 MB).");
    }

    const user = await requireUser();
    const rows = await db.execute<{
      out_status: "ok" | "conflict" | "forbidden";
      out_version: number;
      out_workspace_id: string | null;
      out_share_token: string | null;
      out_share_enabled: boolean;
    }>(
      sql`select * from public.zf_save_flow_document(${user.id}::uuid, ${flowId}::uuid, ${serialized}::jsonb, ${expectedVersion})`,
    );

    const res = rows[0];
    if (!res || res.out_status === "forbidden") {
      throw new AppError("NOT_FOUND", "Flow tidak ditemukan atau Anda tidak punya akses.");
    }
    if (res.out_status === "conflict") {
      throw new AppError(
        "CONFLICT",
        "Flow ini telah diperbarui oleh rekan tim lain. Muat ulang untuk menyinkronkan versi terbaru.",
      );
    }

    evictPrimedFlow(flowId);
    invalidateFlowDocCache(flowId);
    invalidateWorkspaceFlowsCache(res.out_workspace_id);
    if (res.out_share_enabled && res.out_share_token) {
      invalidateSharedFlowCache(res.out_share_token);
    }

    return { version: Number(res.out_version) };
  });
}

export async function updateFlowMetaAction(input: {
  flowId: string;
  title?: string;
  description?: string | null;
  status?: "draft" | "published" | "archived";
}) {
  return safeAction(async () => {
    const { flowId, ...patch } = z
      .object({
        flowId: flowIdSchema,
        title: z.string().trim().min(1, "Judul wajib diisi").max(120).optional(),
        description: z.string().max(500).nullable().optional(),
        status: z.enum(["draft", "published", "archived"]).optional(),
      })
      .parse(input);

    const user = await requireUser();
    const [row] = await withUser(user.id, (tx) =>
      tx
        .update(flows)
        .set(patch)
        .where(eq(flows.id, flowId))
        .returning({ id: flows.id, workspaceId: flows.workspaceId, shareToken: flows.shareToken }),
    );
    if (!row) throw new AppError("FORBIDDEN", "Tidak dapat mengubah flow ini.");
    evictPrimedFlow(row.id);
    invalidateFlowDocCache(row.id);
    invalidateWorkspaceFlowsCache(row.workspaceId);
    invalidateSharedFlowCache(row.shareToken);
    revalidatePath("/dashboard");
    return { id: row.id };
  });
}

export async function deleteFlowAction(flowId: string) {
  return safeAction(async () => {
    const id = flowIdSchema.parse(flowId);
    const user = await requireUser();
    const rows = await withUser(user.id, (tx) =>
      tx
        .delete(flows)
        .where(eq(flows.id, id))
        .returning({ id: flows.id, workspaceId: flows.workspaceId, shareToken: flows.shareToken }),
    );
    if (rows.length === 0) throw new AppError("FORBIDDEN", "Hanya owner/admin yang dapat menghapus flow.");
    evictPrimedFlow(id);
    invalidateFlowDocCache(id);
    invalidateWorkspaceFlowsCache(rows[0]?.workspaceId);
    invalidateSharedFlowCache(rows[0]?.shareToken);
    revalidatePath("/dashboard");
    return { id };
  });
}

/** Aktif/nonaktifkan link view-only. */
export async function setFlowShareAction(input: { flowId: string; enabled: boolean }) {
  return safeAction(async () => {
    const { flowId, enabled } = z.object({ flowId: flowIdSchema, enabled: z.boolean() }).parse(input);
    const user = await requireUser();
    const [row] = await withUser(user.id, (tx) =>
      tx
        .update(flows)
        .set({ shareEnabled: enabled, shareToken: sql`coalesce(${flows.shareToken}, ${nanoid(24)})` })
        .where(eq(flows.id, flowId))
        .returning({ token: flows.shareToken, enabled: flows.shareEnabled, workspaceId: flows.workspaceId }),
    );
    if (!row) throw new AppError("FORBIDDEN", "Tidak dapat mengubah pengaturan berbagi.");
    evictPrimedFlow(flowId);
    invalidateFlowDocCache(flowId);
    invalidateWorkspaceFlowsCache(row.workspaceId);
    invalidateSharedFlowCache(row.token);
    return { token: row.token, enabled: row.enabled };
  });
}

export async function switchWorkspaceAction(workspaceId: string) {
  return safeAction(async () => {
    const id = z.string().uuid().parse(workspaceId);
    const user = await requireUser();
    const { workspaces } = await getWorkspaceContext(user.id);
    if (!workspaces.some((w) => w.id === id)) throw new AppError("FORBIDDEN", "Anda bukan anggota workspace ini.");
    cookies().set(ACTIVE_WORKSPACE_COOKIE, id, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
    revalidatePath("/dashboard", "layout");
    revalidatePath("/settings");
    return { id };
  });
}

export async function signOutAction() {
  const user = await getUser();
  if (user) {
    evictUserAuthCache(user.id);
    invalidateUserWorkspaceCache(user.id);
  }
  cookies().delete("lf_demo");
  try {
    await createClient().auth.signOut();
  } catch {}
  redirect("/login");
}

/** Buat workspace baru di database Supabase dan langsung aktifkan */
export async function createWorkspaceAction(input: { name: string }) {
  return safeAction(async () => {
    const { name } = z.object({ name: z.string().trim().min(2).max(64) }).parse(input);
    const user = await requireUser();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + nanoid(6).toLowerCase();

    const [ws] = await db.transaction(async (tx) => {
      const [newWs] = await tx
        .insert(workspaces)
        .values({
          name,
          slug,
          createdBy: user.id,
        })
        .returning();

      if (newWs) {
        await tx.insert(memberships).values({
          workspaceId: newWs.id,
          userId: user.id,
          role: "owner",
        });
      }
      return [newWs];
    });

    if (!ws) throw new AppError("INTERNAL", "Gagal membuat workspace.");

    invalidateUserWorkspaceCache(user.id);
    cookies().set(ACTIVE_WORKSPACE_COOKIE, ws.id, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
    revalidatePath("/dashboard", "layout");
    revalidatePath("/settings");
    return ws;
  });
}

/** Perbarui profil pengguna (Nama Lengkap) di database Supabase */
export async function updateProfileAction(input: { fullName: string }) {
  return safeAction(async () => {
    const { fullName } = z.object({ fullName: z.string().trim().min(2).max(100) }).parse(input);
    const user = await requireUser();

    await withUser(user.id, async (tx) => {
      await tx
        .update(profiles)
        .set({ fullName, updatedAt: new Date() })
        .where(eq(profiles.id, user.id));
    });

    invalidateUserWorkspaceCache(user.id);
    revalidatePath("/dashboard", "layout");
    revalidatePath("/settings");
    return { fullName };
  });
}

/** Perbarui nama workspace aktif di database Supabase */
export async function updateWorkspaceNameAction(input: { workspaceId: string; name: string }) {
  return safeAction(async () => {
    const { workspaceId, name } = z
      .object({ workspaceId: z.string().uuid(), name: z.string().trim().min(2).max(64) })
      .parse(input);
    const user = await requireUser();

    await withUser(user.id, async (tx) => {
      await tx
        .update(workspaces)
        .set({ name, updatedAt: new Date() })
        .where(eq(workspaces.id, workspaceId));
    });

    invalidateUserWorkspaceCache(user.id);
    revalidatePath("/dashboard", "layout");
    revalidatePath("/settings");
    return { id: workspaceId, name };
  });
}

export interface WorkspaceMembersPage {
  items: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
    role: "owner" | "admin" | "editor" | "viewer";
    joinedAt: string;
  }[];
  total: number;
  hasMore: boolean;
}

export async function getWorkspaceMembersAction(
  input:
    | string
    | {
        workspaceId: string;
        search?: string;
        limit?: number;
        offset?: number;
      },
) {
  return safeAction(async (): Promise<WorkspaceMembersPage> => {
    const normalized =
      typeof input === "string" ? { workspaceId: input, search: "", limit: 50, offset: 0 } : input;

    const { workspaceId: wsId, search, limit, offset } = z
      .object({
        workspaceId: z.string().uuid(),
        search: z.string().trim().max(100).optional().default(""),
        limit: z.number().int().min(1).max(200).optional().default(50),
        offset: z.number().int().min(0).optional().default(0),
      })
      .parse(normalized);

    const user = await requireUser();
    const q = search.trim();
    const whereClause = q
      ? and(
          eq(memberships.workspaceId, wsId),
          or(ilike(profiles.email, `%${q}%`), ilike(profiles.fullName, `%${q}%`)),
        )
      : eq(memberships.workspaceId, wsId);

    const { rows, total } = await withUser(user.id, async (tx) => {
      const [rows, countRows] = await Promise.all([
        tx
          .select({
            id: profiles.id,
            name: profiles.fullName,
            email: profiles.email,
            avatarUrl: profiles.avatarUrl,
            role: memberships.role,
            joinedAt: memberships.createdAt,
          })
          .from(memberships)
          .innerJoin(profiles, eq(profiles.id, memberships.userId))
          .where(whereClause)
          .orderBy(desc(memberships.createdAt))
          .limit(limit + 1)
          .offset(offset),
        tx
          .select({ count: sql<number>`count(*)::int` })
          .from(memberships)
          .innerJoin(profiles, eq(profiles.id, memberships.userId))
          .where(whereClause),
      ]);
      return { rows, total: countRows[0]?.count ?? 0 };
    });

    const hasMore = rows.length > limit;
    const sliced = hasMore ? rows.slice(0, limit) : rows;

    return {
      items: sliced.map((m) => ({
        ...m,
        joinedAt: m.joinedAt.toISOString(),
      })),
      total,
      hasMore,
    };
  });
}

/** Undang anggota tim ke workspace berdasarkan email (1 round-trip RPC berindeks) */
export async function inviteWorkspaceMemberAction(input: {
  workspaceId: string;
  email: string;
  role: "admin" | "editor" | "viewer";
}) {
  return safeAction(async () => {
    const { workspaceId, email, role } = z
      .object({
        workspaceId: z.string().uuid(),
        email: z.string().trim().email(),
        role: z.enum(["admin", "editor", "viewer"]),
      })
      .parse(input);

    const user = await requireUser();
    const result = await withUser(user.id, async (tx) => {
      const rows = await tx.execute<{ target_user_id: string | null; added: boolean }>(
        sql`select * from public.invite_workspace_member_by_email(${workspaceId}::uuid, ${email}, ${role}::member_role)`,
      );
      return rows[0];
    });

    if (result?.added && result.target_user_id) {
      invalidateUserWorkspaceCache(result.target_user_id);
      invalidateUserWorkspaceCache(user.id);
      revalidatePath("/dashboard", "layout");
      return { success: true, email, role, added: true };
    }

    return { success: true, email, role, pending: true };
  });
}

/** Hapus anggota dari workspace */
export async function removeWorkspaceMemberAction(input: { workspaceId: string; userId: string }) {
  return safeAction(async () => {
    const { workspaceId, userId } = z
      .object({ workspaceId: z.string().uuid(), userId: z.string().uuid() })
      .parse(input);
    const user = await requireUser();

    await withUser(user.id, async (tx) => {
      await tx
        .delete(memberships)
        .where(and(eq(memberships.workspaceId, workspaceId), eq(memberships.userId, userId)));
    });

    invalidateUserWorkspaceCache(userId);
    invalidateUserWorkspaceCache(user.id);
    revalidatePath("/dashboard", "layout");
    return { success: true };
  });
}
