"use client";

import * as React from "react";
import {
  AlertCircle,
  ArrowRightFromLine,
  Boxes,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  GitBranch,
  Layers,
  ListOrdered,
  PanelLeftClose,
  Plus,
  Search,
  Square,
  Trash2,
  User2,
  X,
} from "lucide-react";
import { useReactFlow } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { LANE_STYLES } from "../lib/layout";
import { useCanvasStore } from "../store/canvas-store";
import { isLane, isStep, type AppNode, type StepNodeType } from "../types";
import { PALETTE_MIME } from "./Toolbar";

interface LayersPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

type TabKey = "layers" | "outline" | "assets";

/**
 * Panel Sisi Kiri (Figma-Style Layers & SOP Outline)
 * - Tab 1: Layers (Tree per-Lane dengan child steps, click to select & center)
 * - Tab 2: Outline & Ringkasan SOP (urutan alur, estimasi waktu total, cek kelengkapan)
 * - Tab 3: Komponen / Aset (drag & drop elemen diagram cepat)
 */
export function LayersPanel({ isOpen, onToggle }: LayersPanelProps) {
  const [activeTab, setActiveTab] = React.useState<TabKey>("layers");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [collapsedLanes, setCollapsedLanes] = React.useState<Record<string, boolean>>({});

  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const selectedId = useCanvasStore((s) => s.selectedId);
  const readOnly = useCanvasStore((s) => s.readOnly);
  const { select, removeLane, deleteSelected, addStep, addLane, commit } = useCanvasStore.getState();
  const { fitView } = useReactFlow();

  const lanes = React.useMemo(() => nodes.filter(isLane), [nodes]);
  const steps = React.useMemo(() => nodes.filter(isStep), [nodes]);

  // Kelompokkan steps per lane parent
  const stepsByLane = React.useMemo(() => {
    const map = new Map<string, StepNodeType[]>();
    for (const lane of lanes) map.set(lane.id, []);
    for (const step of steps) {
      const pid = step.parentId ?? "";
      if (map.has(pid)) {
        map.get(pid)!.push(step);
      } else {
        // Unassigned / detached
        if (!map.has("__unassigned__")) map.set("__unassigned__", []);
        map.get("__unassigned__")!.push(step);
      }
    }
    return map;
  }, [lanes, steps]);

  // Filter pencarian
  const filteredStepsByLane = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return stepsByLane;
    const map = new Map<string, StepNodeType[]>();
    for (const [laneId, list] of stepsByLane.entries()) {
      const matched = list.filter(
        (s) =>
          (s.data.title || "").toLowerCase().includes(q) ||
          (s.data.description || "").toLowerCase().includes(q) ||
          (s.data.owner || "").toLowerCase().includes(q),
      );
      if (matched.length > 0 || (lanes.find((l) => l.id === laneId)?.data.title || "").toLowerCase().includes(q)) {
        map.set(laneId, matched);
      }
    }
    return map;
  }, [searchQuery, stepsByLane, lanes]);

  // Hitung total estimasi waktu dari semua langkah
  const timeSummary = React.useMemo(() => {
    let minutes = 0;
    let missingInfoCount = 0;

    for (const s of steps) {
      if (!s.data.durationValue && !s.data.owner) {
        missingInfoCount++;
      }
      if (s.data.durationValue) {
        const val = s.data.durationValue;
        const unit = s.data.durationUnit ?? "menit";
        if (unit === "menit") minutes += val;
        else if (unit === "jam") minutes += val * 60;
        else if (unit === "hari") minutes += val * 60 * 8; // 8 jam kerja/hari
      }
    }

    const days = Math.floor(minutes / (60 * 8));
    const remainingMinsAfterDays = minutes % (60 * 8);
    const hours = Math.floor(remainingMinsAfterDays / 60);
    const mins = remainingMinsAfterDays % 60;

    const parts: string[] = [];
    if (days > 0) parts.push(`${days} hari`);
    if (hours > 0) parts.push(`${hours} jam`);
    if (mins > 0 || parts.length === 0) parts.push(`${mins} menit`);

    return { formatted: parts.join(" "), minutes, missingInfoCount };
  }, [steps]);

  const toggleLaneCollapse = (laneId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedLanes((prev) => ({ ...prev, [laneId]: !prev[laneId] }));
  };

  const handleFocusNode = (nodeId: string) => {
    select(nodeId);
    fitView({
      nodes: [{ id: nodeId }],
      duration: 350,
      maxZoom: 1.1,
      padding: 0.25,
    });
  };

  if (!isOpen) return null;

  return (
    <aside
      aria-label="Panel Layers dan Outline"
      className="absolute bottom-2 left-2 top-2 sm:bottom-4 sm:left-4 sm:top-4 z-20 flex w-[290px] sm:w-[310px] max-w-[calc(100vw-1rem)] animate-scale-in flex-col overflow-hidden rounded-2xl sm:rounded-3xl border border-border dark:border-white/[0.08] bg-white/95 dark:bg-[#0E0F16]/95 text-foreground dark:text-white shadow-2xl backdrop-blur-2xl"
    >
      {/* Header Panel */}
      <header className="flex items-center justify-between border-b border-border dark:border-white/[0.08] px-3.5 py-3 bg-slate-50/80 dark:bg-[#12131D]">
        <div className="flex items-center gap-1">
          <TabButton
            active={activeTab === "layers"}
            onClick={() => setActiveTab("layers")}
            icon={<Layers className="h-3.5 w-3.5" />}
            label="Layers"
            badge={steps.length}
          />
          <TabButton
            active={activeTab === "outline"}
            onClick={() => setActiveTab("outline")}
            icon={<ListOrdered className="h-3.5 w-3.5" />}
            label="Ringkasan"
          />
          <TabButton
            active={activeTab === "assets"}
            onClick={() => setActiveTab("assets")}
            icon={<Boxes className="h-3.5 w-3.5" />}
            label="Aset"
          />
        </div>

        <button
          onClick={onToggle}
          title="Tutup panel samping"
          className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground dark:hover:text-white"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </header>

      {/* Tab 1: LAYERS TREE */}
      {activeTab === "layers" && (
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Search Bar */}
          <div className="p-2.5 border-b border-border/70 dark:border-white/[0.06]">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari langkah atau lane..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-full rounded-xl border border-border/80 bg-background/80 pl-8 pr-7 text-xs font-medium placeholder:text-muted-foreground/70 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/40 dark:bg-white/[0.04]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Tree View */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 no-scrollbar">
            {lanes.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                <p>Belum ada lane</p>
                {!readOnly && (
                  <button
                    onClick={() => addLane()}
                    className="mt-2 inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/20"
                  >
                    <Plus className="h-3 w-3" /> Tambah Lane
                  </button>
                )}
              </div>
            ) : (
              lanes.map((lane) => {
                const laneSteps = filteredStepsByLane.get(lane.id) || [];
                const isCollapsed = collapsedLanes[lane.id] ?? false;
                const isLaneSelected = selectedId === lane.id;
                const style = LANE_STYLES[lane.data.color];

                return (
                  <div
                    key={lane.id}
                    className={cn(
                      "rounded-xl border border-transparent transition-all duration-150 overflow-hidden",
                      isLaneSelected
                        ? "border-primary/40 bg-primary/[0.04] dark:bg-primary/[0.08]"
                        : "hover:border-border/80 dark:hover:border-white/[0.06]",
                    )}
                  >
                    {/* Lane Header Row */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => handleFocusNode(lane.id)}
                      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleFocusNode(lane.id)}
                      className={cn(
                        "group flex items-center justify-between px-2.5 py-2 cursor-pointer rounded-lg text-xs font-semibold transition-colors",
                        isLaneSelected
                          ? "text-primary font-bold"
                          : "text-foreground hover:bg-muted/50 dark:hover:bg-white/[0.04]",
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          type="button"
                          onClick={(e) => toggleLaneCollapse(lane.id, e)}
                          className="h-4 w-4 grid place-items-center text-muted-foreground hover:text-foreground shrink-0"
                        >
                          {isCollapsed ? (
                            <ChevronRight className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                        </button>

                        <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", style.dot)} />

                        <span className="truncate">{lane.data.title || "Tanpa Judul"}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-mono text-[10px] text-muted-foreground rounded-full bg-muted/80 dark:bg-white/[0.08] px-1.5 py-0.2">
                          {laneSteps.length}
                        </span>

                        {!readOnly && (
                          <button
                            type="button"
                            title="Hapus lane"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`Hapus lane "${lane.data.title}"?`)) removeLane(lane.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 h-5 w-5 grid place-items-center text-muted-foreground hover:text-destructive rounded transition-opacity"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Steps List Inside Lane */}
                    {!isCollapsed && laneSteps.length > 0 && (
                      <div className="ml-5 pl-2 border-l border-border/60 dark:border-white/[0.06] space-y-0.5 pb-1">
                        {laneSteps.map((step) => {
                          const isStepSelected = selectedId === step.id;
                          const icon =
                            step.type === "decision" ? (
                              <GitBranch className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            ) : step.type === "terminal" ? (
                              <ArrowRightFromLine className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                            ) : (
                              <Square className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                            );

                          return (
                            <div
                              key={step.id}
                              role="button"
                              tabIndex={0}
                              onClick={() => handleFocusNode(step.id)}
                              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleFocusNode(step.id)}
                              className={cn(
                                "group flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer text-xs transition-colors",
                                isStepSelected
                                  ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                                  : "text-foreground/90 hover:bg-muted/70 dark:hover:bg-white/[0.06]",
                              )}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {icon}
                                <span className="truncate">{step.data.title || "Tanpa judul"}</span>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                {step.data.durationValue && (
                                  <span
                                    className={cn(
                                      "text-[9px] font-mono px-1 py-0.2 rounded",
                                      isStepSelected
                                        ? "bg-white/20 text-white"
                                        : "bg-muted text-muted-foreground dark:bg-white/[0.06]",
                                    )}
                                  >
                                    {step.data.durationValue} {step.data.durationUnit?.[0] ?? "m"}
                                  </span>
                                )}

                                {!readOnly && (
                                  <button
                                    type="button"
                                    title="Hapus langkah"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      commit();
                                      deleteSelected(step.id);
                                    }}
                                    className={cn(
                                      "opacity-0 group-hover:opacity-100 h-4 w-4 grid place-items-center rounded transition-opacity",
                                      isStepSelected
                                        ? "text-white/80 hover:text-white"
                                        : "text-muted-foreground hover:text-destructive",
                                    )}
                                  >
                                    <Trash2 className="h-2.5 w-2.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Tab 2: OUTLINE & RINGKASAN SOP */}
      {activeTab === "outline" && (
        <div className="flex-1 overflow-y-auto p-3.5 space-y-4 no-scrollbar">
          {/* Quick Metrics */}
          <div>
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Statistik Alur Proses
            </p>
            <div className="grid grid-cols-2 gap-2">
              <MetricBox label="Divisi (Lane)" value={lanes.length} />
              <MetricBox label="Total Langkah" value={steps.length} />
              <MetricBox
                label="Titik Keputusan"
                value={steps.filter((s) => s.type === "decision").length}
              />
              <MetricBox label="Estimasi Durasi" value={timeSummary.formatted} isText />
            </div>
          </div>

          {/* SOP Completeness Check */}
          <div className="rounded-2xl border border-border/80 dark:border-white/[0.08] p-3 bg-muted/40 dark:bg-white/[0.02]">
            <p className="text-xs font-bold mb-1.5 flex items-center gap-1.5 text-foreground">
              {timeSummary.missingInfoCount === 0 ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>SOP Siap & Lengkap</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <span>{timeSummary.missingInfoCount} Langkah Perlu Detail</span>
                </>
              )}
            </p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {timeSummary.missingInfoCount === 0
                ? "Semua langkah telah dilengkapi durasi estimasi dan PIC."
                : "Lengkapi durasi atau PIC untuk transparansi proses operasional yang optimal."}
            </p>
          </div>

          {/* Chronological Flow List */}
          <div>
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Daftar Langkah Berurutan
            </p>
            <div className="space-y-1.5">
              {steps.map((step, idx) => {
                const parentLane = lanes.find((l) => l.id === step.parentId);
                return (
                  <div
                    key={step.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleFocusNode(step.id)}
                    className="flex items-start gap-2.5 p-2 rounded-xl border border-border/50 dark:border-white/[0.05] hover:bg-muted/60 dark:hover:bg-white/[0.04] cursor-pointer transition-colors"
                  >
                    <span className="font-mono text-[10px] font-bold text-muted-foreground w-4 shrink-0 mt-0.5">
                      {idx + 1}.
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate text-foreground">
                        {step.data.title || "Tanpa judul"}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                        {parentLane && (
                          <span className="truncate max-w-[100px] font-medium text-foreground/70">
                            {parentLane.data.title}
                          </span>
                        )}
                        {step.data.owner && (
                          <span className="flex items-center gap-0.5">
                            <User2 className="h-2.5 w-2.5" /> {step.data.owner}
                          </span>
                        )}
                        {step.data.durationValue && (
                          <span className="flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5" /> {step.data.durationValue}{" "}
                            {step.data.durationUnit}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: KOMPONEN & ASET (Figma-Style Palette) */}
      {activeTab === "assets" && (
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3 no-scrollbar">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
            Tarik atau Klik untuk Menambah
          </p>

          <AssetCard
            type="step"
            icon={<Square className="h-4 w-4 text-sky-500" />}
            title="Langkah Kerja"
            desc="Tugas standar dengan durasi, PIC, & output dokumen"
            onAdd={() => addStep("step")}
          />

          <AssetCard
            type="decision"
            icon={<GitBranch className="h-4 w-4 text-amber-500" />}
            title="Titik Keputusan"
            desc="Percabangan kondisi logika (Ya / Tidak / Alternatif)"
            onAdd={() => addStep("decision")}
          />

          <AssetCard
            type="terminal"
            icon={<ArrowRightFromLine className="h-4 w-4 text-emerald-500" />}
            title="Mulai / Selesai"
            desc="Titik awal proses atau hasil akhir alur kerja"
            onAdd={() => addStep("terminal")}
          />

          <div className="pt-2 border-t border-border/70 dark:border-white/[0.06]">
            <button
              onClick={() => addLane()}
              className="w-full flex items-center justify-center gap-2 h-9 rounded-xl border border-dashed border-violet-500/40 bg-violet-500/5 text-violet-600 dark:text-violet-400 font-semibold text-xs hover:bg-violet-500/10 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Tambah Jalur Divisi (Lane)</span>
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-all duration-150",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground dark:hover:text-white",
      )}
    >
      {icon}
      <span>{label}</span>
      {badge !== undefined && (
        <span
          className={cn(
            "ml-0.5 rounded-full px-1 text-[9px] font-mono",
            active ? "bg-white/20 text-white" : "bg-muted text-muted-foreground",
          )}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

function MetricBox({ label, value, isText }: { label: string; value: string | number; isText?: boolean }) {
  return (
    <div className="rounded-xl border border-border/70 dark:border-white/[0.06] bg-muted/30 dark:bg-white/[0.02] p-2.5">
      <p className="text-[10px] text-muted-foreground truncate">{label}</p>
      <p
        className={cn(
          "font-bold text-foreground mt-0.5 truncate",
          isText ? "text-xs font-semibold" : "font-mono text-sm",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function AssetCard({
  type,
  icon,
  title,
  desc,
  onAdd,
}: {
  type: StepNodeType["type"];
  icon: React.ReactNode;
  title: string;
  desc: string;
  onAdd: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(PALETTE_MIME, type);
        e.dataTransfer.effectAllowed = "move";
      }}
      onClick={onAdd}
      className="group flex items-start gap-3 p-3 rounded-2xl border border-border/70 dark:border-white/[0.06] bg-card hover:border-primary/40 dark:hover:border-primary/50 hover:bg-primary/[0.02] dark:hover:bg-primary/[0.05] cursor-grab active:cursor-grabbing transition-all duration-150 shadow-sm"
    >
      <div className="grid h-8 w-8 place-items-center rounded-xl bg-muted/80 dark:bg-white/[0.05] group-hover:scale-105 transition-transform shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
            {title}
          </p>
          <span className="text-[9px] font-mono text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            + Tambah
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{desc}</p>
      </div>
    </div>
  );
}
