"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { EMPTY_DOCUMENT, flowDocumentSchema } from "@/lib/validation/flow";
import {
  ACTIVE_WORKSPACE_COOKIE,
  DEMO_COOKIE,
  getWorkspaceContext,
  requireUser,
} from "@/server/auth/session";
import { getDemoStore } from "@/server/auth/demo";
import { withUser } from "@/server/db/client";
import { flows, memberships, profiles, workspaces } from "@/server/db/schema";
import { AppError, safeAction } from "@/server/errors";
import { buildDocument, getTemplate } from "./templates";

const MAX_DOCUMENT_BYTES = 1_000_000; // 1 MB — batas wajar untuk JSONB diagram

const flowIdSchema = z.string().min(1, "ID tidak valid");

/** Aktifkan Sesi Demo Instan tanpa perlu Supabase / PostgreSQL */
export async function enableDemoModeAction() {
  cookies().set(DEMO_COOKIE, "true", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  });
  redirect("/dashboard");
}

/** Buat flow baru (kosong atau dari template) di workspace aktif. */
export async function createFlowAction(input: {
  title?: string;
  kind?: "sop" | "journey";
  templateId?: string;
}) {
  return safeAction(async () => {
    const parsed = z
      .object({
        title: z.string().trim().min(1).max(120).optional(),
        kind: z.enum(["sop", "journey"]).optional(),
        templateId: z.string().max(64).optional(),
      })
      .parse(input);

    const isDemo = cookies().get(DEMO_COOKIE)?.value === "true";
    if (isDemo) {
      const template = parsed.templateId ? getTemplate(parsed.templateId) : undefined;
      const id = `demo-${nanoid(8)}`;
      getDemoStore().set(id, {
        id,
        title: parsed.title ?? template?.title ?? "Flow tanpa judul",
        description: template?.description ?? null,
        kind: parsed.kind ?? template?.kind ?? "sop",
        status: "draft",
        document: template ? buildDocument(template) : EMPTY_DOCUMENT,
        version: 1,
        shareToken: `demo-token-${nanoid(12)}`,
        shareEnabled: false,
        updatedAt: new Date(),
      });
      revalidatePath("/dashboard");
      return { id };
    }

    const user = await requireUser();
    const { active } = await getWorkspaceContext(user.id);
    const template = parsed.templateId ? getTemplate(parsed.templateId) : undefined;
    if (parsed.templateId && !template) throw new AppError("NOT_FOUND", "Template tidak ditemukan.");

    const [row] = await withUser(user.id, (tx) =>
      tx
        .insert(flows)
        .values({
          workspaceId: active.id,
          title: parsed.title ?? template?.title ?? "Flow tanpa judul",
          description: template?.description,
          kind: parsed.kind ?? template?.kind ?? "sop",
          document: template ? buildDocument(template) : EMPTY_DOCUMENT,
          createdBy: user.id,
        })
        .returning({ id: flows.id }),
    );
    if (!row) throw new AppError("FORBIDDEN", "Anda tidak memiliki izin membuat flow di workspace ini.");
    revalidatePath("/dashboard");
    return { id: row.id };
  });
}

/** Simpan dokumen diagram dengan optimistic locking (kolom `version`). */
export async function saveFlowDocumentAction(input: {
  flowId: string;
  document: unknown;
  expectedVersion: number;
}) {
  return safeAction(async () => {
    const flowId = flowIdSchema.parse(input.flowId);
    const expectedVersion = z.number().int().positive().parse(input.expectedVersion);
    const document = flowDocumentSchema.parse(input.document);
    if (JSON.stringify(document).length > MAX_DOCUMENT_BYTES) {
      throw new AppError("VALIDATION", "Diagram terlalu besar untuk disimpan.");
    }

    const isDemo = cookies().get(DEMO_COOKIE)?.value === "true";
    if (isDemo) {
      const item = getDemoStore().get(flowId);
      if (!item) throw new AppError("NOT_FOUND", "Flow tidak ditemukan.");
      item.document = document;
      item.version += 1;
      item.updatedAt = new Date();
      return { version: item.version };
    }

    const user = await requireUser();
    return withUser(user.id, async (tx) => {
      const [updated] = await tx
        .update(flows)
        .set({ document, version: sql`${flows.version} + 1` })
        .where(and(eq(flows.id, flowId), eq(flows.version, expectedVersion)))
        .returning({ version: flows.version });
      if (updated) return { version: updated.version };

      const [exists] = await tx.select({ version: flows.version }).from(flows).where(eq(flows.id, flowId)).limit(1);
      if (!exists) throw new AppError("NOT_FOUND", "Flow tidak ditemukan atau Anda tidak punya akses.");
      throw new AppError("CONFLICT", "Flow ini diubah di tempat lain. Muat ulang untuk melihat versi terbaru.");
    });
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

    const isDemo = cookies().get(DEMO_COOKIE)?.value === "true";
    if (isDemo) {
      const item = getDemoStore().get(flowId);
      if (!item) throw new AppError("NOT_FOUND", "Flow tidak ditemukan.");
      if (patch.title) item.title = patch.title;
      if (patch.description !== undefined) item.description = patch.description;
      if (patch.status) item.status = patch.status;
      item.updatedAt = new Date();
      revalidatePath("/dashboard");
      return { id: item.id };
    }

    const user = await requireUser();
    const [row] = await withUser(user.id, (tx) =>
      tx.update(flows).set(patch).where(eq(flows.id, flowId)).returning({ id: flows.id }),
    );
    if (!row) throw new AppError("FORBIDDEN", "Tidak dapat mengubah flow ini.");
    revalidatePath("/dashboard");
    return { id: row.id };
  });
}

export async function deleteFlowAction(flowId: string) {
  return safeAction(async () => {
    const id = flowIdSchema.parse(flowId);

    const isDemo = cookies().get(DEMO_COOKIE)?.value === "true";
    if (isDemo) {
      getDemoStore().delete(id);
      revalidatePath("/dashboard");
      return { id };
    }

    const user = await requireUser();
    const rows = await withUser(user.id, (tx) => tx.delete(flows).where(eq(flows.id, id)).returning({ id: flows.id }));
    if (rows.length === 0) throw new AppError("FORBIDDEN", "Hanya owner/admin yang dapat menghapus flow.");
    revalidatePath("/dashboard");
    return { id };
  });
}

/** Aktif/nonaktifkan link view-only. */
export async function setFlowShareAction(input: { flowId: string; enabled: boolean }) {
  return safeAction(async () => {
    const { flowId, enabled } = z.object({ flowId: flowIdSchema, enabled: z.boolean() }).parse(input);

    const isDemo = cookies().get(DEMO_COOKIE)?.value === "true";
    if (isDemo) {
      const item = getDemoStore().get(flowId);
      if (!item) throw new AppError("NOT_FOUND", "Flow tidak ditemukan.");
      item.shareEnabled = enabled;
      return { token: item.shareToken, enabled: item.shareEnabled };
    }

    const user = await requireUser();
    const [row] = await withUser(user.id, (tx) =>
      tx
        .update(flows)
        .set({ shareEnabled: enabled, shareToken: sql`coalesce(${flows.shareToken}, ${nanoid(24)})` })
        .where(eq(flows.id, flowId))
        .returning({ token: flows.shareToken, enabled: flows.shareEnabled }),
    );
    if (!row) throw new AppError("FORBIDDEN", "Tidak dapat mengubah pengaturan berbagi.");
    return row;
  });
}

export async function switchWorkspaceAction(workspaceId: string) {
  return safeAction(async () => {
    const id = z.string().parse(workspaceId);
    const user = await requireUser();
    const { workspaces } = await getWorkspaceContext(user.id);
    if (!workspaces.some((w) => w.id === id)) throw new AppError("FORBIDDEN", "Anda bukan anggota workspace ini.");
    cookies().set(ACTIVE_WORKSPACE_COOKIE, id, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
    revalidatePath("/", "layout");
    return { id };
  });
}

export async function signOutAction() {
  cookies().delete(DEMO_COOKIE);
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
    const isDemo = cookies().get(DEMO_COOKIE)?.value === "true";
    if (isDemo) {
      const id = `demo-ws-${nanoid(6)}`;
      cookies().set(ACTIVE_WORKSPACE_COOKIE, id, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
      revalidatePath("/", "layout");
      return { id, name };
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + nanoid(6).toLowerCase();

    const [ws] = await withUser(user.id, async (tx) => {
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

    cookies().set(ACTIVE_WORKSPACE_COOKIE, ws.id, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
    revalidatePath("/", "layout");
    return ws;
  });
}

/** Perbarui profil pengguna (Nama Lengkap) di database Supabase */
export async function updateProfileAction(input: { fullName: string }) {
  return safeAction(async () => {
    const { fullName } = z.object({ fullName: z.string().trim().min(2).max(100) }).parse(input);
    const user = await requireUser();
    const isDemo = cookies().get(DEMO_COOKIE)?.value === "true";
    if (isDemo) return { fullName };

    await withUser(user.id, async (tx) => {
      await tx
        .update(profiles)
        .set({ fullName, updatedAt: new Date() })
        .where(eq(profiles.id, user.id));
    });

    revalidatePath("/", "layout");
    return { fullName };
  });
}

/** Perbarui nama workspace aktif di database Supabase */
export async function updateWorkspaceNameAction(input: { workspaceId: string; name: string }) {
  return safeAction(async () => {
    const { workspaceId, name } = z
      .object({ workspaceId: z.string(), name: z.string().trim().min(2).max(64) })
      .parse(input);
    const user = await requireUser();
    const isDemo = cookies().get(DEMO_COOKIE)?.value === "true";
    if (isDemo) return { id: workspaceId, name };

    await withUser(user.id, async (tx) => {
      await tx
        .update(workspaces)
        .set({ name, updatedAt: new Date() })
        .where(eq(workspaces.id, workspaceId));
    });

    revalidatePath("/", "layout");
    return { id: workspaceId, name };
  });
}

/** Dapatkan daftar anggota workspace saat ini dari Supabase */
export async function getWorkspaceMembersAction(workspaceId: string) {
  return safeAction(async () => {
    const wsId = z.string().parse(workspaceId);
    const user = await requireUser();
    const isDemo = cookies().get(DEMO_COOKIE)?.value === "true";
    if (isDemo) {
      return [
        {
          id: user.id,
          name: "Demo User",
          email: "demo@zefflow.app",
          role: "owner" as const,
          avatarUrl: null,
          joinedAt: new Date().toISOString(),
        },
      ];
    }

    const members = await withUser(user.id, async (tx) => {
      return tx
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
        .where(eq(memberships.workspaceId, wsId));
    });

    return members.map((m) => ({
      ...m,
      joinedAt: m.joinedAt.toISOString(),
    }));
  });
}

/** Undang anggota tim ke workspace berdasarkan email */
export async function inviteWorkspaceMemberAction(input: {
  workspaceId: string;
  email: string;
  role: "admin" | "editor" | "viewer";
}) {
  return safeAction(async () => {
    const { workspaceId, email, role } = z
      .object({
        workspaceId: z.string(),
        email: z.string().trim().email(),
        role: z.enum(["admin", "editor", "viewer"]),
      })
      .parse(input);

    const user = await requireUser();
    const isDemo = cookies().get(DEMO_COOKIE)?.value === "true";
    if (isDemo) {
      return { success: true, email, role };
    }

    // Cari apakah email sudah terdaftar di profiles
    const [targetProfile] = await withUser(user.id, async (tx) => {
      return tx.select().from(profiles).where(eq(profiles.email, email)).limit(1);
    });

    if (targetProfile) {
      await withUser(user.id, async (tx) => {
        await tx
          .insert(memberships)
          .values({
            workspaceId,
            userId: targetProfile.id,
            role,
          })
          .onConflictDoUpdate({
            target: [memberships.workspaceId, memberships.userId],
            set: { role },
          });
      });
      revalidatePath("/", "layout");
      return { success: true, email, role, added: true };
    }

    // Jika belum mendaftar, kembalikan status undangan terkirim
    return { success: true, email, role, pending: true };
  });
}

/** Hapus anggota dari workspace */
export async function removeWorkspaceMemberAction(input: { workspaceId: string; userId: string }) {
  return safeAction(async () => {
    const { workspaceId, userId } = z.object({ workspaceId: z.string(), userId: z.string() }).parse(input);
    const user = await requireUser();
    const isDemo = cookies().get(DEMO_COOKIE)?.value === "true";
    if (isDemo) return { success: true };

    await withUser(user.id, async (tx) => {
      await tx
        .delete(memberships)
        .where(and(eq(memberships.workspaceId, workspaceId), eq(memberships.userId, userId)));
    });

    revalidatePath("/", "layout");
    return { success: true };
  });
}

