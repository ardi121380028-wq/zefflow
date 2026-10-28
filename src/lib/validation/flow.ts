import { z } from "zod";

/**
 * Skema dokumen diagram — SATU sumber kebenaran.
 * Dipakai di: validasi server action (menolak payload rusak), hydrate store,
 * dan penurunan tipe TypeScript (z.infer) sehingga tidak ada duplikasi tipe.
 */

export const LANE_COLORS = ["violet", "sky", "emerald", "amber", "rose", "slate"] as const;
export const DURATION_UNITS = ["menit", "jam", "hari"] as const;
export const STEP_TYPES = ["step", "decision", "terminal"] as const;
/** horizontal: lane = baris, alur ke samping. vertical: lane = kolom, alur ke bawah. */
export const ORIENTATIONS = ["horizontal", "vertical"] as const;

const id = z.string().min(1).max(64);
const position = z.object({ x: z.number().finite(), y: z.number().finite() });
const dim = z.number().finite().positive().max(20000).optional();

export const laneDataSchema = z.object({
  title: z.string().trim().max(80),
  /** Divisi / departemen yang direpresentasikan lane ini */
  division: z.string().trim().max(80).default(""),
  color: z.enum(LANE_COLORS).default("violet"),
});

export const stepDataSchema = z.object({
  title: z.string().trim().max(120),
  description: z.string().max(2000).default(""),
  durationValue: z.number().finite().min(0).max(100000).nullable().default(null),
  durationUnit: z.enum(DURATION_UNITS).default("menit"),
  /** Output / deliverable langkah ini */
  output: z.string().max(500).default(""),
  /** PIC / jabatan penanggung jawab */
  owner: z.string().max(80).default(""),
});

const laneNode = z.object({
  id,
  type: z.literal("lane"),
  position,
  width: dim,
  height: dim,
  data: laneDataSchema,
});

const stepNode = z.object({
  id,
  type: z.enum(STEP_TYPES),
  position,
  parentId: id.optional(),
  width: dim,
  height: dim,
  data: stepDataSchema,
});

export const edgeSchema = z.object({
  id,
  source: id,
  target: id,
  sourceHandle: z.string().max(16).nullish(),
  targetHandle: z.string().max(16).nullish(),
  label: z.string().max(60).optional(),
});

export const flowDocumentSchema = z
  .object({
    version: z.literal(1),
    /** Dokumen lama tanpa field ini dianggap horizontal. */
    orientation: z.enum(ORIENTATIONS).default("horizontal"),
    nodes: z.array(z.discriminatedUnion("type", [laneNode, stepNode.extend({ type: z.literal("step") }), stepNode.extend({ type: z.literal("decision") }), stepNode.extend({ type: z.literal("terminal") })])).max(500),
    edges: z.array(edgeSchema).max(1000),
  })
  .superRefine((doc, ctx) => {
    // Integritas referensial: parent harus lane, edge harus menunjuk node yang ada.
    const byId = new Map(doc.nodes.map((n) => [n.id, n]));
    if (byId.size !== doc.nodes.length) ctx.addIssue({ code: "custom", message: "ID node duplikat" });
    for (const n of doc.nodes) {
      if (n.type !== "lane" && n.parentId && byId.get(n.parentId)?.type !== "lane") {
        ctx.addIssue({ code: "custom", message: `Parent node ${n.id} bukan lane` });
      }
    }
    for (const e of doc.edges) {
      if (!byId.has(e.source) || !byId.has(e.target)) {
        ctx.addIssue({ code: "custom", message: `Edge ${e.id} menunjuk node yang tidak ada` });
      }
    }
  });

export type LaneData = z.infer<typeof laneDataSchema>;
export type StepData = z.infer<typeof stepDataSchema>;
export type FlowDocument = z.infer<typeof flowDocumentSchema>;
export type LaneColor = (typeof LANE_COLORS)[number];
export type Orientation = (typeof ORIENTATIONS)[number];

export const EMPTY_DOCUMENT: FlowDocument = { version: 1, orientation: "vertical", nodes: [], edges: [] };

/** Parse aman dokumen dari DB (JSON tidak tepercaya). Mengembalikan dokumen kosong bila rusak. */
export function parseDocumentSafe(raw: unknown): { doc: FlowDocument; corrupted: boolean } {
  const res = flowDocumentSchema.safeParse(raw);
  return res.success ? { doc: res.data, corrupted: false } : { doc: EMPTY_DOCUMENT, corrupted: true };
}
