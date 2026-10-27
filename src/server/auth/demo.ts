import type { FlowDocument } from "@/lib/validation/flow";
import { buildDocument, TEMPLATES } from "@/features/flows/templates";
import type { FlowCardData } from "@/features/flows/queries";

export const DEMO_COOKIE = "lf_demo";

export interface DemoFlowItem {
  id: string;
  title: string;
  description: string | null;
  kind: "sop" | "journey";
  status: "draft" | "published" | "archived";
  document: FlowDocument;
  version: number;
  shareToken: string | null;
  shareEnabled: boolean;
  updatedAt: Date;
}

// In-memory store untuk sesi demo (persisten di globalThis selama server dev berjalan)
const globalForDemo = globalThis as unknown as { demoFlows?: Map<string, DemoFlowItem> };

function initDemoFlows(): Map<string, DemoFlowItem> {
  const store = new Map<string, DemoFlowItem>();

  // Inisialisasi 3 diagram dari template bawaan
  TEMPLATES.forEach((tmpl, idx) => {
    const id = `demo-${tmpl.id}`;
    store.set(id, {
      id,
      title: tmpl.title,
      description: tmpl.description,
      kind: tmpl.kind,
      status: idx === 1 ? "draft" : "published",
      document: buildDocument(tmpl),
      version: 1,
      shareToken: `demo-token-${tmpl.id}`,
      shareEnabled: idx === 0,
      updatedAt: new Date(Date.now() - idx * 3600 * 1000 * 2),
    });
  });

  return store;
}

export function getDemoStore(): Map<string, DemoFlowItem> {
  if (!globalForDemo.demoFlows) {
    globalForDemo.demoFlows = initDemoFlows();
  } else {
    // Selalu pastikan template bawaan sinkron dengan definisi terbaru di templates.ts
    TEMPLATES.forEach((tmpl, idx) => {
      const id = `demo-${tmpl.id}`;
      const existing = globalForDemo.demoFlows!.get(id);
      if (!existing || existing.version === 1) {
        globalForDemo.demoFlows!.set(id, {
          id,
          title: tmpl.title,
          description: tmpl.description,
          kind: tmpl.kind,
          status: idx === 1 ? "draft" : "published",
          document: buildDocument(tmpl),
          version: 1,
          shareToken: `demo-token-${tmpl.id}`,
          shareEnabled: idx < 2,
          updatedAt: new Date(Date.now() - idx * 3600 * 1000 * 2),
        });
      }
    });
  }
  return globalForDemo.demoFlows;
}

export function getDemoFlowCards(): FlowCardData[] {
  const store = getDemoStore();
  return Array.from(store.values())
    .filter((f) => f.status !== "archived")
    .map((f) => ({
      id: f.id,
      title: f.title,
      description: f.description,
      kind: f.kind,
      status: f.status,
      shareEnabled: f.shareEnabled,
      updatedAt: f.updatedAt,
    }))
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}
