"use client";

import { memo } from "react";
import { NodeResizeControl, type NodeProps } from "@xyflow/react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, GripHorizontal, GripVertical, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCanvasStore } from "../store/canvas-store";
import { LANE_HEADER_WIDTH, LANE_MIN_HEIGHT, LANE_STYLES, LANE_V_HEADER_HEIGHT, LANE_V_MIN_WIDTH } from "../lib/layout";
import type { LaneNodeType } from "../types";

export function normalizeLaneTitle(rawTitle: string): string {
  const trimmed = rawTitle.trim();
  const lower = trimmed.toLowerCase();
  if (lower === "cust. service" || lower === "cust.service" || lower === "cust service") return "Customer Service";
  if (lower === "t. support" || lower === "t.support" || lower === "t support") return "Technical Support";
  if (lower === "cs & finance" || lower === "cs & fin" || lower === "cs / finance" || lower === "cs/finance") return "Customer Service & Finance";
  if (lower === "cs") return "Customer Success";
  return rawTitle;
}

const SOLID_HEADERS: Record<string, { bg: string; dot: string; text: string }> = {
  rose: { bg: "bg-[#DC2626] text-white", dot: "bg-white", text: "text-white" },
  amber: { bg: "bg-[#EA580C] text-white", dot: "bg-white", text: "text-white" },
  violet: { bg: "bg-[#7E22CE] text-white", dot: "bg-white", text: "text-white" },
  emerald: { bg: "bg-[#0284C7] text-white", dot: "bg-white", text: "text-white" },
  sky: { bg: "bg-[#1E40AF] text-white", dot: "bg-white", text: "text-white" },
  slate: { bg: "bg-[#0F172A] text-white", dot: "bg-white", text: "text-white" },
};

/**
 * Satu lane = satu divisi/departemen (Parent node di React Flow).
 * - horizontal: header di kiri, alur ke samping.
 * - vertical  : header di atas (kolom), alur ke bawah.
 */
function LaneNodeImpl({ id, data, width, height }: NodeProps<LaneNodeType>) {
  const readOnly = useCanvasStore((s) => s.readOnly);
  const selected = useCanvasStore((s) => s.selectedId === id);
  const vertical = useCanvasStore((s) => s.orientation === "vertical");
  const wallpaper = useCanvasStore((s) => s.wallpaper);
  const isSolidZitline = wallpaper === "solid-zitline";
  const laneIndex = parseInt(id.replace("lane_", ""), 10) || 0;
  const solidBand = laneIndex % 2 === 0 ? "bg-[#D6E8FA] border-b-2 border-white" : "bg-[#BDDCF8] border-b-2 border-white";
  const solidHeader = SOLID_HEADERS[data.color] ?? SOLID_HEADERS.rose!;
  const select = useCanvasStore((s) => s.select);
  const { moveLane, removeLane, resizeLane } = useCanvasStore.getState();
  const style = LANE_STYLES[data.color];
  const displayTitle = normalizeLaneTitle(data.title || "Tanpa nama");

  const confirmRemove = () => {
    if (window.confirm(`Hapus lane "${displayTitle}" beserta semua langkah di dalamnya?`)) removeLane(id);
  };

  const headerContent = (
    <>
      <div className="min-w-0">
        <div className="flex items-start gap-3">
          <span className={cn("mt-2.5 h-5 w-5 shrink-0 rounded-full", isSolidZitline ? "bg-white shadow-sm" : style.dot)} />
          <p className={cn("line-clamp-2 break-words font-sans text-[31px] font-bold leading-[37px] tracking-tight", isSolidZitline ? "text-white uppercase tracking-wide" : "text-foreground")}>
            {displayTitle}
          </p>
        </div>
        {data.division && (
          <p className={cn("mt-2 line-clamp-2 font-mono text-[19px] leading-[25px] font-medium uppercase tracking-wider", isSolidZitline ? "text-white/85" : "text-muted-foreground")}>
            {data.division}
          </p>
        )}
      </div>
    </>
  );

  if (vertical) {
    return (
      <div
        className={cn(
          "group relative flex h-full w-full flex-col overflow-visible border-r border-border/70 transition-colors",
          isSolidZitline ? (laneIndex % 2 === 0 ? "bg-[#D6E8FA] border-r-2 border-white" : "bg-[#BDDCF8] border-r-2 border-white") : style.band,
        )}
        style={{ width, height }}
      >
        {/* Header kolom (atas) */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => select(id)}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && select(id)}
          className={cn(
            "pointer-events-auto relative flex shrink-0 cursor-pointer flex-col justify-center overflow-hidden px-7 pb-4 pt-6 outline-none transition-colors duration-150",
            selected && "bg-primary/10 shadow-[inset_0_0_0_2px_hsl(var(--primary))]",
            isSolidZitline ? solidHeader.bg : style.headerV,
          )}
          style={{ height: LANE_V_HEADER_HEIGHT }}
        >
          {/* Aksen warna solid di sisi atas */}
          {!isSolidZitline && <div className={cn("absolute left-0 right-0 top-0 h-2.5", style.accentBar)} />}
          {headerContent}

          {!readOnly && (
            <div
              className={cn(
                "nodrag nopan absolute right-3 top-4 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100",
                selected && "opacity-100",
              )}
            >
              <LaneBtn label="Geser lane ke kiri" onClick={() => moveLane(id, -1)}>
                <ChevronLeft className="h-4 w-4" />
              </LaneBtn>
              <LaneBtn label="Geser lane ke kanan" onClick={() => moveLane(id, 1)}>
                <ChevronRight className="h-4 w-4" />
              </LaneBtn>
              <LaneBtn label="Hapus lane" onClick={confirmRemove} danger>
                <Trash2 className="h-4 w-4" />
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
            <div className="absolute left-0 top-[88px] -translate-x-1/2 -translate-y-1/2 cursor-ew-resize rounded-full border border-border bg-card px-1 py-2.5 shadow-lg">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
          </NodeResizeControl>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group relative flex h-full w-full overflow-visible border-b border-border/60 transition-colors",
        isSolidZitline ? solidBand : style.band,
      )}
      style={{ width, height }}
    >
      {/* Header lane (kiri) */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => select(id)}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && select(id)}
        className={cn(
          "pointer-events-auto relative flex shrink-0 cursor-pointer flex-col justify-between overflow-hidden py-6 pl-7 pr-5 outline-none transition-colors duration-150",
          selected && "bg-primary/10 shadow-[inset_0_0_0_2px_hsl(var(--primary))]",
          isSolidZitline ? solidHeader.bg : style.header,
        )}
        style={{ width: LANE_HEADER_WIDTH }}
      >
        {/* Aksen warna solid di sisi kiri */}
        {!isSolidZitline && <div className={cn("absolute bottom-0 left-0 top-0 w-2.5", style.accentBar)} />}
        {headerContent}

        {!readOnly && (
          <div className={cn("nodrag nopan flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100", selected && "opacity-100")}>
            <LaneBtn label="Naikkan lane" onClick={() => moveLane(id, -1)}>
              <ChevronUp className="h-4 w-4" />
            </LaneBtn>
            <LaneBtn label="Turunkan lane" onClick={() => moveLane(id, 1)}>
              <ChevronDown className="h-4 w-4" />
            </LaneBtn>
            <LaneBtn label="Hapus lane" onClick={confirmRemove} danger>
              <Trash2 className="h-4 w-4" />
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
          <div className="absolute left-[190px] top-0 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize rounded-full border border-border bg-card px-2.5 py-1 shadow-lg">
            <GripHorizontal className="h-4 w-4 text-muted-foreground" />
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
        "grid h-8 w-8 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        danger && "hover:bg-rose-500/10 hover:text-rose-500",
      )}
    >
      {children}
    </button>
  );
}

export const LaneNode = memo(LaneNodeImpl);
