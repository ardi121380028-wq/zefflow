import type { LaneColor } from "@/lib/validation/flow";
import type { AppEdge, AppNode, LaneNodeType, StepNodeType } from "../types";

/** Konstanta geometri swimlane (satu tempat agar mudah di-tuning). */
export const LANE_HEADER_WIDTH = 184;
export const LANE_DEFAULT_WIDTH = 2600;
export const LANE_DEFAULT_HEIGHT = 240;
export const LANE_MIN_HEIGHT = 160;
export const STEP_WIDTH = 264;
export const STEP_EST_HEIGHT = 126;
export const COL_GAP = 320;
export const FIRST_COL_X = LANE_HEADER_WIDTH + 48;

export const LANE_PALETTE: LaneColor[] = ["violet", "sky", "emerald", "amber", "rose", "slate"];

/** Warna lane -> class Tailwind. Aksen warna solid asli (vibrant) tanpa pudar. */
export const LANE_STYLES: Record<LaneColor, { header: string; band: string; dot: string; accentBar: string }> = {
  violet: {
    header: "bg-violet-50/95 dark:bg-[#13141F] text-violet-950 dark:text-violet-200 border-r border-violet-200/80 dark:border-violet-500/20",
    band: "bg-violet-500/[0.04] dark:bg-violet-950/[0.12]",
    dot: "bg-violet-600 dark:bg-violet-400 shadow-[0_0_10px_#8b5cf6]",
    accentBar: "bg-violet-600 dark:bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.6)]",
  },
  sky: {
    header: "bg-sky-50/95 dark:bg-[#0F1622] text-sky-950 dark:text-sky-200 border-r border-sky-200/80 dark:border-sky-500/20",
    band: "bg-sky-500/[0.04] dark:bg-sky-950/[0.12]",
    dot: "bg-sky-600 dark:bg-sky-400 shadow-[0_0_10px_#0284c7]",
    accentBar: "bg-sky-600 dark:bg-sky-500 shadow-[0_0_10px_rgba(2,132,199,0.6)]",
  },
  emerald: {
    header: "bg-emerald-50/95 dark:bg-[#0E1916] text-emerald-950 dark:text-emerald-200 border-r border-emerald-200/80 dark:border-emerald-500/20",
    band: "bg-emerald-500/[0.04] dark:bg-emerald-950/[0.12]",
    dot: "bg-emerald-600 dark:bg-emerald-400 shadow-[0_0_10px_#10b981]",
    accentBar: "bg-emerald-600 dark:bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]",
  },
  amber: {
    header: "bg-amber-50/95 dark:bg-[#1A150F] text-amber-950 dark:text-amber-200 border-r border-amber-200/80 dark:border-amber-500/20",
    band: "bg-amber-500/[0.04] dark:bg-amber-950/[0.12]",
    dot: "bg-amber-600 dark:bg-amber-400 shadow-[0_0_10px_#f59e0b]",
    accentBar: "bg-amber-500 dark:bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.6)]",
  },
  rose: {
    header: "bg-rose-50/95 dark:bg-[#1C1116] text-rose-950 dark:text-rose-200 border-r border-rose-200/80 dark:border-rose-500/20",
    band: "bg-rose-500/[0.04] dark:bg-rose-950/[0.12]",
    dot: "bg-rose-600 dark:bg-rose-400 shadow-[0_0_10px_#f43f5e]",
    accentBar: "bg-rose-600 dark:bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)]",
  },
  slate: {
    header: "bg-slate-100/95 dark:bg-[#131418] text-slate-900 dark:text-zinc-200 border-r border-slate-200/80 dark:border-zinc-700/30",
    band: "bg-slate-500/[0.04] dark:bg-zinc-900/[0.15]",
    dot: "bg-slate-600 dark:bg-zinc-400 shadow-[0_0_10px_#64748b]",
    accentBar: "bg-slate-600 dark:bg-zinc-400 shadow-[0_0_10px_rgba(100,116,139,0.6)]",
  },
};

export const nodeHeight = (n: AppNode, fallback = STEP_EST_HEIGHT) => n.height ?? n.measured?.height ?? fallback;

/** React Flow mewajibkan parent muncul sebelum child di array. */
export function sortParentsFirst(nodes: AppNode[]): AppNode[] {
  return [...nodes].sort((a, b) => Number(b.type === "lane") - Number(a.type === "lane"));
}

/** Susun ulang lane secara vertikal (x=0, y kumulatif) berdasar urutan array. */
export function relayoutLanes(nodes: AppNode[]): AppNode[] {
  let y = 0;
  return nodes.map((n) => {
    if (n.type !== "lane") return n;
    const next = { ...n, position: { x: 0, y } };
    y += nodeHeight(n, LANE_DEFAULT_HEIGHT);
    return next;
  });
}

export function createLaneNode(id: string, title: string, color: LaneColor, width = LANE_DEFAULT_WIDTH): LaneNodeType {
  return {
    id,
    type: "lane",
    position: { x: 0, y: 0 },
    width,
    height: LANE_DEFAULT_HEIGHT,
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

/** Cari lane yang memuat titik Y absolut; jika di luar, ambil lane terdekat. */
export function laneAtY(lanes: LaneNodeType[], absY: number): LaneNodeType | undefined {
  if (lanes.length === 0) return undefined;
  const hit = lanes.find((l) => absY >= l.position.y && absY < l.position.y + nodeHeight(l, LANE_DEFAULT_HEIGHT));
  if (hit) return hit;
  return absY < 0 ? lanes[0] : lanes[lanes.length - 1];
}

/** Jaga posisi relatif step tetap di dalam lane (selepas header). */
export function clampInLane(lane: LaneNodeType, pos: { x: number; y: number }, h: number) {
  const laneH = nodeHeight(lane, LANE_DEFAULT_HEIGHT);
  const laneW = lane.width ?? LANE_DEFAULT_WIDTH;
  return {
    x: Math.min(Math.max(pos.x, LANE_HEADER_WIDTH + 12), laneW - STEP_WIDTH - 12),
    y: Math.min(Math.max(pos.y, 12), Math.max(12, laneH - h - 12)),
  };
}

/** Bersihkan properti runtime React Flow sebelum disimpan. */
export function serializeDocument(nodes: AppNode[], edges: AppEdge[]) {
  return {
    version: 1 as const,
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
