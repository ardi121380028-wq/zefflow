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
  LANE_V_HEADER_HEIGHT,
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
type Snapshot = {
  nodes: AppNode[];
  edges: AppEdge[];
  orientation: Orientation;
  companyLogo?: string;
  companyName?: string;
  docCode?: string;
};

/** Panah koneksi sedikit lebih besar agar terlihat jelas di layar maupun hasil ekspor. */
export const EDGE_MARKER = { type: MarkerType.ArrowClosed, width: 20, height: 20 } as const;

export type SidebarTab = "layers" | "outline" | "branding" | "assets";

interface CanvasState {
  flowId: string | null;
  version: number;
  readOnly: boolean;
  orientation: Orientation;
  companyLogo: string;
  companyName: string;
  docCode: string;
  nodes: AppNode[];
  edges: AppEdge[];
  selectedId: string | null;
  kind: "sop" | "journey" | "architect";
  saveStatus: SaveStatus;
  past: Snapshot[];
  future: Snapshot[];

  updateBranding: (b: { companyLogo?: string; companyName?: string; docCode?: string }) => void;

  // lifecycle
  init: (p: { flowId: string; doc: FlowDocument; version: number; readOnly: boolean; kind?: "sop" | "journey" | "architect" }) => void;
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
  quickAddStepFromNode: (sourceNodeId: string, handle: "l" | "r" | "t" | "b", type: StepNodeType["type"]) => void;
  reparentOnDragStop: (nodeId: string) => void;
  // data
  updateNodeData: (id: string, patch: Partial<LaneData & StepData>) => void;
  updateEdgeLabel: (id: string, label: string) => void;
  select: (id: string | null) => void;
  deleteSelected: (id?: string) => void;
  // sidebar & icon rail (figma style)
  sidebarOpen: boolean;
  activeSidebarTab: SidebarTab | null;
  setSidebarOpen: (open: boolean) => void;
  setActiveSidebarTab: (tab: SidebarTab | null) => void;
  toggleSidebarTab: (tab: SidebarTab) => void;
  toggleSidebar: () => void;
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
  return {
    nodes: relayoutLanes(sortParentsFirst(nodes), orientation),
    edges,
    orientation,
    companyLogo: doc.companyLogo ?? "",
    companyName: doc.companyName ?? "",
    docCode: doc.docCode ?? "",
  };
}

export const useCanvasStore = create<CanvasState>()((set, get) => {
  const snapshot = (s: CanvasState): Snapshot => ({
    nodes: s.nodes,
    edges: s.edges,
    orientation: s.orientation,
    companyLogo: s.companyLogo,
    companyName: s.companyName,
    docCode: s.docCode,
  });

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
    companyLogo: "",
    companyName: "",
    docCode: "",
    nodes: [],
    edges: [],
    selectedId: null,
    kind: "sop",
    sidebarOpen: false,
    activeSidebarTab: null,
    saveStatus: "idle",
    past: [],
    future: [],

    updateBranding: (b) => {
      mutate((s) => ({
        companyLogo: b.companyLogo !== undefined ? b.companyLogo : s.companyLogo,
        companyName: b.companyName !== undefined ? b.companyName : s.companyName,
        docCode: b.docCode !== undefined ? b.docCode : s.docCode,
      }));
    },

    setSidebarOpen: (sidebarOpen) =>
      set({ sidebarOpen, activeSidebarTab: sidebarOpen ? (get().activeSidebarTab ?? "layers") : null }),
    setActiveSidebarTab: (activeSidebarTab) =>
      set({ activeSidebarTab, sidebarOpen: activeSidebarTab !== null }),
    toggleSidebarTab: (tab) =>
      set((s) => {
        const isCurrentOpen = s.sidebarOpen && s.activeSidebarTab === tab;
        return {
          sidebarOpen: !isCurrentOpen,
          activeSidebarTab: !isCurrentOpen ? tab : null,
        };
      }),
    toggleSidebar: () =>
      set((s) => {
        const nextOpen = !s.sidebarOpen;
        return {
          sidebarOpen: nextOpen,
          activeSidebarTab: nextOpen ? (s.activeSidebarTab ?? "layers") : null,
        };
      }),

    init: ({ flowId, doc, version, readOnly, kind = "sop" }) =>
      set({ flowId, version, readOnly, kind, ...documentToFlow(doc), selectedId: null, saveStatus: "idle", past: [], future: [] }),

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
        companyLogo: prev.companyLogo ?? "",
        companyName: prev.companyName ?? "",
        docCode: prev.docCode ?? "",
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
        companyLogo: next.companyLogo ?? "",
        companyName: next.companyName ?? "",
        docCode: next.docCode ?? "",
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
        if (lanes.length === 0 || s.kind === "architect") {
          const titles = {
            step: "tabel_baru",
            decision: "Router / Event",
            terminal: "API Endpoint",
          } as const;
          const pos = opts?.position ?? {
            x: 180 + (s.nodes.length % 4) * 320,
            y: 100 + Math.floor(s.nodes.length / 4) * 220,
          };
          const node = createStepNode(`n_${nanoid(8)}`, type, pos, undefined as any, titles[type]);
          if (type === "step") {
            node.data.description = "id (UUID PK)\ncreated_at (TIMESTAMP)\nupdated_at (TIMESTAMP)";
            node.data.output = "Database Table";
          }
          return { nodes: [...s.nodes, node], selectedId: node.id };
        }

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

    quickAddStepFromNode: (sourceNodeId, handle, type) =>
      mutate((s) => {
        const sourceNode = s.nodes.find((n) => n.id === sourceNodeId);
        if (!sourceNode || sourceNode.type === "lane") return {};

        const lanes = s.nodes.filter(isLane);
        if (lanes.length === 0 || s.kind === "architect") {
          const titles = { step: "tabel_terkait", decision: "Event Broker", terminal: "Service API" } as const;
          const defaultTitle = titles[type];
          const newSize = estimateNodeSize(type, { title: defaultTitle });
          const sourceSize = sizeOfNode(sourceNode);
          let pos = { x: sourceNode.position.x + sourceSize.w + 80, y: sourceNode.position.y };
          if (handle === "b") pos = { x: sourceNode.position.x, y: sourceNode.position.y + sourceSize.h + 80 };
          else if (handle === "t") pos = { x: sourceNode.position.x, y: sourceNode.position.y - newSize.h - 80 };
          else if (handle === "l") pos = { x: sourceNode.position.x - newSize.w - 80, y: sourceNode.position.y };

          const newNodeId = `step_${nanoid(8)}`;
          const newNode = createStepNode(newNodeId, type, pos, undefined as any, defaultTitle);
          if (type === "step") {
            newNode.data.description = "id (UUID PK)\nrelasi_id (UUID FK)\ncreated_at (TIMESTAMP)";
            newNode.data.output = "Database Table";
          }
          const newEdge: AppEdge = {
            id: `e_${nanoid(8)}`,
            source: sourceNode.id,
            target: newNodeId,
            sourceHandle: handle,
            targetHandle: handle === "r" ? "l" : handle === "l" ? "r" : handle === "b" ? "t" : "b",
            type: "smoothstep",
            markerEnd: EDGE_MARKER,
          };
          return {
            nodes: [...s.nodes, newNode],
            edges: [...s.edges, newEdge],
            selectedId: newNodeId,
          };
        }

        const vertical = s.orientation === "vertical";
        const currentLaneIdx = lanes.findIndex((l) => l.id === sourceNode.parentId);
        const currentLane = lanes[currentLaneIdx] ?? lanes[0]!;

        const titles = { step: "Langkah baru", decision: "Keputusan?", terminal: "Selesai" } as const;
        const defaultTitle = titles[type];
        const newSize = estimateNodeSize(type, { title: defaultTitle });
        const sourceSize = sizeOfNode(sourceNode);

        let targetLane = currentLane;
        let pos = { x: sourceNode.position.x, y: sourceNode.position.y };
        let sourceHandle = handle;
        let targetHandle: "l" | "r" | "t" | "b" = "t";
        let edgeLabel: string | undefined = undefined;

        if (vertical) {
          if (handle === "b") {
            targetLane = currentLane;
            const laneW = targetLane.width ?? LANE_V_WIDTH;
            pos = {
              x: Math.round((laneW - newSize.w) / 2),
              y: sourceNode.position.y + sourceSize.h + ROW_GAP,
            };
            sourceHandle = "b";
            targetHandle = "t";
            if (sourceNode.type === "decision") edgeLabel = "Tidak";
          } else if (handle === "r") {
            const nextLane = lanes[currentLaneIdx + 1];
            if (nextLane) {
              targetLane = nextLane;
              const laneW = targetLane.width ?? LANE_V_WIDTH;
              pos = {
                x: Math.round((laneW - newSize.w) / 2),
                y: sourceNode.position.y + 12,
              };
              sourceHandle = "r";
              targetHandle = "l";
            } else {
              targetLane = currentLane;
              pos = {
                x: sourceNode.position.x,
                y: sourceNode.position.y + sourceSize.h + ROW_GAP,
              };
              sourceHandle = "b";
              targetHandle = "t";
            }
            if (sourceNode.type === "decision") edgeLabel = "Ya";
          } else if (handle === "l") {
            const prevLane = lanes[currentLaneIdx - 1];
            if (prevLane) {
              targetLane = prevLane;
              const laneW = targetLane.width ?? LANE_V_WIDTH;
              pos = {
                x: Math.round((laneW - newSize.w) / 2),
                y: sourceNode.position.y + 12,
              };
              sourceHandle = "l";
              targetHandle = "r";
            } else {
              targetLane = currentLane;
              pos = {
                x: sourceNode.position.x,
                y: sourceNode.position.y + sourceSize.h + ROW_GAP,
              };
              sourceHandle = "b";
              targetHandle = "t";
            }
            if (sourceNode.type === "decision") edgeLabel = "Revisi";
          } else if (handle === "t") {
            targetLane = currentLane;
            pos = {
              x: sourceNode.position.x,
              y: Math.max(LANE_V_HEADER_HEIGHT + 24, sourceNode.position.y - newSize.h - ROW_GAP),
            };
            sourceHandle = "t";
            targetHandle = "b";
          }
        } else {
          // Horizontal
          if (handle === "r") {
            targetLane = currentLane;
            pos = {
              x: sourceNode.position.x + COL_GAP,
              y: sourceNode.position.y,
            };
            sourceHandle = "r";
            targetHandle = "l";
            if (sourceNode.type === "decision") edgeLabel = "Ya";
          } else if (handle === "b") {
            const nextLane = lanes[currentLaneIdx + 1];
            if (nextLane) {
              targetLane = nextLane;
              pos = {
                x: sourceNode.position.x,
                y: 20,
              };
              sourceHandle = "b";
              targetHandle = "t";
            } else {
              targetLane = currentLane;
              pos = {
                x: sourceNode.position.x + COL_GAP,
                y: sourceNode.position.y,
              };
              sourceHandle = "r";
              targetHandle = "l";
            }
            if (sourceNode.type === "decision") edgeLabel = "Tidak";
          } else if (handle === "t") {
            const prevLane = lanes[currentLaneIdx - 1];
            if (prevLane) {
              targetLane = prevLane;
              pos = {
                x: sourceNode.position.x,
                y: 20,
              };
              sourceHandle = "t";
              targetHandle = "b";
            }
          } else if (handle === "l") {
            targetLane = currentLane;
            pos = {
              x: Math.max(FIRST_COL_X, sourceNode.position.x - COL_GAP),
              y: sourceNode.position.y,
            };
            sourceHandle = "l";
            targetHandle = "r";
          }
        }

        // Auto extend lane height if needed
        let nodes = s.nodes;
        if (vertical) {
          const need = Math.ceil(pos.y + newSize.h + 80);
          if (need > nodeHeight(targetLane, LANE_V_DEFAULT_LENGTH)) {
            nodes = nodes.map((n) => (isLane(n) ? { ...n, height: Math.max(n.height ?? 0, need) } : n));
          }
        } else {
          const need = Math.ceil(pos.x + newSize.w + 100);
          if (need > (targetLane.width ?? LANE_DEFAULT_WIDTH)) {
            nodes = nodes.map((n) => (isLane(n) ? { ...n, width: Math.max(n.width ?? 0, need) } : n));
          }
        }

        const clampedPos = clampInLane(targetLane, pos, newSize, s.orientation);
        const newNodeId = `step_${nanoid(8)}`;
        const newNode = createStepNode(newNodeId, type, clampedPos, targetLane.id, defaultTitle);

        const newEdge: AppEdge = {
          id: `e_${nanoid(8)}`,
          source: sourceNode.id,
          target: newNodeId,
          sourceHandle,
          targetHandle,
          type: "smoothstep",
          markerEnd: EDGE_MARKER,
          ...(edgeLabel ? { label: edgeLabel } : {}),
        };

        return {
          nodes: sortParentsFirst([...nodes, newNode]),
          edges: [...s.edges, newEdge],
          selectedId: newNodeId,
        };
      }),

    /** Dipanggil saat drag berakhir: pindahkan step ke lane yang berada di bawahnya. */
    reparentOnDragStop: (nodeId) => {
      const s = get();
      if (s.kind === "architect" || s.nodes.filter(isLane).length === 0) return;
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

    deleteSelected: (id?: string) => {
      const s = get();
      const targetId = id ?? s.selectedId;
      if (s.readOnly || !targetId) return;
      const n = s.nodes.find((x) => x.id === targetId);
      if (isLane(n)) return get().removeLane(n.id);
      mutate((st) => ({
        nodes: st.nodes.filter((x) => x.id !== targetId),
        edges: st.edges.filter((e) => e.source !== targetId && e.target !== targetId && e.id !== targetId),
        selectedId: s.selectedId === targetId ? null : s.selectedId,
      }));
    },

    setSaveStatus: (saveStatus) => set({ saveStatus }),
    markSaved: (version) => set((s) => ({ version, saveStatus: s.saveStatus === "dirty" ? "dirty" : "saved" })),
  };
});
