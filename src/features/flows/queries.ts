import "server-only";
import { cookies } from "next/headers";
import { and, desc, eq, ne } from "drizzle-orm";
import { withUser } from "@/server/db/client";
import { flows } from "@/server/db/schema";
import { db } from "@/server/db/client";
import { sql } from "drizzle-orm";
import { parseDocumentSafe } from "@/lib/validation/flow";
import { DEMO_COOKIE } from "@/server/auth/session";
import { getDemoFlowCards, getDemoStore } from "@/server/auth/demo";

/** Kolom ringan untuk kartu (tanpa `document` yang besar). */
const cardColumns = {
  id: flows.id,
  title: flows.title,
  description: flows.description,
  kind: flows.kind,
  status: flows.status,
  updatedAt: flows.updatedAt,
  shareEnabled: flows.shareEnabled,
};

export type FlowCardData = {
  id: string;
  title: string;
  description: string | null;
  kind: "sop" | "journey" | "architect";
  status: "draft" | "published" | "archived";
  updatedAt: Date;
  shareEnabled: boolean;
};

export async function listFlows(userId: string, workspaceId: string, opts: { status?: "draft" | "published"; limit?: number } = {}) {
  const isDemo = cookies().get(DEMO_COOKIE)?.value === "true";
  if (isDemo) {
    const cards = getDemoFlowCards();
    return opts.status ? cards.filter((c) => c.status === opts.status) : cards;
  }
  return withUser(userId, (tx) =>
    tx
      .select(cardColumns)
      .from(flows)
      .where(
        and(
          eq(flows.workspaceId, workspaceId),
          opts.status ? eq(flows.status, opts.status) : ne(flows.status, "archived"),
        ),
      )
      .orderBy(desc(flows.updatedAt))
      .limit(opts.limit ?? 12),
  );
}

/** Ambil satu flow (RLS memastikan hanya anggota workspace yang bisa membaca). */
export async function getFlow(userId: string, flowId: string) {
  const isDemo = cookies().get(DEMO_COOKIE)?.value === "true";
  if (isDemo) {
    const item = getDemoStore().get(flowId);
    if (!item) return null;
    return {
      ...item,
      doc: item.document,
      corrupted: false,
    };
  }

  const [row] = await withUser(userId, (tx) => tx.select().from(flows).where(eq(flows.id, flowId)).limit(1));
  if (!row) return null;
  const { doc, corrupted } = parseDocumentSafe(row.document);
  return { ...row, doc, corrupted };
}

/**
 * Flow publik via token. Memanggil fungsi SECURITY DEFINER `get_shared_flow`
 * (sebagai role anon) — tidak memberi akses SELECT langsung ke tabel.
 */
export async function getSharedFlow(token: string) {
  // Cek apakah token berasal dari demo store
  const store = getDemoStore();
  const demoFound = Array.from(store.values()).find((f) => f.shareToken === token && f.shareEnabled);
  if (demoFound) {
    return {
      id: demoFound.id,
      title: demoFound.title,
      description: demoFound.description,
      kind: demoFound.kind,
      updatedAt: demoFound.updatedAt,
      doc: demoFound.document,
      corrupted: false,
    };
  }

  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return null;
  try {
    const rows = await db.transaction(async (tx) => {
      await tx.execute(sql`set local role anon`);
      return tx.execute<{ id: string; title: string; description: string | null; kind: string; document: unknown; updated_at: Date }>(
        sql`select * from public.get_shared_flow(${token})`,
      );
    });
    const row = rows[0];
    if (!row) return null;
    const { doc, corrupted } = parseDocumentSafe(row.document);
    return { id: row.id, title: row.title, description: row.description, kind: row.kind, updatedAt: row.updated_at, doc, corrupted };
  } catch {
    return null;
  }
}
