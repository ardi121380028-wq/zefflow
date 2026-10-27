import { create } from "zustand";
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  MarkerType,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from "@xyflow/react";
import { nanoid } from "nanoid";
import type { FlowDocument, LaneColor, LaneData, StepData } from "@/lib/validation/flow";
import { isLane, isStep, type AppEdge, type AppNode, type SaveStatus, type StepNodeType } from "../types";
import {
  clampInLane,
  COL_GAP,
  createLaneNode,
  createStepNode,
  FIRST_COL_X,
  LANE_DEFAULT_HEIGHT,
  LANE_DEFAULT_WIDTH,
  LANE_MIN_HEIGHT,
  LANE_PALETTE,
  laneAtY,
  nodeHeight,
  relayoutLanes,
  sortParentsFirst,
  STEP_EST_HEIGHT,
  STEP_WIDTH,
} from "../lib/layout";

const HISTORY_LIMIT = 60;
type Snapshot = { nodes: AppNode[]; edges: AppEdge[] };

interface CanvasState {
  flowId: string | null;
  version: number;
  readOnly: boolean;
  nodes: AppNode[];
  edges: AppEdge[];
  selectedId: string | null;
  saveStatus: SaveStatus;
  past: Snapshot[];
  future: Snapshot[];

  // lifecycle
  init: (p: { flowId: string; doc: FlowDocument; version: number; readOnly: boolean }) => void;
  // React Flow handlers
  onNodesChange: (changes: NodeChange<AppNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<AppEdge>[]) => void;
  onConnect: (c: Connection) => void;
  // history
  commit: () => void;
  undo: () => void;
  redo: () => void;
  // lanes
  addLane: () => void;
  removeLane: (id: string) => void;
  moveLane: (id: string, dir: -1 | 1) => void;
  resizeLane: (id: string, height: number) => void;
  widenLanes: (by: number) => void;
  // steps
  addStep: (type: StepNodeType["type"], opts?: { laneId?: string; position?: { x: number; y: number } }) => void;
  reparentOnDragStop: (nodeId: string) => void;
  // data
  updateNodeData: (id: string, patch: Partial<LaneData & StepData>) => void;
  updateEdgeLabel: (id: string, label: string) => void;
  select: (id: string | null) => void;
  deleteSelected: () => void;
  // persistence
  setSaveStatus: (s: SaveStatus) => void;
  markSaved: (version: number) => void;
}

const defaultEdge = (c: Connection): AppEdge => ({
  id: `e_${nanoid(8)}`,
  source: c.source,
  target: c.target,
  sourceHandle: c.sourceHandle,
  targetHandle: c.targetHandle,
  type: "smoothstep",
  markerEnd: { type: MarkerType.ArrowClosed },
});

/** Ubah dokumen tersimpan -> node/edge React Flow. */
export function documentToFlow(doc: FlowDocument): Snapshot {
  const nodes: AppNode[] = doc.nodes.map((n) => {
    if (n.type === "lane") {
      const base = createLaneNode(n.id, n.data.title, n.data.color, n.width ?? LANE_DEFAULT_WIDTH);
      return { ...base, position: n.position, height: n.height ?? LANE_DEFAULT_HEIGHT, data: n.data };
    }
    return { ...createStepNode(n.id, n.type, n.position, n.parentId ?? "", n.data.title), data: n.data };
  });
  const edges: AppEdge[] = doc.edges.map((e) => ({
    ...e,
    type: "smoothstep",
    markerEnd: { type: MarkerType.ArrowClosed },
  }));
  return { nodes: relayoutLanes(sortParentsFirst(nodes)), edges };
}

export const useCanvasStore = create<CanvasState>()((set, get) => {
  /** Terapkan perubahan konten: simpan history + tandai dirty. */
  const mutate = (fn: (s: CanvasState) => Partial<CanvasState>) => {
    const s = get();
    if (s.readOnly) return;
    set({
      past: [...s.past, { nodes: s.nodes, edges: s.edges }].slice(-HISTORY_LIMIT),
      future: [],
      ...fn(s),
      saveStatus: "dirty",
    });
  };

  return {
    flowId: null,
    version: 1,
    readOnly: true,
    nodes: [],
    edges: [],
    selectedId: null,
    saveStatus: "idle",
    past: [],
    future: [],

    init: ({ flowId, doc, version, readOnly }) =>
      set({ flowId, version, readOnly, ...documentToFlow(doc), selectedId: null, saveStatus: "idle", past: [], future: [] }),

    onNodesChange: (changes) => {
      const s = get();
      // Hanya perubahan konten yang menandai dirty; seleksi/pengukuran tidak.
      const contentChange = changes.some(
        (c) => c.type === "remove" || c.type === "add" || (c.type === "position" && c.dragging === false),
      );
      set({
        nodes: applyNodeChanges(changes, s.nodes),
        ...(contentChange && !s.readOnly ? { saveStatus: "dirty" as const } : {}),
      });
    },

    onEdgesChange: (changes) => {
      const s = get();
      const contentChange = changes.some((c) => c.type === "remove" || c.type === "add");
      set({
        edges: applyEdgeChanges(changes, s.edges),
        ...(contentChange && !s.readOnly ? { saveStatus: "dirty" as const } : {}),
      });
    },

    onConnect: (c) => {
      if (!c.source || !c.target || c.source === c.target) return;
      mutate((s) => ({ edges: addEdge(defaultEdge(c), s.edges) }));
    },

    commit: () => {
      const s = get();
      set({ past: [...s.past, { nodes: s.nodes, edges: s.edges }].slice(-HISTORY_LIMIT), future: [] });
    },

    undo: () => {
      const s = get();
      const prev = s.past.at(-1);
      if (!prev || s.readOnly) return;
      set({
        nodes: prev.nodes,
        edges: prev.edges,
        past: s.past.slice(0, -1),
        future: [{ nodes: s.nodes, edges: s.edges }, ...s.future],
        saveStatus: "dirty",
        selectedId: null,
      });
    },

    redo: () => {
      const s = get();
      const next = s.future[0];
      if (!next || s.readOnly) return;
      set({
        nodes: next.nodes,
        edges: next.edges,
        past: [...s.past, { nodes: s.nodes, edges: s.edges }],
        future: s.future.slice(1),
        saveStatus: "dirty",
        selectedId: null,
      });
    },

    addLane: () =>
      mutate((s) => {
        const lanes = s.nodes.filter(isLane);
        const color: LaneColor = LANE_PALETTE[lanes.length % LANE_PALETTE.length]!;
        const width = lanes[0]?.width ?? LANE_DEFAULT_WIDTH;
        const lane = createLaneNode(`lane_${nanoid(8)}`, `Divisi ${lanes.length + 1}`, color, width);
        return { nodes: relayoutLanes(sortParentsFirst([...s.nodes, lane])), selectedId: lane.id };
      }),

    removeLane: (id) =>
      mutate((s) => {
        const removed = new Set([id, ...s.nodes.filter((n) => n.parentId === id).map((n) => n.id)]);
        return {
          nodes: relayoutLanes(s.nodes.filter((n) => !removed.has(n.id))),
          edges: s.edges.filter((e) => !removed.has(e.source) && !removed.has(e.target)),
          selectedId: null,
        };
      }),

    moveLane: (id, dir) =>
      mutate((s) => {
        const lanes = s.nodes.filter(isLane);
        const i = lanes.findIndex((l) => l.id === id);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= lanes.length) return {};
        const order = lanes.map((l) => l.id);
        [order[i], order[j]] = [order[j]!, order[i]!];
        const laneMap = new Map(lanes.map((l) => [l.id, l]));
        const others = s.nodes.filter((n) => !isLane(n));
        const reordered = order.map((lid) => laneMap.get(lid)!);
        return { nodes: relayoutLanes([...reordered, ...others]) };
      }),

    resizeLane: (id, height) =>
      mutate((s) => ({
        nodes: relayoutLanes(
          s.nodes.map((n) => (n.id === id ? { ...n, height: Math.max(LANE_MIN_HEIGHT, Math.round(height)) } : n)),
        ),
      })),

    widenLanes: (by) =>
      mutate((s) => ({
        nodes: s.nodes.map((n) => (isLane(n) ? { ...n, width: (n.width ?? LANE_DEFAULT_WIDTH) + by } : n)),
      })),

    addStep: (type, opts) =>
      mutate((s) => {
        const lanes = s.nodes.filter(isLane);
        if (lanes.length === 0) return {}; // UI menonaktifkan tombol; guard tambahan
        const selected = s.nodes.find((n) => n.id === s.selectedId);
        const lane =
          lanes.find((l) => l.id === opts?.laneId) ??
          (opts?.position ? laneAtY(lanes, opts.position.y) : undefined) ??
          (isLane(selected) ? selected : lanes.find((l) => l.id === selected?.parentId)) ??
          lanes[0]!;

        let pos: { x: number; y: number };
        if (opts?.position) {
          pos = { x: opts.position.x - lane.position.x - STEP_WIDTH / 2, y: opts.position.y - lane.position.y - STEP_EST_HEIGHT / 2 };
        } else {
          // Letakkan setelah step paling kanan di lane tsb.
          const rightmost = s.nodes.filter((n) => n.parentId === lane.id).reduce((m, n) => Math.max(m, n.position.x), FIRST_COL_X - COL_GAP);
          pos = { x: rightmost + COL_GAP, y: (nodeHeight(lane, LANE_DEFAULT_HEIGHT) - STEP_EST_HEIGHT) / 2 };
        }
        const titles = { step: "Langkah baru", decision: "Keputusan?", terminal: "Mulai / Selesai" } as const;
        const node = createStepNode(`n_${nanoid(8)}`, type, clampInLane(lane, pos, STEP_EST_HEIGHT), lane.id, titles[type]);
        return { nodes: [...s.nodes, node], selectedId: node.id };
      }),

    /** Dipanggil saat drag berakhir: pindahkan step ke lane yang berada di bawahnya. */
    reparentOnDragStop: (nodeId) => {
      const s = get();
      const node = s.nodes.find((n) => n.id === nodeId);
      if (!isStep(node) || s.readOnly) return;
      const lanes = s.nodes.filter(isLane);
      const oldLane = lanes.find((l) => l.id === node.parentId);
      const absX = node.position.x + (oldLane?.position.x ?? 0);
      const absY = node.position.y + (oldLane?.position.y ?? 0);
      const h = nodeHeight(node);
      const target = laneAtY(lanes, absY + h / 2);
      if (!target) return;
      const rel = clampInLane(target, { x: absX - target.position.x, y: absY - target.position.y }, h);
      set({
        nodes: s.nodes.map((n) => (n.id === nodeId ? { ...n, parentId: target.id, position: rel } : n)),
        saveStatus: "dirty",
      });
    },

    updateNodeData: (id, patch) => {
      // Tanpa history per-ketukan; Inspector memanggil commit() sekali saat field difokuskan.
      const s = get();
      if (s.readOnly) return;
      set({
        nodes: s.nodes.map((n) => (n.id === id ? ({ ...n, data: { ...n.data, ...patch } } as AppNode) : n)),
        saveStatus: "dirty",
      });
    },

    updateEdgeLabel: (id, label) => {
      const s = get();
      if (s.readOnly) return;
      set({ edges: s.edges.map((e) => (e.id === id ? { ...e, label: label || undefined } : e)), saveStatus: "dirty" });
    },

    select: (id) => set({ selectedId: id }),

    deleteSelected: () => {
      const s = get();
      if (s.readOnly || !s.selectedId) return;
      const n = s.nodes.find((x) => x.id === s.selectedId);
      if (isLane(n)) return get().removeLane(n.id);
      mutate((st) => ({
        nodes: st.nodes.filter((x) => x.id !== s.selectedId),
        edges: st.edges.filter((e) => e.source !== s.selectedId && e.target !== s.selectedId && e.id !== s.selectedId),
        selectedId: null,
      }));
    },

    setSaveStatus: (saveStatus) => set({ saveStatus }),
    markSaved: (version) => set((s) => ({ version, saveStatus: s.saveStatus === "dirty" ? "dirty" : "saved" })),
  };
});
