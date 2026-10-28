import type { LaneColor, Orientation, StepData } from "@/lib/validation/flow";
import type { AppEdge, AppNode, LaneNodeType, StepNodeType } from "../types";

/* =====================================================================
   Konstanta geometri swimlane (satu tempat agar mudah di-tuning).
   - horizontal: lane = baris (header di kiri), alur ke samping.
   - vertical  : lane = kolom (header di atas), alur ke bawah.
   ===================================================================== */

// Horizontal
export const LANE_HEADER_WIDTH = 200;
export const LANE_DEFAULT_WIDTH = 2600;
export const LANE_DEFAULT_HEIGHT = 260;
export const LANE_MIN_HEIGHT = 180;
export const COL_GAP = 344;
export const FIRST_COL_X = LANE_HEADER_WIDTH + 48;

// Vertical
export const LANE_V_WIDTH = 340;
export const LANE_V_MIN_WIDTH = 280;
export const LANE_V_HEADER_HEIGHT = 112;
export const LANE_V_MIN_LENGTH = 560;
export const LANE_V_DEFAULT_LENGTH = 1200;
export const ROW_GAP = 68;
export const FIRST_ROW_Y = LANE_V_HEADER_HEIGHT + 40;
const LANE_V_BOTTOM_PAD = 56;

// Node
export const STEP_WIDTH = 288;
export const STEP_EST_HEIGHT = 150;
export const DECISION_W = 232;
export const DECISION_H = 160;
export const TERMINAL_MIN_W = 184;
export const TERMINAL_H = 54;

export const LANE_PALETTE: LaneColor[] = ["violet", "sky", "emerald", "amber", "rose", "slate"];

type LaneStyle = { header: string; headerV: string; band: string; dot: string; accentBar: string };

/** header lane horizontal memakai border-r; versi vertical memakai border-b. */
const asVertical = (header: string) => header.replace("border-r ", "border-b ");

const laneStyle = (s: Omit<LaneStyle, "headerV">): LaneStyle => ({ ...s, headerV: asVertical(s.header) });

/** Warna lane -> class Tailwind. Aksen warna solid asli (vibrant) tanpa pudar. */
export const LANE_STYLES: Record<LaneColor, LaneStyle> = {
  violet: laneStyle({
    header: "bg-violet-50/95 dark:bg-[#13141F] text-violet-950 dark:text-violet-200 border-r border-violet-200/80 dark:border-violet-500/20",
    band: "bg-violet-500/[0.04] dark:bg-violet-950/[0.12]",
    dot: "bg-violet-600 dark:bg-violet-400 shadow-[0_0_10px_#8b5cf6]",
    accentBar: "bg-violet-600 dark:bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.6)]",
  }),
  sky: laneStyle({
    header: "bg-sky-50/95 dark:bg-[#0F1622] text-sky-950 dark:text-sky-200 border-r border-sky-200/80 dark:border-sky-500/20",
    band: "bg-sky-500/[0.04] dark:bg-sky-950/[0.12]",
    dot: "bg-sky-600 dark:bg-sky-400 shadow-[0_0_10px_#0284c7]",
    accentBar: "bg-sky-600 dark:bg-sky-500 shadow-[0_0_10px_rgba(2,132,199,0.6)]",
  }),
  emerald: laneStyle({
    header: "bg-emerald-50/95 dark:bg-[#0E1916] text-emerald-950 dark:text-emerald-200 border-r border-emerald-200/80 dark:border-emerald-500/20",
    band: "bg-emerald-500/[0.04] dark:bg-emerald-950/[0.12]",
    dot: "bg-emerald-600 dark:bg-emerald-400 shadow-[0_0_10px_#10b981]",
    accentBar: "bg-emerald-600 dark:bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]",
  }),
  amber: laneStyle({
    header: "bg-amber-50/95 dark:bg-[#1A150F] text-amber-950 dark:text-amber-200 border-r border-amber-200/80 dark:border-amber-500/20",
    band: "bg-amber-500/[0.04] dark:bg-amber-950/[0.12]",
    dot: "bg-amber-600 dark:bg-amber-400 shadow-[0_0_10px_#f59e0b]",
    accentBar: "bg-amber-500 dark:bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.6)]",
  }),
  rose: laneStyle({
    header: "bg-rose-50/95 dark:bg-[#1C1116] text-rose-950 dark:text-rose-200 border-r border-rose-200/80 dark:border-rose-500/20",
    band: "bg-rose-500/[0.04] dark:bg-rose-950/[0.12]",
    dot: "bg-rose-600 dark:bg-rose-400 shadow-[0_0_10px_#f43f5e]",
    accentBar: "bg-rose-600 dark:bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)]",
  }),
  slate: laneStyle({
    header: "bg-slate-100/95 dark:bg-[#131418] text-slate-900 dark:text-zinc-200 border-r border-slate-200/80 dark:border-zinc-700/30",
    band: "bg-slate-500/[0.04] dark:bg-zinc-900/[0.15]",
    dot: "bg-slate-600 dark:bg-zinc-400 shadow-[0_0_10px_#64748b]",
    accentBar: "bg-slate-600 dark:bg-zinc-400 shadow-[0_0_10px_rgba(100,116,139,0.6)]",
  }),
};

/* ---------------------------------------------------------------------
   Tipe minimal agar fungsi layout bisa dipakai untuk node React Flow
   (editor) maupun node dokumen tersimpan (template / server).
   --------------------------------------------------------------------- */
export interface LayoutNodeLike {
  id: string;
  type?: string;
  parentId?: string;
  position: { x: number; y: number };
  width?: number | null;
  height?: number | null;
  measured?: { width?: number; height?: number };
  data: unknown;
}

export interface LayoutEdgeLike {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}

export type Handle = "l" | "r" | "t" | "b";
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const nodeHeight = (n: AppNode, fallback = STEP_EST_HEIGHT) => n.height ?? n.measured?.height ?? fallback;

/** React Flow mewajibkan parent muncul sebelum child di array. */
export function sortParentsFirst(nodes: AppNode[]): AppNode[] {
  return [...nodes].sort((a, b) => Number(b.type === "lane") - Number(a.type === "lane"));
}

/**
 * Estimasi ukuran node berdasarkan isi teks (dipakai saat node belum terukur, mis. di server/template).
 * Sedikit dilebihkan agar tidak pernah saling menimpa.
 */
export function estimateNodeSize(type: string | undefined, data: unknown): { w: number; h: number } {
  if (type === "decision") return { w: DECISION_W, h: DECISION_H };
  const d = (data ?? {}) as Partial<StepData>;
  if (type === "terminal") {
    const w = Math.min(STEP_WIDTH, Math.max(TERMINAL_MIN_W, 96 + (d.title?.length ?? 8) * 9));
    return { w, h: TERMINAL_H };
  }
  const inner = STEP_WIDTH - 34;
  const title = d.title || "Tanpa judul";
  const titleLines = Math.max(1, Math.ceil((title.length * 9.6) / inner));
  const descLines = d.description ? Math.min(3, Math.max(1, Math.ceil((d.description.length * 7.4) / inner))) : 0;

  const chips: string[] = [];
  if (d.durationValue) chips.push(`${d.durationValue} ${d.durationUnit ?? "menit"}`);
  if (d.owner) chips.push(d.owner);
  if (d.output) chips.push(d.output);
  let chipRows = 0;
  if (chips.length > 0) {
    chipRows = 1;
    let used = 0;
    for (const c of chips) {
      const cw = Math.min(inner, 44 + c.length * 7.2);
      if (used > 0 && used + cw > inner) {
        chipRows++;
        used = 0;
      }
      used += cw + 6;
    }
  }
  const h = 36 + titleLines * 24 + (descLines ? 8 + descLines * 21 : 0) + (chipRows ? 12 + chipRows * 30 + (chipRows - 1) * 6 : 0);
  return { w: STEP_WIDTH, h: Math.ceil(h) };
}

/** Ukuran nyata (terukur) bila ada, jika tidak pakai estimasi. */
export function sizeOfNode(n: LayoutNodeLike): { w: number; h: number } {
  const est = estimateNodeSize(n.type, n.data);
  return { w: n.measured?.width ?? n.width ?? est.w, h: n.measured?.height ?? n.height ?? est.h };
}

/** Rect absolut (koordinat kanvas) sebuah step, dihitung dari posisi lane parent-nya. */
export function absRect(node: AppNode, nodes: AppNode[]): Rect {
  const parent = node.parentId ? nodes.find((n) => n.id === node.parentId) : undefined;
  const { w, h } = sizeOfNode(node);
  return { x: (parent?.position.x ?? 0) + node.position.x, y: (parent?.position.y ?? 0) + node.position.y, w, h };
}

/** Susun ulang lane berdasar urutan array: vertical -> menyamping (kolom), horizontal -> menurun (baris). */
export function relayoutLanes(nodes: AppNode[], orientation: Orientation = "horizontal"): AppNode[] {
  let offset = 0;
  return nodes.map((n) => {
    if (n.type !== "lane") return n;
    if (orientation === "vertical") {
      const next = { ...n, position: { x: offset, y: 0 } };
      offset += n.width ?? LANE_V_WIDTH;
      return next;
    }
    const next = { ...n, position: { x: 0, y: offset } };
    offset += nodeHeight(n, LANE_DEFAULT_HEIGHT);
    return next;
  });
}

export function createLaneNode(
  id: string,
  title: string,
  color: LaneColor,
  width = LANE_DEFAULT_WIDTH,
  height = LANE_DEFAULT_HEIGHT,
): LaneNodeType {
  return {
    id,
    type: "lane",
    position: { x: 0, y: 0 },
    width,
    height,
    deletable: false, // dihapus lewat aksi store agar child ikut terhapus
    draggable: false,
    selectable: false,
    zIndex: 0,
    data: { title, division: "", color },
  };
}

export function createStepNode(
  id: string,
  type: StepNodeType["type"],
  position: { x: number; y: number },
  parentId: string,
  title: string,
): StepNodeType {
  return {
    id,
    type,
    position,
    parentId,
    zIndex: 10,
    data: { title, description: "", durationValue: null, durationUnit: "menit", output: "", owner: "" },
  };
}

/** Cari lane yang memuat titik absolut; jika di luar, ambil lane terdekat. */
export function laneAtPoint(lanes: LaneNodeType[], abs: { x: number; y: number }, orientation: Orientation): LaneNodeType | undefined {
  if (lanes.length === 0) return undefined;
  if (orientation === "vertical") {
    const hit = lanes.find((l) => abs.x >= l.position.x && abs.x < l.position.x + (l.width ?? LANE_V_WIDTH));
    return hit ?? (abs.x < 0 ? lanes[0] : lanes[lanes.length - 1]);
  }
  const hit = lanes.find((l) => abs.y >= l.position.y && abs.y < l.position.y + nodeHeight(l, LANE_DEFAULT_HEIGHT));
  return hit ?? (abs.y < 0 ? lanes[0] : lanes[lanes.length - 1]);
}

/** Jaga posisi relatif step tetap di dalam lane (selepas header). */
export function clampInLane(lane: LaneNodeType, pos: { x: number; y: number }, size: { w: number; h: number }, orientation: Orientation) {
  const laneH = nodeHeight(lane, orientation === "vertical" ? LANE_V_DEFAULT_LENGTH : LANE_DEFAULT_HEIGHT);
  const laneW = lane.width ?? (orientation === "vertical" ? LANE_V_WIDTH : LANE_DEFAULT_WIDTH);
  if (orientation === "vertical") {
    return {
      x: Math.min(Math.max(pos.x, 12), Math.max(12, laneW - size.w - 12)),
      y: Math.min(Math.max(pos.y, LANE_V_HEADER_HEIGHT + 16), Math.max(LANE_V_HEADER_HEIGHT + 16, laneH - size.h - 16)),
    };
  }
  return {
    x: Math.min(Math.max(pos.x, LANE_HEADER_WIDTH + 12), Math.max(LANE_HEADER_WIDTH + 12, laneW - size.w - 12)),
    y: Math.min(Math.max(pos.y, 12), Math.max(12, laneH - size.h - 12)),
  };
}

/**
 * Pilih handle sumber & tujuan paling natural dari posisi relatif dua node.
 * - vertical  : alur utama bawah->atas (b -> t); cabang keputusan keluar dari sisi; loop kembali lewat samping.
 * - horizontal: alur utama kanan->kiri (r -> l); cabang keputusan keluar dari atas/bawah.
 */
export function pickHandles(src: Rect, tgt: Rect, srcIsDecision: boolean, orientation: Orientation): [Handle, Handle] {
  const dx = tgt.x + tgt.w / 2 - (src.x + src.w / 2);
  const dy = tgt.y + tgt.h / 2 - (src.y + src.h / 2);

  if (orientation === "vertical") {
    const sameLane = Math.abs(dx) < 60;
    if (dy > 24) {
      if (sameLane) return ["b", "t"];
      if (srcIsDecision) return [dx > 0 ? "r" : "l", "t"];
      return ["b", "t"];
    }
    if (dy < -24) {
      if (sameLane) return ["r", "r"]; // loop kembali ke atas
      return [dx > 0 ? "r" : "l", dx > 0 ? "l" : "r"];
    }
    return [dx > 0 ? "r" : "l", dx > 0 ? "l" : "r"]; // sejajar (beda lane)
  }

  const sameLane = Math.abs(dy) < 40;
  if (dx > 24) {
    if (sameLane) return ["r", "l"];
    if (srcIsDecision) return [dy > 0 ? "b" : "t", "l"];
    return ["r", "l"];
  }
  if (dx < -24) {
    if (sameLane) return ["b", "b"]; // loop kembali ke kiri
    return [dy > 0 ? "b" : "t", dy > 0 ? "t" : "b"];
  }
  return [dy > 0 ? "b" : "t", dy > 0 ? "t" : "b"]; // satu kolom (beda lane)
}

/**
 * Susun ulang SELURUH diagram dari orientasi `from` ke `to` (boleh sama = "rapikan otomatis").
 * - Step dikelompokkan menjadi baris/kolom urutan berdasarkan posisinya.
 * - Jarak dihitung dari tinggi nyata tiap baris -> rapat, tidak saling menimpa.
 * - Handle tiap koneksi dihitung ulang agar garis mengalir natural.
 */
export function convertLayout<N extends LayoutNodeLike, E extends LayoutEdgeLike>(
  nodes: N[],
  edges: E[],
  from: Orientation,
  to: Orientation,
): { nodes: N[]; edges: E[] } {
  const lanes = nodes.filter((n) => n.type === "lane");
  const laneIndex = new Map(lanes.map((l, i) => [l.id, i]));
  const laneById = new Map(lanes.map((l) => [l.id, l]));
  const steps = nodes.filter((n) => n.type !== "lane");

  interface Info {
    node: N;
    w: number;
    h: number;
    cx: number;
    cy: number;
    lane: number;
  }
  const infos: Info[] = steps.map((node) => {
    const { w, h } = sizeOfNode(node);
    const p = node.parentId ? laneById.get(node.parentId) : undefined;
    const ax = (p?.position.x ?? 0) + node.position.x;
    const ay = (p?.position.y ?? 0) + node.position.y;
    return { node, w, h, cx: ax + w / 2, cy: ay + h / 2, lane: p ? (laneIndex.get(p.id) ?? 0) : 0 };
  });

  // Kelompokkan menjadi baris/kolom berurutan di sumbu alur orientasi asal.
  const axis: "cx" | "cy" = from === "vertical" ? "cy" : "cx";
  const threshold = from === "vertical" ? 70 : 150;
  const sorted = [...infos].sort((a, b) => a[axis] - b[axis]);
  const seqOf = new Map<string, number>();
  let seq = -1;
  let last = -Infinity;
  for (const it of sorted) {
    if (it[axis] - last > threshold) seq++;
    last = it[axis];
    seqOf.set(it.node.id, seq);
  }
  const seqCount = Math.max(0, seq + 1);

  const newPos = new Map<string, { x: number; y: number }>();
  const laneGeom = new Map<string, { x: number; y: number; width: number; height: number }>();

  if (to === "vertical") {
    const rowH = new Array<number>(seqCount).fill(0);
    for (const it of infos) {
      const r = seqOf.get(it.node.id)!;
      rowH[r] = Math.max(rowH[r]!, it.h);
    }
    const rowTop: number[] = [];
    let y = FIRST_ROW_Y;
    for (let r = 0; r < seqCount; r++) {
      rowTop[r] = y;
      y += rowH[r]! + ROW_GAP;
    }
    const length = Math.max(LANE_V_MIN_LENGTH, Math.ceil(y - ROW_GAP + LANE_V_BOTTOM_PAD));

    let offsetX = 0;
    const widthOf = (l: N) => (from === "vertical" ? (l.width ?? LANE_V_WIDTH) : LANE_V_WIDTH);
    lanes.forEach((l) => {
      const width = widthOf(l);
      laneGeom.set(l.id, { x: offsetX, y: 0, width, height: length });
      offsetX += width;
    });
    for (const it of infos) {
      const r = seqOf.get(it.node.id)!;
      const lane = it.node.parentId ? laneById.get(it.node.parentId) : undefined;
      const laneW = lane ? widthOf(lane) : LANE_V_WIDTH;
      newPos.set(it.node.id, {
        x: Math.max(12, Math.round((laneW - it.w) / 2)),
        y: rowTop[r]! + Math.round((rowH[r]! - it.h) / 2),
      });
    }
  } else {
    const width = Math.max(LANE_DEFAULT_WIDTH, FIRST_COL_X + seqCount * COL_GAP + 300);
    let offsetY = 0;
    const heightOf = (l: N) => (from === "horizontal" ? (l.height ?? LANE_DEFAULT_HEIGHT) : LANE_DEFAULT_HEIGHT);
    lanes.forEach((l) => {
      const height = heightOf(l);
      laneGeom.set(l.id, { x: 0, y: offsetY, width, height });
      offsetY += height;
    });
    for (const it of infos) {
      const c = seqOf.get(it.node.id)!;
      const lane = it.node.parentId ? laneById.get(it.node.parentId) : undefined;
      const laneH = lane ? heightOf(lane) : LANE_DEFAULT_HEIGHT;
      newPos.set(it.node.id, {
        x: FIRST_COL_X + c * COL_GAP + Math.round((STEP_WIDTH - it.w) / 2),
        y: Math.max(12, Math.round((laneH - it.h) / 2)),
      });
    }
  }

  // Rect absolut baru untuk penentuan handle koneksi.
  const rectOf = new Map<string, { rect: Rect; decision: boolean }>();
  for (const it of infos) {
    const p = newPos.get(it.node.id)!;
    const lg = it.node.parentId ? laneGeom.get(it.node.parentId) : undefined;
    rectOf.set(it.node.id, {
      rect: { x: (lg?.x ?? 0) + p.x, y: (lg?.y ?? 0) + p.y, w: it.w, h: it.h },
      decision: it.node.type === "decision",
    });
  }

  const nextNodes = nodes.map((n) => {
    if (n.type === "lane") {
      const g = laneGeom.get(n.id)!;
      return { ...n, position: { x: g.x, y: g.y }, width: g.width, height: g.height } as N;
    }
    const p = newPos.get(n.id);
    return (p ? { ...n, position: p } : n) as N;
  });

  const nextEdges = edges.map((e) => {
    const s = rectOf.get(e.source);
    const t = rectOf.get(e.target);
    if (!s || !t) return e;
    const [sourceHandle, targetHandle] = pickHandles(s.rect, t.rect, s.decision, to);
    return { ...e, sourceHandle, targetHandle } as E;
  });

  return { nodes: nextNodes, edges: nextEdges };
}

/** Bersihkan properti runtime React Flow sebelum disimpan. */
export function serializeDocument(
  nodes: AppNode[],
  edges: AppEdge[],
  orientation: Orientation,
  branding?: { companyLogo?: string; companyName?: string; docCode?: string },
) {
  return {
    version: 1 as const,
    orientation,
    ...(branding?.companyLogo ? { companyLogo: branding.companyLogo } : {}),
    ...(branding?.companyName ? { companyName: branding.companyName } : {}),
    ...(branding?.docCode ? { docCode: branding.docCode } : {}),
    nodes: nodes.map((n) => ({
      id: n.id,
      type: n.type,
      position: { x: Math.round(n.position.x), y: Math.round(n.position.y) },
      ...(n.parentId ? { parentId: n.parentId } : {}),
      ...(n.type === "lane" ? { width: n.width, height: n.height } : {}),
      data: n.data,
    })),
    edges: edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle ?? null,
      targetHandle: e.targetHandle ?? null,
      ...(typeof e.label === "string" && e.label ? { label: e.label } : {}),
    })),
  };
}
