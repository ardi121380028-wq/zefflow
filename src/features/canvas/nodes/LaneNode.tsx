"use client";

import { memo } from "react";
import { NodeResizeControl, type NodeProps } from "@xyflow/react";
import { ChevronDown, ChevronUp, GripHorizontal, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCanvasStore } from "../store/canvas-store";
import { LANE_HEADER_WIDTH, LANE_MIN_HEIGHT, LANE_STYLES } from "../lib/layout";
import type { LaneNodeType } from "../types";

/**
 * Satu lane = satu divisi/departemen (Parent node di React Flow).
 * Tampilan Obsidian Studio dengan glowing division badge.
 */
function LaneNodeImpl({ id, data, width, height }: NodeProps<LaneNodeType>) {
  const readOnly = useCanvasStore((s) => s.readOnly);
  const selected = useCanvasStore((s) => s.selectedId === id);
  const select = useCanvasStore((s) => s.select);
  const { moveLane, removeLane, resizeLane } = useCanvasStore.getState();
  const style = LANE_STYLES[data.color];

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
          "pointer-events-auto relative flex shrink-0 cursor-pointer flex-col justify-between pl-4 pr-3.5 py-3.5 outline-none transition-all duration-150 backdrop-blur-md overflow-hidden",
          selected && "shadow-[inset_0_0_0_2px_hsl(var(--primary))] bg-primary/10",
          style.header,
        )}
        style={{ width: LANE_HEADER_WIDTH }}
      >
        {/* Solid true color accent bar on the left border */}
        <div className={cn("absolute left-0 top-0 bottom-0 w-1.5", style.accentBar)} />

        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", style.dot)} />
            <p className="truncate font-display text-[14.5px] sm:text-[15px] font-bold text-foreground tracking-tight leading-tight">
              {data.title || "Tanpa nama"}
            </p>
          </div>
          {data.division && (
            <p className="mt-1.5 line-clamp-2 text-[11px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
              {data.division}
            </p>
          )}
        </div>

        {!readOnly && (
          <div className={cn("nodrag nopan flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100", selected && "opacity-100")}>
            <LaneBtn label="Naikkan lane" onClick={() => moveLane(id, -1)}><ChevronUp className="h-3.5 w-3.5" /></LaneBtn>
            <LaneBtn label="Turunkan lane" onClick={() => moveLane(id, 1)}><ChevronDown className="h-3.5 w-3.5" /></LaneBtn>
            <LaneBtn
              label="Hapus lane"
              onClick={() => {
                if (window.confirm(`Hapus lane "${data.title}" beserta semua langkah di dalamnya?`)) removeLane(id);
              }}
              danger
            >
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
          <div className="absolute left-[84px] top-0 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize rounded-full border border-border bg-card px-2 py-0.5 shadow-lg">
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
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={cn(
        "grid h-6 w-6 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        danger && "hover:text-rose-500 hover:bg-rose-500/10",
      )}
    >
      {children}
    </button>
  );
}

export const LaneNode = memo(LaneNodeImpl);
