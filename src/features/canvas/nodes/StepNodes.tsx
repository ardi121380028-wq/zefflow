"use client";

import * as React from "react";
import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  ArrowRightFromLine,
  ChevronDown,
  ChevronUp,
  Database,
  FileOutput,
  GitBranch,
  Square,
  User2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { StepNodeType } from "../types";
import { DECISION_H, DECISION_W, STEP_WIDTH, TERMINAL_MIN_W } from "../lib/layout";
import { useCanvasStore } from "../store/canvas-store";

/**
 * Handle koneksi dengan deteksi klik vs drag:
 * - Jika DITARIK (drag > 6px): React Flow menarik garis panah normal tanpa popup.
 * - Jika DIKLIK (tap / click < 6px): Menampilkan popup rekomendasi bentuk (Langkah, Keputusan, Selesai).
 */
function NodeHandles({ nodeId, isDecision }: { nodeId: string; isDecision?: boolean }) {
  const [activeHandle, setActiveHandle] = React.useState<"l" | "r" | "t" | "b" | null>(null);
  const pointerStartRef = React.useRef<{ x: number; y: number; time: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    pointerStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
  };

  const handlePointerUp = (handleId: "l" | "r" | "t" | "b", e: React.PointerEvent) => {
    if (!pointerStartRef.current) return;
    const dist = Math.hypot(e.clientX - pointerStartRef.current.x, e.clientY - pointerStartRef.current.y);
    const duration = Date.now() - pointerStartRef.current.time;
    pointerStartRef.current = null;

    // Jika jarak geser < 6px dan durasi klik cepat (< 350ms): User mengklik dot untuk rekomendasi
    if (dist < 6 && duration < 350 && !useCanvasStore.getState().readOnly) {
      e.stopPropagation();
      setActiveHandle((prev) => (prev === handleId ? null : handleId));
    } else {
      setActiveHandle(null);
    }
  };

  const handleQuickAdd = (type: StepNodeType["type"]) => {
    if (!activeHandle) return;
    useCanvasStore.getState().quickAddStepFromNode(nodeId, activeHandle, type);
    setActiveHandle(null);
  };

  const common =
    "opacity-0 group-hover/node:opacity-100 group-[.selected]/node:opacity-100 transition-opacity duration-150 z-30 cursor-crosshair";

  return (
    <>
      <Handle
        id="l"
        type="source"
        position={Position.Left}
        onPointerDown={handlePointerDown}
        onPointerUp={(e) => handlePointerUp("l", e)}
        className={cn(common, isDecision ? "!-left-2.5 !top-1/2 -translate-y-1/2 react-flow__handle-decision" : "!-left-2.5 sm:!-left-3")}
      />
      <Handle
        id="r"
        type="source"
        position={Position.Right}
        onPointerDown={handlePointerDown}
        onPointerUp={(e) => handlePointerUp("r", e)}
        className={cn(common, isDecision ? "!-right-2.5 !top-1/2 -translate-y-1/2 react-flow__handle-decision" : "!-right-2.5 sm:!-right-3")}
      />
      <Handle
        id="t"
        type="source"
        position={Position.Top}
        onPointerDown={handlePointerDown}
        onPointerUp={(e) => handlePointerUp("t", e)}
        className={cn(common, isDecision ? "!-top-3 !left-1/2 -translate-x-1/2 react-flow__handle-decision" : "!-top-2.5 sm:!-top-3")}
      />
      <Handle
        id="b"
        type="source"
        position={Position.Bottom}
        onPointerDown={handlePointerDown}
        onPointerUp={(e) => handlePointerUp("b", e)}
        className={cn(common, isDecision ? "!-bottom-3 !left-1/2 -translate-x-1/2 react-flow__handle-decision" : "!-bottom-2.5 sm:!-bottom-3")}
      />

      {/* Floating Quick-Add Popup Menu */}
      {activeHandle && (
        <div
          className={cn(
            "nodrag nopan absolute z-50 flex items-center gap-1 rounded-2xl border border-border dark:border-white/[0.15] bg-white/95 dark:bg-[#0E0F16]/95 p-1 shadow-2xl backdrop-blur-2xl animate-scale-in text-foreground dark:text-white pointer-events-auto",
            activeHandle === "b" && "top-full mt-3.5 left-1/2 -translate-x-1/2",
            activeHandle === "t" && "bottom-full mb-3.5 left-1/2 -translate-x-1/2",
            activeHandle === "r" && "left-full ml-3.5 top-1/2 -translate-y-1/2",
            activeHandle === "l" && "right-full mr-3.5 top-1/2 -translate-y-1/2",
          )}
        >
          <button
            type="button"
            onClick={() => handleQuickAdd("step")}
            className="flex items-center gap-1 rounded-xl px-2 py-1 text-[11px] font-semibold text-foreground hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
            title="Tambah Langkah Kerja"
          >
            <Square className="h-3 w-3 text-sky-500 shrink-0" />
            <span>Langkah</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickAdd("decision")}
            className="flex items-center gap-1 rounded-xl px-2 py-1 text-[11px] font-semibold text-foreground hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
            title="Tambah Titik Keputusan"
          >
            <GitBranch className="h-3 w-3 text-amber-500 shrink-0" />
            <span>Keputusan</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickAdd("terminal")}
            className="flex items-center gap-1 rounded-xl px-2 py-1 text-[11px] font-semibold text-foreground hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            title="Tambah Titik Akhir / Selesai"
          >
            <ArrowRightFromLine className="h-3 w-3 text-emerald-500 shrink-0" />
            <span>Selesai</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveHandle(null)}
            className="grid h-6 w-6 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors ml-0.5"
            title="Tutup menu"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </>
  );
}

function parseErdColumns(desc: string) {
  if (!desc) return [];
  return desc.split("\n").filter(Boolean).map((line) => {
    const trimmed = line.trim();
    const match = trimmed.match(/^([a-zA-Z0-9_]+)\s*(?:\(([^)]+)\))?/);
    if (!match) return { name: trimmed, type: "VARCHAR", isPk: false, isFk: false };
    const name = match[1];
    const details = (match[2] || "VARCHAR").toUpperCase();
    const isPk = details.includes("PK");
    const isFk = details.includes("FK");
    const cleanType = details.replace(/PK|FK|UNIQUE/g, "").trim() || "VARCHAR";
    return { name, type: cleanType, isPk, isFk };
  });
}

/** Langkah kerja standar (SOP step) atau ERD Database Table di Architect mode */
function StepNodeImpl({ id, data, selected }: NodeProps<StepNodeType>) {
  const storeKind = useCanvasStore((s) => s.kind);
  const showDescriptions = useCanvasStore((s) => s.showDescriptions);
  const isExporting = useCanvasStore((s) => s.isExporting);
  const [localDescOpen, setLocalDescOpen] = React.useState(false);

  React.useEffect(() => {
    setLocalDescOpen(false);
  }, [showDescriptions]);

  const isErd =
    storeKind === "architect" ||
    data.output === "Database Table" ||
    data.output?.toLowerCase().includes("table") ||
    Boolean(data.description && (data.description.includes("PK") || data.description.includes("FK")));

  const columns = React.useMemo(
    () => (isErd ? parseErdColumns(data.description) : []),
    [isErd, data.description],
  );

  if (isErd) {
    return (
      <div
        className={cn(
          "group/node relative rounded-3xl border-[1.5px] bg-card dark:bg-[#0C0E17] shadow-md transition-[border-color,box-shadow] duration-150 overflow-hidden",
          selected
            ? "border-sky-500 ring-2 ring-sky-500/80 shadow-[0_0_28px_rgba(14,165,233,0.35)]"
            : "border-sky-500/30 hover:border-sky-500/60 hover:shadow-lg",
        )}
        style={{ width: STEP_WIDTH }}
      >
        <NodeHandles nodeId={id} />
        {/* Table Title Bar */}
        <div className="flex items-center justify-between border-b border-border dark:border-white/[0.08] bg-sky-500/10 px-5 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <Database className="h-6 w-6 text-sky-500 shrink-0" />
            <span className="font-mono text-[24px] leading-[30px] font-bold text-foreground dark:text-sky-200 tracking-tight truncate">
              {data.title || "tabel_baru"}
            </span>
          </div>
          <span className="rounded-md bg-sky-500/20 px-2.5 py-1 text-[16px] font-mono font-bold text-sky-600 dark:text-sky-400">
            TABLE
          </span>
        </div>

        {/* Columns Listing */}
        <div className="divide-y divide-border/40 p-2 font-mono text-[21px] leading-[28px]">
          {columns.length > 0 ? (
            columns.map((col, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-3.5 py-2 hover:bg-muted/40 transition-colors rounded-xl"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={cn(
                      "truncate",
                      col.isPk
                        ? "text-amber-500 dark:text-amber-300 font-bold"
                        : col.isFk
                        ? "text-sky-500 dark:text-sky-300 font-semibold"
                        : "text-foreground font-medium",
                    )}
                  >
                    {col.name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[17px] text-muted-foreground">{col.type}</span>
                  {col.isPk && (
                    <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[14px] font-bold text-amber-600 dark:text-amber-400">
                      PK
                    </span>
                  )}
                  {col.isFk && (
                    <span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-[14px] font-bold text-sky-600 dark:text-sky-400">
                      FK
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="px-4 py-3 text-[19px] text-muted-foreground italic">
              Klik untuk menambah kolom skema
            </p>
          )}
        </div>

        {/* Output indicator if exists */}
        {data.output && data.output !== "Database Table" && (
          <div className="border-t border-border/40 px-5 py-2.5 bg-muted/20 text-[18px] text-muted-foreground font-sans truncate">
            {data.output}
          </div>
        )}
      </div>
    );
  }

  const isDescExpanded = showDescriptions || localDescOpen;

  return (
    <div
      className={cn(
        "group/node relative rounded-3xl border-[1.5px] border-border dark:border-white/[0.1] bg-white dark:bg-[#0E1018] p-6 shadow-sm hover:shadow-md transition-[border-color,box-shadow] duration-150 hover:border-primary/40 dark:hover:border-violet-500/50",
        selected && "selected ring-2 ring-violet-500/80 shadow-[0_0_24px_rgba(139,92,246,0.28)]",
      )}
      style={{ width: STEP_WIDTH }}
    >
      <NodeHandles nodeId={id} />
      <div className="flex items-start justify-between gap-3">
        <p className="font-display text-[38px] font-extrabold tracking-tight text-foreground dark:text-white leading-[45px] flex-1">
          {data.title || "Tanpa judul"}
        </p>
        {data.description && !isExporting && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLocalDescOpen((prev) => !prev);
            }}
            title={isDescExpanded ? "Sembunyikan detail deskripsi" : "Tampilkan detail deskripsi"}
            className={cn(
              "nodrag nopan shrink-0 mt-1 grid h-9 w-9 place-items-center rounded-xl border transition-colors",
              isDescExpanded
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border/80 bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {isDescExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
        )}
      </div>

      {data.description && (isDescExpanded || isExporting) && (
        <p className="mt-3 line-clamp-4 text-[26px] leading-[36px] text-muted-foreground dark:text-zinc-300 font-medium animate-in fade-in duration-200">
          {data.description}
        </p>
      )}

      {(data.owner || data.output) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {data.owner && <Chip icon={<User2 className="h-6 w-6 text-sky-500 shrink-0" />}>{data.owner}</Chip>}
          {data.output && <Chip icon={<FileOutput className="h-6 w-6 text-emerald-500 shrink-0" />}>{data.output}</Chip>}
        </div>
      )}
    </div>
  );
}

/** Titik keputusan (ya/tidak) - True Belah Ketupat (Diamond) dengan bayangan vektor ringan bebas filter GPU */
function DecisionNodeImpl({ id, data, selected }: NodeProps<StepNodeType>) {
  return (
    <div
      className={cn(
        "group/node relative flex items-center justify-center select-none transition-transform duration-150",
        selected && "selected scale-[1.03]",
      )}
      style={{ width: DECISION_W, height: DECISION_H }}
    >
      {/* SVG Belah Ketupat (Diamond) adaptif Light / Dark mode — tanpa permanent CSS drop-shadow filter per-node */}
      <svg
        className={cn(
          "absolute inset-0 h-full w-full overflow-visible",
          selected && "drop-shadow-[0_0_24px_rgba(251,191,36,0.55)]",
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
        {/* Vector drop shadow ringan (0 offscreen GPU blur surface) */}
        <polygon
          points={`${DECISION_W / 2},10 ${DECISION_W - 6},${DECISION_H / 2 + 6} ${DECISION_W / 2},${DECISION_H} 6,${DECISION_H / 2 + 6}`}
          fill="rgba(0,0,0,0.16)"
        />
        <polygon
          points={`${DECISION_W / 2},5 ${DECISION_W - 6},${DECISION_H / 2} ${DECISION_W / 2},${DECISION_H - 5} 6,${DECISION_H / 2}`}
          fill={`url(#diamondGrad-${id})`}
          stroke="var(--diamond-stroke)"
          strokeWidth={selected ? "3.5" : "2.75"}
        />
        {/* Hairline inner ambient highlight */}
        <polyline
          points={`44,${DECISION_H / 2} ${DECISION_W / 2},24 ${DECISION_W - 44},${DECISION_H / 2}`}
          stroke="var(--diamond-stroke)"
          strokeOpacity="0.25"
          strokeWidth="1.6"
          fill="none"
        />
      </svg>

      <NodeHandles nodeId={id} isDecision />

      {/* Konten teks di tengah belah ketupat */}
      <div className="relative z-10 flex max-w-[268px] flex-col items-center justify-center px-2 text-center pointer-events-none">
        <span className="mb-2.5 grid h-10 w-10 place-items-center rounded-xl border border-amber-500/40 bg-gradient-to-b from-amber-400/25 to-amber-600/15 text-amber-600 dark:text-amber-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_0_14px_rgba(245,158,11,0.25)]">
          <GitBranch className="h-5 w-5" />
        </span>
        <p className="font-display text-[29px] font-extrabold tracking-tight text-[var(--diamond-text)] leading-[36px]">
          {data.title || "Keputusan?"}
        </p>
      </div>
    </div>
  );
}

/** Start / End — tanpa backdrop-blur agar GPU compositing 60fps tetap ringan pada ratusan node. */
function TerminalNodeImpl({ id, data, selected }: NodeProps<StepNodeType>) {
  return (
    <div
      className={cn(
        "group/node flex items-center justify-center gap-3.5 rounded-full border-[1.5px] border-border dark:border-white/[0.14] bg-white dark:bg-[#121420] px-9 py-4 text-foreground dark:text-white shadow-sm dark:shadow-[0_6px_20px_rgba(0,0,0,0.5)] transition-[border-color,box-shadow,transform] duration-150 hover:border-violet-500 hover:scale-105",
        selected && "selected ring-2 ring-violet-500/80 shadow-[0_0_28px_rgba(139,92,246,0.35)]",
      )}
      style={{ minWidth: TERMINAL_MIN_W }}
    >
      <NodeHandles nodeId={id} />
      <span className="h-5 w-5 rounded-full bg-violet-500 shadow-[0_0_12px_#a78bfa] shrink-0" />
      <p className="text-[31px] leading-[38px] font-extrabold tracking-tight">{data.title || "Mulai / Selesai"}</p>
    </div>
  );
}

function Chip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex max-w-full items-center gap-2 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-100 text-slate-700 dark:bg-[#161824] dark:text-zinc-200 px-4 py-2 text-[23px] font-semibold leading-[30px] shadow-sm transition-all hover:border-primary/40 dark:hover:border-violet-500/40">
      {icon}
      <span className="truncate">{children}</span>
    </span>
  );
}

export const StepNode = memo(StepNodeImpl);
export const DecisionNode = memo(DecisionNodeImpl);
export const TerminalNode = memo(TerminalNodeImpl);
