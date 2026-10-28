"use client";

import {
  ArrowDown,
  ArrowRight,
  ArrowRightFromLine,
  Columns3,
  Database,
  GitBranch,
  Maximize2,
  Network,
  Plus,
  Radio,
  Redo2,
  Rows3,
  Server,
  Sparkles,
  Square,
  Undo2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCanvasStore } from "../store/canvas-store";
import type { StepNodeType } from "../types";

export const PALETTE_MIME = "application/zefflow-node";

/**
 * Toolbar studio melayang — adaptif:
 * - Studio 1 (SOP / Swimlane): Alat jalur divisi, durasi, flow arah.
 * - Studio 2 (Architect): Alat Tabel Database ERD, Microservices, Event Broker, API Gateway.
 */
export function Toolbar() {
  const readOnly = useCanvasStore((s) => s.readOnly);
  const kind = useCanvasStore((s) => s.kind);
  const hasLanes = useCanvasStore((s) => s.nodes.some((n) => n.type === "lane"));
  const canUndo = useCanvasStore((s) => s.past.length > 0);
  const canRedo = useCanvasStore((s) => s.future.length > 0);
  const orientation = useCanvasStore((s) => s.orientation);
  const { addLane, addStep, undo, redo, widenLanes, setOrientation, tidyLayout } = useCanvasStore.getState();
  const vertical = orientation === "vertical";

  if (readOnly) return null;

  // Studio 2: Dedicated Architect Toolbar
  if (kind === "architect") {
    return (
      <div
        className="flex max-w-[calc(100vw-1.5rem)] items-center gap-1 overflow-x-auto rounded-full border border-sky-500/30 bg-slate-900/95 dark:bg-[#0C0E16]/95 p-1.5 shadow-2xl dark:shadow-[0_12px_40px_rgba(0,0,0,0.8),0_0_24px_rgba(14,165,233,0.2)] backdrop-blur-2xl no-scrollbar text-foreground dark:text-white"
        role="toolbar"
        aria-label="Alat Architect Studio"
      >
        <Tool
          icon={<Database className="h-3.5 w-3.5 text-sky-400" />}
          label="Tabel ERD"
          hint="Tambah Tabel Database Relasional"
          onClick={() => addStep("step")}
        />
        <Tool
          icon={<Server className="h-3.5 w-3.5 text-violet-400" />}
          label="Service API"
          hint="Tambah Microservice / Container Node"
          onClick={() => addStep("step")}
        />
        <Tool
          icon={<Radio className="h-3.5 w-3.5 text-amber-400" />}
          label="Event Broker"
          hint="Tambah Kafka / RabbitMQ Event Stream"
          onClick={() => addStep("decision")}
        />
        <Tool
          icon={<Network className="h-3.5 w-3.5 text-emerald-400" />}
          label="Gateway"
          hint="Tambah API Gateway / Reverse Proxy"
          onClick={() => addStep("terminal")}
        />
        <Divider />
        <Tool icon={<Sparkles className="h-3.5 w-3.5 text-sky-400" />} label="Rapikan" hint="Rapikan posisi komponen otomatis" onClick={tidyLayout} />
        <Divider />
        <Tool icon={<Undo2 className="h-3.5 w-3.5" />} label="" hint="Undo (Ctrl+Z)" onClick={undo} disabled={!canUndo} />
        <Tool icon={<Redo2 className="h-3.5 w-3.5" />} label="" hint="Redo (Ctrl+Shift+Z)" onClick={redo} disabled={!canRedo} />
      </div>
    );
  }

  // Studio 1: Standard SOP Swimlane Toolbar
  return (
    <div
      className="flex max-w-[calc(100vw-1.5rem)] items-center gap-1 overflow-x-auto rounded-full border border-border dark:border-white/[0.12] bg-white/95 dark:bg-[#0D0E16]/90 p-1.5 shadow-2xl dark:shadow-[0_12px_40px_rgba(0,0,0,0.7),0_0_24px_rgba(139,92,246,0.18),inset_0_1px_1px_rgba(255,255,255,0.12)] backdrop-blur-2xl no-scrollbar text-foreground dark:text-white"
      role="toolbar"
      aria-label="Alat diagram SOP"
    >
      <Tool
        icon={vertical ? <Columns3 className="h-3.5 w-3.5 text-violet-500" /> : <Rows3 className="h-3.5 w-3.5 text-violet-500" />}
        label="Lane"
        hint="Tambah jalur divisi"
        onClick={addLane}
      />
      <Divider />
      <div className="flex shrink-0 items-center rounded-full bg-muted/70 p-0.5 dark:bg-white/[0.06]" role="group" aria-label="Arah alur">
        <OrientBtn active={vertical} onClick={() => setOrientation("vertical")} icon={<ArrowDown className="h-3.5 w-3.5" />} label="Ke bawah" />
        <OrientBtn active={!vertical} onClick={() => setOrientation("horizontal")} icon={<ArrowRight className="h-3.5 w-3.5" />} label="Ke samping" />
      </div>
      <Tool icon={<Sparkles className="h-3.5 w-3.5 text-amber-500" />} label="Rapikan" hint="Rapikan otomatis: susun ulang jarak & garis" onClick={tidyLayout} disabled={!hasLanes} />
      <Divider />
      <PaletteTool type="step" icon={<Square className="h-3.5 w-3.5 text-sky-500" />} label="Langkah" disabled={!hasLanes} onAdd={() => addStep("step")} />
      <PaletteTool type="decision" icon={<GitBranch className="h-3.5 w-3.5 text-amber-500" />} label="Keputusan" disabled={!hasLanes} onAdd={() => addStep("decision")} />
      <PaletteTool type="terminal" icon={<ArrowRightFromLine className="h-3.5 w-3.5 text-emerald-500" />} label="Mulai/End" disabled={!hasLanes} onAdd={() => addStep("terminal")} />
      <Divider />
      <Tool icon={<Undo2 className="h-3.5 w-3.5" />} label="" hint="Undo (Ctrl+Z)" onClick={undo} disabled={!canUndo} />
      <Tool icon={<Redo2 className="h-3.5 w-3.5" />} label="" hint="Redo (Ctrl+Shift+Z)" onClick={redo} disabled={!canRedo} />
      <Tool icon={<Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />} label="" hint={vertical ? "Perpanjang kanvas (+600px)" : "Perlebar kanvas (+600px)"} onClick={() => widenLanes(600)} disabled={!hasLanes} />
    </div>
  );
}

function Divider() {
  return <span className="mx-0.5 h-4 w-px bg-border dark:bg-white/[0.1] shrink-0" />;
}

function OrientBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={label}
      className={cn(
        "flex h-7 items-center gap-1 rounded-full px-2.5 text-xs font-semibold transition-all duration-150",
        active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function Tool({ icon, label, hint, onClick, disabled }: { icon: React.ReactNode; label: string; hint: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      title={hint}
      aria-label={hint}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-8 shrink-0 items-center gap-1.5 rounded-full px-2.5 sm:px-3 text-xs font-semibold text-foreground/80 dark:text-zinc-300 transition-all duration-150 hover:bg-muted dark:hover:bg-white/[0.08] hover:text-foreground dark:hover:text-white dark:hover:shadow-[0_0_12px_rgba(139,92,246,0.25)] active:scale-95 disabled:pointer-events-none disabled:opacity-30",
      )}
    >
      {icon}
      {label && <span>{label}</span>}
    </button>
  );
}

function PaletteTool({ type, icon, label, disabled, onAdd }: { type: StepNodeType["type"]; icon: React.ReactNode; label: string; disabled?: boolean; onAdd: () => void }) {
  return (
    <button
      type="button"
      draggable={!disabled}
      disabled={disabled}
      title={disabled ? "Tambahkan lane terlebih dahulu" : `${label} — klik atau seret ke lane`}
      onDragStart={(e) => {
        e.dataTransfer.setData(PALETTE_MIME, type);
        e.dataTransfer.effectAllowed = "move";
      }}
      onClick={onAdd}
      className="flex h-8 shrink-0 cursor-grab items-center gap-1.5 rounded-full px-2.5 sm:px-3 text-xs font-semibold text-foreground/80 dark:text-zinc-300 transition-all duration-150 hover:bg-primary/10 dark:hover:bg-violet-500/15 hover:text-foreground dark:hover:text-violet-200 dark:hover:shadow-[0_0_16px_rgba(139,92,246,0.3)] active:scale-95 active:cursor-grabbing disabled:pointer-events-none disabled:opacity-30"
    >
      {icon}
      <span className="hidden xs:inline">{label}</span>
    </button>
  );
}

export { Plus };
