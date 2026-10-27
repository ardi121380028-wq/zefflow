import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { withUser } from "@/server/db/client";
import { memberships, profiles, workspaces, type MemberRole, type Profile, type Workspace } from "@/server/db/schema";
import { AppError } from "@/server/errors";

export const ACTIVE_WORKSPACE_COOKIE = "lf_ws";
export const DEMO_COOKIE = "lf_demo";

/** User terverifikasi (round-trip ke Supabase Auth atau Sesi Demo). Di-cache per request. */
export const getUser = cache(async () => {
  const isDemo = cookies().get(DEMO_COOKIE)?.value === "true";
  if (isDemo) {
    return {
      id: "00000000-0000-0000-0000-000000000001",
      email: "demo@zefflow.app",
      app_metadata: {},
      user_metadata: { full_name: "Demo User" },
      aud: "authenticated",
      created_at: new Date().toISOString(),
    } as any;
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return data.user;
  } catch {
    return null;
  }
});

export async function requireUser() {
  const user = await getUser();
  if (!user) throw new AppError("UNAUTHORIZED", "Sesi berakhir. Silakan masuk kembali.");
  return user;
}

export interface WorkspaceContext {
  profile: Profile | null;
  workspaces: (Workspace & { role: MemberRole })[];
  active: Workspace & { role: MemberRole };
}

/**
 * Workspace aktif = dari cookie bila pengguna masih anggota, jika tidak yang pertama.
 * Query berjalan lewat `withUser` sehingga RLS yang menentukan apa yang terlihat.
 */
export const getWorkspaceContext = cache(async (userId: string): Promise<WorkspaceContext> => {
  const isDemo = cookies().get(DEMO_COOKIE)?.value === "true";
  if (isDemo) {
    const demoWs: Workspace & { role: MemberRole } = {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Zefflow Studio (Demo)",
      slug: "demo-workspace",
      plan: "pro",
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      role: "owner",
    };
    return {
      profile: {
        id: userId,
        email: "demo@zefflow.app",
        fullName: "Demo User",
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      workspaces: [demoWs],
      active: demoWs,
    };
  }

  const { rows, profile } = await withUser(userId, async (tx) => {
    const rows = await tx
      .select({ ws: workspaces, role: memberships.role })
      .from(memberships)
      .innerJoin(workspaces, eq(workspaces.id, memberships.workspaceId))
      .where(eq(memberships.userId, userId))
      .orderBy(workspaces.createdAt);
    const [profile] = await tx.select().from(profiles).where(eq(profiles.id, userId)).limit(1);
    return { rows, profile };
  });

  if (rows.length === 0) {
    // Seharusnya tidak terjadi (trigger signup membuat workspace). Beri pesan jelas.
    throw new AppError("NOT_FOUND", "Workspace tidak ditemukan. Pastikan migrasi RLS/trigger sudah dijalankan.");
  }
  const list = rows.map((r) => ({ ...r.ws, role: r.role }));
  const preferred = cookies().get(ACTIVE_WORKSPACE_COOKIE)?.value;
  const active = list.find((w) => w.id === preferred) ?? list[0]!;
  return { profile: profile ?? null, workspaces: list, active };
});
