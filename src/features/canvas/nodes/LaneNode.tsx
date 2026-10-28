"use client";

import { memo } from "react";
import { NodeResizeControl, type NodeProps } from "@xyflow/react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, GripHorizontal, GripVertical, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCanvasStore } from "../store/canvas-store";
import { LANE_HEADER_WIDTH, LANE_MIN_HEIGHT, LANE_STYLES, LANE_V_HEADER_HEIGHT, LANE_V_MIN_WIDTH } from "../lib/layout";
import type { LaneNodeType } from "../types";

/**
 * Satu lane = satu divisi/departemen (Parent node di React Flow).
 * - horizontal: header di kiri, alur ke samping.
 * - vertical  : header di atas (kolom), alur ke bawah.
 */
function LaneNodeImpl({ id, data, width, height }: NodeProps<LaneNodeType>) {
  const readOnly = useCanvasStore((s) => s.readOnly);
  const selected = useCanvasStore((s) => s.selectedId === id);
  const vertical = useCanvasStore((s) => s.orientation === "vertical");
  const select = useCanvasStore((s) => s.select);
  const { moveLane, removeLane, resizeLane } = useCanvasStore.getState();
  const style = LANE_STYLES[data.color];

  const confirmRemove = () => {
    if (window.confirm(`Hapus lane "${data.title}" beserta semua langkah di dalamnya?`)) removeLane(id);
  };

  const headerContent = (
    <>
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <span className={cn("h-3 w-3 shrink-0 rounded-full", style.dot)} />
          <p className="truncate font-display text-[17px] font-bold leading-tight tracking-tight text-foreground">
            {data.title || "Tanpa nama"}
          </p>
        </div>
        {data.division && (
          <p className="mt-1.5 line-clamp-2 font-mono text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
            {data.division}
          </p>
        )}
      </div>
    </>
  );

  if (vertical) {
    return (
      <div
        className={cn("group relative flex h-full w-full flex-col overflow-visible border-r border-border/70 transition-colors", style.band)}
        style={{ width, height }}
      >
        {/* Header kolom (atas) */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => select(id)}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && select(id)}
          className={cn(
            "pointer-events-auto relative flex shrink-0 cursor-pointer flex-col justify-center overflow-hidden px-5 pb-3 pt-5 outline-none backdrop-blur-md transition-all duration-150",
            selected && "bg-primary/10 shadow-[inset_0_0_0_2px_hsl(var(--primary))]",
            style.headerV,
          )}
          style={{ height: LANE_V_HEADER_HEIGHT }}
        >
          {/* Aksen warna solid di sisi atas */}
          <div className={cn("absolute left-0 right-0 top-0 h-1.5", style.accentBar)} />
          {headerContent}

          {!readOnly && (
            <div
              className={cn(
                "nodrag nopan absolute right-2 top-3.5 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100",
                selected && "opacity-100",
              )}
            >
              <LaneBtn label="Geser lane ke kiri" onClick={() => moveLane(id, -1)}>
                <ChevronLeft className="h-3.5 w-3.5" />
              </LaneBtn>
              <LaneBtn label="Geser lane ke kanan" onClick={() => moveLane(id, 1)}>
                <ChevronRight className="h-3.5 w-3.5" />
              </LaneBtn>
              <LaneBtn label="Hapus lane" onClick={confirmRemove} danger>
                <Trash2 className="h-3.5 w-3.5" />
              </LaneBtn>
            </div>
          )}
        </div>

        {/* Handle resize lebar kolom */}
        {!readOnly && selected && (
          <NodeResizeControl
            position="top-right"
            resizeDirection="horizontal"
            minWidth={LANE_V_MIN_WIDTH}
            onResizeEnd={(_, p) => resizeLane(id, p.width)}
            className="pointer-events-auto !border-0 !bg-transparent"
          >
            <div className="absolute left-0 top-[56px] -translate-x-1/2 -translate-y-1/2 cursor-ew-resize rounded-full border border-border bg-card px-0.5 py-2 shadow-lg">
              <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </NodeResizeControl>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn("group relative flex h-full w-full overflow-visible border-b border-border/60 transition-colors", style.band)}
      style={{ width, height }}
    >
      {/* Header lane (kiri) */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => select(id)}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && select(id)}
        className={cn(
          "pointer-events-auto relative flex shrink-0 cursor-pointer flex-col justify-between overflow-hidden py-4 pl-5 pr-4 outline-none backdrop-blur-md transition-all duration-150",
          selected && "bg-primary/10 shadow-[inset_0_0_0_2px_hsl(var(--primary))]",
          style.header,
        )}
        style={{ width: LANE_HEADER_WIDTH }}
      >
        {/* Aksen warna solid di sisi kiri */}
        <div className={cn("absolute bottom-0 left-0 top-0 w-1.5", style.accentBar)} />
        {headerContent}

        {!readOnly && (
          <div className={cn("nodrag nopan flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100", selected && "opacity-100")}>
            <LaneBtn label="Naikkan lane" onClick={() => moveLane(id, -1)}>
              <ChevronUp className="h-3.5 w-3.5" />
            </LaneBtn>
            <LaneBtn label="Turunkan lane" onClick={() => moveLane(id, 1)}>
              <ChevronDown className="h-3.5 w-3.5" />
            </LaneBtn>
            <LaneBtn label="Hapus lane" onClick={confirmRemove} danger>
              <Trash2 className="h-3.5 w-3.5" />
            </LaneBtn>
          </div>
        )}
      </div>

      {/* Handle resize tinggi lane */}
      {!readOnly && selected && (
        <NodeResizeControl
          position="bottom-left"
          resizeDirection="vertical"
          minHeight={LANE_MIN_HEIGHT}
          onResizeEnd={(_, p) => resizeLane(id, p.height)}
          className="pointer-events-auto !border-0 !bg-transparent"
        >
          <div className="absolute left-[92px] top-0 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize rounded-full border border-border bg-card px-2 py-0.5 shadow-lg">
            <GripHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </NodeResizeControl>
      )}
    </div>
  );
}

function LaneBtn({ children, label, onClick, danger }: { children: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "grid h-6 w-6 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        danger && "hover:bg-rose-500/10 hover:text-rose-500",
      )}
    >
      {children}
    </button>
  );
}

export const LaneNode = memo(LaneNodeImpl);
