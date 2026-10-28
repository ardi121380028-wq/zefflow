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
import type { FlowDocument, LaneColor, LaneData, Orientation, StepData } from "@/lib/validation/flow";
import { isLane, isStep, type AppEdge, type AppNode, type SaveStatus, type StepNodeType } from "../types";
import {
  clampInLane,
  COL_GAP,
  convertLayout,
  createLaneNode,
  createStepNode,
  estimateNodeSize,
  FIRST_COL_X,
  FIRST_ROW_Y,
  LANE_DEFAULT_HEIGHT,
  LANE_DEFAULT_WIDTH,
  LANE_MIN_HEIGHT,
  LANE_PALETTE,
  LANE_V_DEFAULT_LENGTH,
  LANE_V_MIN_WIDTH,
  LANE_V_WIDTH,
  laneAtPoint,
  nodeHeight,
  relayoutLanes,
  ROW_GAP,
  sizeOfNode,
  sortParentsFirst,
} from "../lib/layout";

const HISTORY_LIMIT = 60;
type Snapshot = { nodes: AppNode[]; edges: AppEdge[]; orientation: Orientation };

/** Panah koneksi sedikit lebih besar agar terlihat jelas di layar maupun hasil ekspor. */
export const EDGE_MARKER = { type: MarkerType.ArrowClosed, width: 20, height: 20 } as const;

interface CanvasState {
  flowId: string | null;
  version: number;
  readOnly: boolean;
  orientation: Orientation;
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
  // layout
  setOrientation: (o: Orientation) => void;
  tidyLayout: () => void;
  // lanes
  addLane: () => void;
  removeLane: (id: string) => void;
  moveLane: (id: string, dir: -1 | 1) => void;
  /** horizontal: ubah tinggi lane. vertical: ubah lebar kolom. */
  resizeLane: (id: string, size: number) => void;
  /** horizontal: perlebar lane. vertical: perpanjang kolom ke bawah. */
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
  markerEnd: EDGE_MARKER,
});

/** Ubah dokumen tersimpan -> node/edge React Flow. */
export function documentToFlow(doc: FlowDocument): Snapshot {
  const orientation: Orientation = doc.orientation ?? "horizontal";
  const vertical = orientation === "vertical";
  const nodes: AppNode[] = doc.nodes.map((n) => {
    if (n.type === "lane") {
      const base = createLaneNode(
        n.id,
        n.data.title,
        n.data.color,
        n.width ?? (vertical ? LANE_V_WIDTH : LANE_DEFAULT_WIDTH),
        n.height ?? (vertical ? LANE_V_DEFAULT_LENGTH : LANE_DEFAULT_HEIGHT),
      );
      return { ...base, position: n.position, data: n.data };
    }
    return { ...createStepNode(n.id, n.type, n.position, n.parentId ?? "", n.data.title), data: n.data };
  });
  const edges: AppEdge[] = doc.edges.map((e) => ({
    ...e,
    type: "smoothstep",
    markerEnd: EDGE_MARKER,
  }));
  return { nodes: relayoutLanes(sortParentsFirst(nodes), orientation), edges, orientation };
}

export const useCanvasStore = create<CanvasState>()((set, get) => {
  const snapshot = (s: CanvasState): Snapshot => ({ nodes: s.nodes, edges: s.edges, orientation: s.orientation });

  /** Terapkan perubahan konten: simpan history + tandai dirty. */
  const mutate = (fn: (s: CanvasState) => Partial<CanvasState>) => {
    const s = get();
    if (s.readOnly) return;
    set({
      past: [...s.past, snapshot(s)].slice(-HISTORY_LIMIT),
      future: [],
      ...fn(s),
      saveStatus: "dirty",
    });
  };

  return {
    flowId: null,
    version: 1,
    readOnly: true,
    orientation: "horizontal",
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
      set({ past: [...s.past, snapshot(s)].slice(-HISTORY_LIMIT), future: [] });
    },

    undo: () => {
      const s = get();
      const prev = s.past.at(-1);
      if (!prev || s.readOnly) return;
      set({
        nodes: prev.nodes,
        edges: prev.edges,
        orientation: prev.orientation,
        past: s.past.slice(0, -1),
        future: [snapshot(s), ...s.future],
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
        orientation: next.orientation,
        past: [...s.past, snapshot(s)],
        future: s.future.slice(1),
        saveStatus: "dirty",
        selectedId: null,
      });
    },

    setOrientation: (o) => {
      if (get().orientation === o) return;
      mutate((s) => {
        const c = convertLayout(s.nodes, s.edges, s.orientation, o);
        return { nodes: c.nodes, edges: c.edges, orientation: o };
      });
    },

    tidyLayout: () =>
      mutate((s) => {
        const c = convertLayout(s.nodes, s.edges, s.orientation, s.orientation);
        return { nodes: c.nodes, edges: c.edges };
      }),

    addLane: () =>
      mutate((s) => {
        const lanes = s.nodes.filter(isLane);
        const color: LaneColor = LANE_PALETTE[lanes.length % LANE_PALETTE.length]!;
        const vertical = s.orientation === "vertical";
        const width = vertical ? LANE_V_WIDTH : (lanes[0]?.width ?? LANE_DEFAULT_WIDTH);
        const height = vertical ? (lanes[0]?.height ?? LANE_V_DEFAULT_LENGTH) : LANE_DEFAULT_HEIGHT;
        const lane = createLaneNode(`lane_${nanoid(8)}`, `Divisi ${lanes.length + 1}`, color, width, height);
        return { nodes: relayoutLanes(sortParentsFirst([...s.nodes, lane]), s.orientation), selectedId: lane.id };
      }),

    removeLane: (id) =>
      mutate((s) => {
        const removed = new Set([id, ...s.nodes.filter((n) => n.parentId === id).map((n) => n.id)]);
        return {
          nodes: relayoutLanes(
            s.nodes.filter((n) => !removed.has(n.id)),
            s.orientation,
          ),
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
        return { nodes: relayoutLanes([...reordered, ...others], s.orientation) };
      }),

    resizeLane: (id, size) =>
      mutate((s) => {
        const vertical = s.orientation === "vertical";
        return {
          nodes: relayoutLanes(
            s.nodes.map((n) => {
              if (n.id !== id) return n;
              return vertical
                ? { ...n, width: Math.max(LANE_V_MIN_WIDTH, Math.round(size)) }
                : { ...n, height: Math.max(LANE_MIN_HEIGHT, Math.round(size)) };
            }),
            s.orientation,
          ),
        };
      }),

    widenLanes: (by) =>
      mutate((s) => {
        const vertical = s.orientation === "vertical";
        return {
          nodes: s.nodes.map((n) => {
            if (!isLane(n)) return n;
            return vertical
              ? { ...n, height: (n.height ?? LANE_V_DEFAULT_LENGTH) + by }
              : { ...n, width: (n.width ?? LANE_DEFAULT_WIDTH) + by };
          }),
        };
      }),

    addStep: (type, opts) =>
      mutate((s) => {
        const lanes = s.nodes.filter(isLane);
        if (lanes.length === 0) return {}; // UI menonaktifkan tombol; guard tambahan
        const vertical = s.orientation === "vertical";
        const selected = s.nodes.find((n) => n.id === s.selectedId);
        const lane =
          lanes.find((l) => l.id === opts?.laneId) ??
          (opts?.position ? laneAtPoint(lanes, opts.position, s.orientation) : undefined) ??
          (isLane(selected) ? selected : lanes.find((l) => l.id === selected?.parentId)) ??
          lanes[0]!;

        const titles = { step: "Langkah baru", decision: "Keputusan?", terminal: "Mulai / Selesai" } as const;
        const size = estimateNodeSize(type, { title: titles[type] });
        const laneW = lane.width ?? (vertical ? LANE_V_WIDTH : LANE_DEFAULT_WIDTH);

        let pos: { x: number; y: number };
        if (opts?.position) {
          pos = { x: opts.position.x - lane.position.x - size.w / 2, y: opts.position.y - lane.position.y - size.h / 2 };
        } else if (vertical) {
          // Letakkan di bawah step paling bawah (di semua lane) agar alur terus mengalir ke bawah.
          const bottom = s.nodes.filter(isStep).reduce((m, n) => Math.max(m, n.position.y + (lanes.find((l) => l.id === n.parentId)?.position.y ?? 0) + sizeOfNode(n).h), FIRST_ROW_Y - ROW_GAP);
          pos = { x: Math.round((laneW - size.w) / 2), y: bottom + ROW_GAP };
        } else {
          // Letakkan setelah step paling kanan di lane tsb.
          const rightmost = s.nodes.filter((n) => n.parentId === lane.id).reduce((m, n) => Math.max(m, n.position.x), FIRST_COL_X - COL_GAP);
          pos = { x: rightmost + COL_GAP, y: (nodeHeight(lane, LANE_DEFAULT_HEIGHT) - size.h) / 2 };
        }

        // Vertical: perpanjang semua kolom bila step baru melewati batas bawah.
        let nodes = s.nodes;
        if (vertical) {
          const need = Math.ceil(pos.y + size.h + 56);
          if (need > nodeHeight(lane, LANE_V_DEFAULT_LENGTH)) {
            nodes = nodes.map((n) => (isLane(n) ? { ...n, height: Math.max(n.height ?? 0, need) } : n));
          }
        }
        const laneNow = nodes.find((n) => n.id === lane.id) as typeof lane;
        const node = createStepNode(`n_${nanoid(8)}`, type, clampInLane(laneNow, pos, size, s.orientation), lane.id, titles[type]);
        return { nodes: [...nodes, node], selectedId: node.id };
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
      const size = sizeOfNode(node);
      const target = laneAtPoint(lanes, { x: absX + size.w / 2, y: absY + size.h / 2 }, s.orientation);
      if (!target) return;
      const rel = clampInLane(target, { x: absX - target.position.x, y: absY - target.position.y }, size, s.orientation);
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
