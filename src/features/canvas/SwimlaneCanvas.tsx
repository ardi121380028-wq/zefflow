"use client";

import { useCallback, useEffect, useMemo } from "react";
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  Controls,
  MarkerType,
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
import { PALETTE_MIME, Toolbar } from "./panels/Toolbar";
import { useCanvasStore } from "./store/canvas-store";
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

const defaultEdgeOptions = { type: "smoothstep", markerEnd: { type: MarkerType.ArrowClosed } } as const;

interface Props {
  flowId: string;
  initialDocument: FlowDocument;
  initialVersion: number;
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

function CanvasInner({ flowId, initialDocument, initialVersion, readOnly = false, onReady }: Props) {
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const hydrated = useCanvasStore((s) => s.flowId === flowId);
  const store = useCanvasStore.getState();
  const { screenToFlowPosition, fitView } = useReactFlow();
  const { saveNow } = useAutosave();
  const { theme } = useTheme();

  // Hydrate store sekali per flow.
  useEffect(() => {
    useCanvasStore.getState().init({ flowId, doc: initialDocument, version: initialVersion, readOnly });
    // fitView setelah node ter-render
    const t = setTimeout(() => fitView({ padding: 0.15, maxZoom: 1, duration: 300 }), 80);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowId]);

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

      const targetNode = useCanvasStore.getState().nodes.find((n) => n.id === targetId);
      if (!targetNode || targetNode.type === "lane") return;

      const fromNode = connectionState.fromNode;
      const fromHandle = connectionState.fromHandle?.id ?? "r";

      // Pilih target handle yang paling natural berdasar posisi relatif
      let targetHandle = "l";
      const dx = (targetNode.position?.x ?? 0) - (fromNode.position?.x ?? 0);
      const dy = (targetNode.position?.y ?? 0) - (fromNode.position?.y ?? 0);

      if (Math.abs(dx) > Math.abs(dy)) {
        targetHandle = dx >= 0 ? "l" : "r";
      } else {
        targetHandle = dy >= 0 ? "t" : "b";
      }

      useCanvasStore.getState().onConnect({
        source: fromNode.id,
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
      onNodesChange={store.onNodesChange}
      onEdgesChange={store.onEdgesChange}
      onConnect={store.onConnect}
      onConnectEnd={onConnectEnd}
      connectionRadius={48}
      onSelectionChange={onSelectionChange}
      onPaneClick={() => useCanvasStore.getState().select(null)}
      onNodeDragStart={() => useCanvasStore.getState().commit()}
      onNodeDragStop={(_, node, dragged) => {
        // Pindahkan ke lane di bawahnya (mendukung multi-select drag).
        const s = useCanvasStore.getState();
        (dragged.length ? dragged : [node]).forEach((n) => s.reparentOnDragStop(n.id));
      }}
      onBeforeDelete={async () => {
        useCanvasStore.getState().commit(); // satu snapshot undo sebelum hapus
        return true;
      }}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
      onDrop={onDrop}
      defaultEdgeOptions={defaultEdgeOptions}
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
      <Controls showInteractive={false} position="bottom-left" />
      <MiniMap
        pannable
        zoomable
        position="bottom-right"
        nodeColor={miniMapColor}
        maskColor={theme === "dark" ? "rgba(8, 9, 12, 0.8)" : "rgba(248, 250, 252, 0.8)"}
        className="!hidden md:!block"
      />
      {!readOnly && (
        <Panel position="top-center">
          <Toolbar />
        </Panel>
      )}
      {nodes.length === 0 && !readOnly && <EmptyHint />}
      <Inspector />
    </ReactFlow>
  );
}

function EmptyHint() {
  return (
    <Panel position="top-center" className="!top-1/3 pointer-events-none">
      <div className="animate-fade-up text-center">
        <p className="font-display text-xl font-semibold">Mulai dengan menambahkan lane</p>
        <p className="mt-1 text-sm text-muted-foreground">Setiap lane mewakili satu divisi. Lalu seret langkah kerja ke dalamnya.</p>
      </div>
    </Panel>
  );
}
