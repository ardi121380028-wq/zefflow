"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Map as MapIcon } from "lucide-react";
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  Controls,
  MiniMap,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type NodeTypes,
  type OnSelectionChangeParams,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { FlowDocument } from "@/lib/validation/flow";
import { DecisionNode, StepNode, TerminalNode } from "./nodes/StepNodes";
import { LaneNode } from "./nodes/LaneNode";
import { CustomEdge } from "./edges/CustomEdge";
import { Inspector } from "./panels/Inspector";
import { LayersPanel } from "./panels/LayersPanel";
import { StudioSidebarRail } from "./panels/StudioSidebarRail";
import { PALETTE_MIME, Toolbar } from "./panels/Toolbar";
import { EDGE_MARKER, useCanvasStore } from "./store/canvas-store";
import { absRect, pickHandles } from "./lib/layout";
import { useAutosave } from "./store/use-autosave";
import type { StepNodeType } from "./types";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/use-theme";

// Didefinisikan di luar komponen: identitas stabil -> tidak re-render semua node.
const nodeTypes = {
  lane: LaneNode,
  step: StepNode,
  decision: DecisionNode,
  terminal: TerminalNode,
} as unknown as NodeTypes;

const edgeTypes = {
  smoothstep: CustomEdge,
  default: CustomEdge,
};

const defaultEdgeOptions = { type: "smoothstep", markerEnd: EDGE_MARKER } as const;

interface Props {
  flowId: string;
  initialDocument: FlowDocument;
  initialVersion: number;
  kind?: "sop" | "journey" | "architect";
  readOnly?: boolean;
  /** Dipanggil agar header editor bisa memicu simpan manual (Ctrl+S / tombol). */
  onReady?: (api: { saveNow: () => Promise<void> }) => void;
}

/** Canvas swimlane interaktif berbasis React Flow + Zustand. */
export function SwimlaneCanvas(props: Props) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
}

function CanvasInner({ flowId, initialDocument, initialVersion, kind, readOnly = false, onReady }: Props) {
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const hydrated = useCanvasStore((s) => s.flowId === flowId);
  const orientation = useCanvasStore((s) => s.orientation);
  const isExporting = useCanvasStore((s) => s.isExporting);
  const [forceMiniMap, setForceMiniMap] = useState(false);
  const { screenToFlowPosition, fitView } = useReactFlow();
  const { saveNow } = useAutosave();
  const { theme } = useTheme();
  const largeGraph = nodes.length > 350;
  const showMiniMap = !largeGraph || forceMiniMap;

  // Hydrate store sekali per flow.
  useEffect(() => {
    useCanvasStore.getState().init({ flowId, doc: initialDocument, version: initialVersion, readOnly, kind });
    // fitView setelah node ter-render
    const t = setTimeout(() => fitView({ padding: 0.15, maxZoom: 1, duration: 300 }), 80);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowId]);

  // Fit ulang saat arah alur berubah (konversi layout).
  useEffect(() => {
    const t = setTimeout(() => fitView({ padding: 0.15, maxZoom: 1, duration: 300 }), 80);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orientation]);

  useEffect(() => onReady?.({ saveNow }), [onReady, saveNow]);

  // Shortcut keyboard (abaikan saat mengetik di input).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable;
      const mod = e.ctrlKey || e.metaKey;
      const s = useCanvasStore.getState();
      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void saveNow();
      } else if (!typing && mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        e.shiftKey ? s.redo() : s.undo();
      } else if (!typing && mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        s.redo();
      } else if (!typing && mod && e.key.toLowerCase() === "b") {
        e.preventDefault();
        s.toggleSidebar();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [saveNow]);

  const onSelectionChange = useCallback(({ nodes: ns, edges: es }: OnSelectionChangeParams) => {
    const id = ns[0]?.id ?? es[0]?.id ?? null;
    // Jangan menimpa seleksi lane (lane dipilih lewat header, bukan lewat RF)
    const cur = useCanvasStore.getState();
    if (id === null && cur.nodes.find((n) => n.id === cur.selectedId)?.type === "lane") return;
    cur.select(id);
  }, []);

  // Drop dari palette: hitung posisi flow lalu tentukan lane di bawah kursor.
  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer.getData(PALETTE_MIME) as StepNodeType["type"];
      if (!["step", "decision", "terminal"].includes(type)) return;
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      useCanvasStore.getState().addStep(type, { position });
    },
    [screenToFlowPosition],
  );

  // Jika koneksi dilepas di atas shape target mana saja (bukan hanya titik handle), otomatis sambungkan!
  const onConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent, connectionState: any) => {
      if (connectionState?.isValid || !connectionState?.fromNode) return;

      const targetEl = (
        event instanceof MouseEvent
          ? (event.target as HTMLElement)
          : document.elementFromPoint(
              (event as TouchEvent).changedTouches?.[0]?.clientX ?? 0,
              (event as TouchEvent).changedTouches?.[0]?.clientY ?? 0,
            )
      ) as HTMLElement | null;

      const nodeEl = targetEl?.closest(".react-flow__node") as HTMLElement | null;
      const targetId = nodeEl?.getAttribute("data-id");

      if (!targetId || targetId === connectionState.fromNode.id) return;

      const state = useCanvasStore.getState();
      const targetNode = state.nodes.find((n) => n.id === targetId);
      const sourceNode = state.nodes.find((n) => n.id === connectionState.fromNode.id);
      if (!targetNode || !sourceNode || targetNode.type === "lane") return;

      const fromHandle = connectionState.fromHandle?.id ?? "r";

      // Pilih handle tujuan paling natural dari posisi absolut kedua node.
      const [, targetHandle] = pickHandles(
        absRect(sourceNode, state.nodes),
        absRect(targetNode, state.nodes),
        sourceNode.type === "decision",
        state.orientation,
      );

      state.onConnect({
        source: sourceNode.id,
        sourceHandle: fromHandle,
        target: targetId,
        targetHandle,
      });
    },
    [],
  );

  const miniMapColor = useMemo(
    () => (n: { type?: string }) => (n.type === "lane" ? (theme === "dark" ? "#1a1b26" : "#e2e8f0") : "#8b5cf6"),
    [theme],
  );

  if (!hydrated) return <div className="skeleton h-full w-full rounded-none" aria-busy />;

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodesChange={useCanvasStore.getState().onNodesChange}
      onEdgesChange={useCanvasStore.getState().onEdgesChange}
      onConnect={useCanvasStore.getState().onConnect}
      onConnectEnd={onConnectEnd}
      connectionRadius={48}
      onSelectionChange={onSelectionChange}
      onPaneClick={() => useCanvasStore.getState().select(null)}
      onNodeDragStart={() => {
        const s = useCanvasStore.getState();
        s.setDragging(true);
        s.commit();
      }}
      onNodeDragStop={(_, node, dragged) => {
        // Pindahkan ke lane di bawahnya dalam satu batch set() tunggal (mendukung multi-select drag).
        const s = useCanvasStore.getState();
        const draggedIds = (dragged.length ? dragged : [node]).map((n) => n.id);
        s.reparentOnDragStop(draggedIds);
        s.setDragging(false);
      }}
      onBeforeDelete={async () => {
        useCanvasStore.getState().commit(); // satu snapshot undo sebelum hapus
        return true;
      }}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
      onDrop={onDrop}
      onlyRenderVisibleElements={!isExporting && nodes.length > 40}
      elevateEdgesOnSelect={nodes.length <= 500}
      defaultEdgeOptions={defaultEdgeOptions}
      defaultMarkerColor={theme === "dark" ? "#a1a1aa" : "#475569"}
      connectionMode={ConnectionMode.Loose}
      nodesDraggable={!readOnly}
      nodesConnectable={!readOnly}
      edgesReconnectable={!readOnly}
      deleteKeyCode={readOnly ? null : ["Backspace", "Delete"]}
      snapToGrid
      snapGrid={[8, 8]}
      minZoom={0.15}
      maxZoom={1.75}
      panOnScroll
      selectionOnDrag={false}
      proOptions={{ hideAttribution: true }}
      colorMode={theme}
      className={cn("!bg-[hsl(var(--canvas-bg))]", theme === "dark" ? "dark" : "light")}
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={22}
        size={1.4}
        color={theme === "dark" ? "rgba(255, 255, 255, 0.09)" : "rgba(15, 23, 42, 0.12)"}
      />
      <Controls
        showInteractive={false}
        position="bottom-left"
        className="!left-3 sm:!left-4 !bottom-3 sm:!bottom-4"
      />
      {showMiniMap && (
        <MiniMap
          pannable
          zoomable
          position="bottom-right"
          nodeColor={miniMapColor}
          maskColor={theme === "dark" ? "rgba(8, 9, 12, 0.8)" : "rgba(248, 250, 252, 0.8)"}
          className="!hidden md:!block"
        />
      )}
      {largeGraph && (
        <Panel position="bottom-right" className="!hidden md:!block !mr-3 !mb-3">
          <button
            type="button"
            onClick={() => setForceMiniMap((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card/95 px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground shadow-md transition-colors hover:text-foreground"
            title={forceMiniMap ? "Sembunyikan Peta Mini untuk menghemat GPU" : "Tampilkan Peta Mini"}
          >
            <MapIcon className="h-3.5 w-3.5" />
            <span>{forceMiniMap ? "Tutup Peta Mini" : `Peta Mini (${nodes.length})`}</span>
          </button>
        </Panel>
      )}

      {/* Rail Ikon Vertikal Figma-Style di Kiri Kanvas */}
      {!readOnly && <StudioSidebarRail />}

      {/* Drawer Flyout Samping (Struktur, Ringkasan, Logo, & Aset) */}
      {!readOnly && <LayersPanel />}

      {/* Toolbar studio melayang di Bawah Tengah (Figma-Style Command Dock) */}
      {!readOnly && (
        <Panel position="bottom-center" className="!mb-4 sm:!mb-6">
          <Toolbar />
        </Panel>
      )}
      {nodes.length === 0 && !readOnly && <EmptyHint kind={kind} />}
      <Inspector />
    </ReactFlow>
  );
}

function EmptyHint({ kind }: { kind?: "sop" | "journey" | "architect" }) {
  const isArchitect = kind === "architect";
  return (
    <Panel position="top-center" className="!top-1/3 pointer-events-none">
      <div className="animate-fade-up text-center max-w-md px-4">
        <p className="font-display text-xl font-bold tracking-tight text-foreground">
          {isArchitect ? "Mulai Mendesain Arsitektur & Database" : "Mulai dengan menambahkan lane"}
        </p>
        <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
          {isArchitect
            ? "Studio 2 adalah kanvas bebas tanpa divisi. Gunakan tombol Tabel ERD, Service API, atau Gateway di toolbar bawah untuk mulai merancang komponen."
            : "Setiap lane mewakili satu divisi atau jalur kerja. Lalu seret langkah kerja ke dalamnya."}
        </p>
      </div>
    </Panel>
  );
}
