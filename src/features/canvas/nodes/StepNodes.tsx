"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Clock, FileOutput, GitBranch, User2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StepNodeType } from "../types";
import { DECISION_H, DECISION_W, STEP_WIDTH, TERMINAL_MIN_W } from "../lib/layout";

/** Empat handle (L/R/T/B) diposisikan DILUAR shape dengan hit-area luas */
function Handles() {
  const common =
    "opacity-0 group-hover/node:opacity-100 group-[.selected]/node:opacity-100 transition-all duration-200 z-30";
  return (
    <>
      <Handle id="l" type="source" position={Position.Left} className={cn(common, "!-left-2.5 sm:!-left-3")} />
      <Handle id="r" type="source" position={Position.Right} className={cn(common, "!-right-2.5 sm:!-right-3")} />
      <Handle id="t" type="source" position={Position.Top} className={cn(common, "!-top-2.5 sm:!-top-3")} />
      <Handle id="b" type="source" position={Position.Bottom} className={cn(common, "!-bottom-2.5 sm:!-bottom-3")} />
    </>
  );
}

function formatDuration(v: number | null, unit: string) {
  return v == null || v === 0 ? null : `${v} ${unit}`;
}

/** Langkah kerja standar (SOP step) - ElevenLabs Studio Card adaptif, tulisan besar & tegas */
function StepNodeImpl({ data, selected }: NodeProps<StepNodeType>) {
  const duration = formatDuration(data.durationValue, data.durationUnit);
  return (
    <div
      className={cn(
        "group/node relative rounded-2xl border border-border dark:border-white/[0.09] bg-white dark:bg-[#0E1018]/95 p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:border-primary/40 dark:hover:border-violet-500/50",
        selected && "selected ring-2 ring-violet-500/80 shadow-[0_0_20px_rgba(139,92,246,0.25)]",
      )}
      style={{ width: STEP_WIDTH }}
    >
      <Handles />
      <p className="font-display text-[17px] font-bold tracking-tight text-foreground dark:text-white leading-[24px]">
        {data.title || "Tanpa judul"}
      </p>
      {data.description && (
        <p className="mt-2 line-clamp-3 text-[14px] leading-[21px] text-muted-foreground dark:text-zinc-300 font-normal">
          {data.description}
        </p>
      )}
      {(duration || data.owner || data.output) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {duration && <Chip icon={<Clock className="h-4 w-4 text-violet-500 shrink-0" />}>{duration}</Chip>}
          {data.owner && <Chip icon={<User2 className="h-4 w-4 text-sky-500 shrink-0" />}>{data.owner}</Chip>}
          {data.output && <Chip icon={<FileOutput className="h-4 w-4 text-emerald-500 shrink-0" />}>{data.output}</Chip>}
        </div>
      )}
    </div>
  );
}

/** Titik keputusan (ya/tidak) - True Belah Ketupat (Diamond) dengan teks lebih besar & tegas */
function DecisionNodeImpl({ id, data, selected }: NodeProps<StepNodeType>) {
  return (
    <div
      className={cn(
        "group/node relative flex items-center justify-center select-none transition-transform duration-200",
        selected && "selected scale-[1.03]",
      )}
      style={{ width: DECISION_W, height: DECISION_H }}
    >
      {/* SVG Belah Ketupat (Diamond) adaptif Light / Dark mode */}
      <svg
        className={cn(
          "absolute inset-0 h-full w-full overflow-visible transition-all duration-200",
          selected
            ? "drop-shadow-[0_0_24px_rgba(251,191,36,0.6)]"
            : "drop-shadow-[0_4px_16px_rgba(0,0,0,0.18)] dark:drop-shadow-[0_8px_24px_rgba(0,0,0,0.5)] group-hover/node:drop-shadow-[0_0_18px_rgba(251,191,36,0.35)]",
        )}
        viewBox={`0 0 ${DECISION_W} ${DECISION_H}`}
        fill="none"
      >
        <defs>
          <linearGradient id={`diamondGrad-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--diamond-stop-1)" stopOpacity="0.98" />
            <stop offset="50%" stopColor="var(--diamond-stop-2)" stopOpacity="0.98" />
            <stop offset="100%" stopColor="var(--diamond-stop-3)" stopOpacity="1" />
          </linearGradient>
        </defs>
        <polygon
          points={`${DECISION_W / 2},4 ${DECISION_W - 4},${DECISION_H / 2} ${DECISION_W / 2},${DECISION_H - 4} 4,${DECISION_H / 2}`}
          fill={`url(#diamondGrad-${id})`}
          stroke="var(--diamond-stroke)"
          strokeWidth={selected ? "2.75" : "2.25"}
          className="transition-all duration-200"
        />
        {/* Hairline inner ambient highlight */}
        <polyline
          points={`30,${DECISION_H / 2} ${DECISION_W / 2},18 ${DECISION_W - 30},${DECISION_H / 2}`}
          stroke="var(--diamond-stroke)"
          strokeOpacity="0.25"
          strokeWidth="1.2"
          fill="none"
        />
      </svg>

      {/* 4 Handles diposisikan presisi DILUAR 4 sudut tajam belah ketupat */}
      <Handle
        id="t"
        type="source"
        position={Position.Top}
        className="!-top-3 !left-1/2 -translate-x-1/2 opacity-0 group-hover/node:opacity-100 group-[.selected]/node:opacity-100 transition-all react-flow__handle-decision z-30"
      />
      <Handle
        id="b"
        type="source"
        position={Position.Bottom}
        className="!-bottom-3 !left-1/2 -translate-x-1/2 opacity-0 group-hover/node:opacity-100 group-[.selected]/node:opacity-100 transition-all react-flow__handle-decision z-30"
      />
      <Handle
        id="l"
        type="source"
        position={Position.Left}
        className="!-left-2.5 !top-1/2 -translate-y-1/2 opacity-0 group-hover/node:opacity-100 group-[.selected]/node:opacity-100 transition-opacity react-flow__handle-decision z-30"
      />
      <Handle
        id="r"
        type="source"
        position={Position.Right}
        className="!-right-2.5 !top-1/2 -translate-y-1/2 opacity-0 group-hover/node:opacity-100 group-[.selected]/node:opacity-100 transition-opacity react-flow__handle-decision z-30"
      />

      {/* Konten teks di tengah belah ketupat */}
      <div className="relative z-10 flex max-w-[150px] flex-col items-center justify-center px-1 text-center pointer-events-none">
        <span className="mb-1.5 grid h-6 w-6 place-items-center rounded-md border border-amber-500/40 bg-gradient-to-b from-amber-400/25 to-amber-600/15 text-amber-600 dark:text-amber-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_0_12px_rgba(245,158,11,0.25)]">
          <GitBranch className="h-3.5 w-3.5" />
        </span>
        <p className="font-display text-[14.5px] font-bold tracking-tight text-[var(--diamond-text)] leading-[19px]">
          {data.title || "Keputusan?"}
        </p>
      </div>
    </div>
  );
}

/** Start / End. */
function TerminalNodeImpl({ data, selected }: NodeProps<StepNodeType>) {
  return (
    <div
      className={cn(
        "group/node flex items-center justify-center gap-2.5 rounded-full border border-border dark:border-white/[0.12] bg-white dark:bg-[#121420] px-6 py-2.5 text-foreground dark:text-white shadow-sm dark:shadow-[0_4px_16px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all hover:border-violet-500 hover:scale-105",
        selected && "selected ring-2 ring-violet-500/80 shadow-[0_0_24px_rgba(139,92,246,0.35)]",
      )}
      style={{ minWidth: TERMINAL_MIN_W }}
    >
      <Handles />
      <span className="h-3 w-3 rounded-full bg-violet-500 shadow-[0_0_10px_#a78bfa] shrink-0" />
      <p className="text-[15.5px] font-bold tracking-tight">{data.title || "Mulai / Selesai"}</p>
    </div>
  );
}

function Chip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-slate-200 dark:border-white/[0.1] bg-slate-100 text-slate-700 dark:bg-[#161824] dark:text-zinc-200 px-2.5 py-1 text-[12.5px] font-medium leading-[18px] shadow-sm transition-all hover:border-primary/40 dark:hover:border-violet-500/40">
      {icon}
      <span className="truncate">{children}</span>
    </span>
  );
}

export const StepNode = memo(StepNodeImpl);
export const DecisionNode = memo(DecisionNodeImpl);
export const TerminalNode = memo(TerminalNodeImpl);
