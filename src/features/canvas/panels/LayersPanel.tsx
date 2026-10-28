"use client";

import * as React from "react";
import {
  AlertCircle,
  ArrowRightFromLine,
  Boxes,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Compass,
  Database,
  GitBranch,
  Image as ImageIcon,
  Layers,
  ListOrdered,
  Network,
  Plus,
  Radio,
  Search,
  Server,
  Square,
  Trash2,
  Upload,
  User2,
  X,
} from "lucide-react";
import { useReactFlow } from "@xyflow/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { LANE_STYLES } from "../lib/layout";
import { useCanvasStore, type SidebarTab } from "../store/canvas-store";
import { isLane, isStep, type StepNodeType } from "../types";
import { PALETTE_MIME } from "./Toolbar";

const LAYER_BATCH_SIZE = 80;
const OUTLINE_BATCH_SIZE = 80;

/**
 * Kompres & downscale logo perusahaan raster di sisi klien (maks 360x140 WebP)
 * agar payload JSON dokumen pada setiap autosave ringan (~15-25 KB alih-alih >1 MB base64).
 */
async function compressLogoFile(file: File): Promise<string> {
  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Gagal membaca file logo."));
    reader.readAsDataURL(file);
  });

  if (file.type === "image/svg+xml") return rawDataUrl;

  return new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const maxW = 360;
      const maxH = 140;
      const scale = Math.min(1, maxW / (img.naturalWidth || 1), maxH / (img.naturalHeight || 1));
      const w = Math.max(1, Math.round(img.naturalWidth * scale));
      const h = Math.max(1, Math.round(img.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(rawDataUrl);
        return;
      }
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      const compressed = canvas.toDataURL("image/webp", 0.88);
      resolve(compressed.length < rawDataUrl.length ? compressed : rawDataUrl);
    };
    img.onerror = () => resolve(rawDataUrl);
    img.src = rawDataUrl;
  });
}

/**
 * Flyout Drawer Studio Sisi Kiri (Figma-Style Slideout Panel)
 * - Outer gate ringan: saat drawer tertutup (`!sidebarOpen`), TIDAK subscribe ke `s.nodes`
 *   sehingga drag 60fps di kanvas bebas dari komputasi filter/sort/estimasi waktu.
 */
export function LayersPanel() {
  const sidebarOpen = useCanvasStore((s) => s.sidebarOpen);
  const activeSidebarTab = useCanvasStore((s) => s.activeSidebarTab);

  if (!sidebarOpen || !activeSidebarTab) return null;
  return <LayersPanelContent activeSidebarTab={activeSidebarTab} />;
}

function LayersPanelContent({ activeSidebarTab }: { activeSidebarTab: SidebarTab }) {
  const setActiveSidebarTab = useCanvasStore((s) => s.setActiveSidebarTab);

  const [searchQuery, setSearchQuery] = React.useState("");
  const deferredSearch = React.useDeferredValue(searchQuery);
  const [collapsedLanes, setCollapsedLanes] = React.useState<Record<string, boolean>>({});
  const [laneItemLimits, setLaneItemLimits] = React.useState<Record<string, number>>({});
  const [outlineLimit, setOutlineLimit] = React.useState(OUTLINE_BATCH_SIZE);

  const nodes = useCanvasStore((s) => s.nodes);
  const selectedId = useCanvasStore((s) => s.selectedId);
  const readOnly = useCanvasStore((s) => s.readOnly);
  const companyLogo = useCanvasStore((s) => s.companyLogo);
  const companyName = useCanvasStore((s) => s.companyName);
  const docCode = useCanvasStore((s) => s.docCode);
  const orientation = useCanvasStore((s) => s.orientation);
  const kind = useCanvasStore((s) => s.kind);

  const { select, removeLane, deleteSelected, addStep, addLane, updateBranding, setOrientation } =
    useCanvasStore.getState();
  const { fitView } = useReactFlow();

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const outlineSentinelRef = React.useRef<HTMLDivElement | null>(null);

  const lanes = React.useMemo(() => nodes.filter(isLane), [nodes]);
  const laneById = React.useMemo(() => new Map(lanes.map((l) => [l.id, l])), [lanes]);
  const steps = React.useMemo(() => nodes.filter(isStep), [nodes]);

  // Kelompokkan steps per lane parent (hanya saat tab layers aktif)
  const stepsByLane = React.useMemo(() => {
    const map = new Map<string, StepNodeType[]>();
    if (activeSidebarTab !== "layers") return map;
    for (const lane of lanes) map.set(lane.id, []);
    for (const step of steps) {
      const pid = step.parentId ?? "";
      if (map.has(pid)) {
        map.get(pid)!.push(step);
      } else {
        if (!map.has("__unassigned__")) map.set("__unassigned__", []);
        map.get("__unassigned__")!.push(step);
      }
    }
    return map;
  }, [activeSidebarTab, lanes, steps]);

  // Filter pencarian ter-defer dengan lookup lane O(1)
  const filteredStepsByLane = React.useMemo(() => {
    if (activeSidebarTab !== "layers") return stepsByLane;
    const q = deferredSearch.trim().toLowerCase();
    if (!q) return stepsByLane;
    const map = new Map<string, StepNodeType[]>();
    for (const [laneId, list] of stepsByLane.entries()) {
      const matched = list.filter(
        (s) =>
          (s.data.title || "").toLowerCase().includes(q) ||
          (s.data.description || "").toLowerCase().includes(q) ||
          (s.data.owner || "").toLowerCase().includes(q),
      );
      const laneTitle = (laneById.get(laneId)?.data.title || "").toLowerCase();
      if (matched.length > 0 || (laneTitle && laneTitle.includes(q))) {
        map.set(laneId, matched);
      }
    }
    return map;
  }, [activeSidebarTab, deferredSearch, stepsByLane, laneById]);

  // Hitung total estimasi waktu hanya saat tab outline aktif
  const timeSummary = React.useMemo(() => {
    if (activeSidebarTab !== "outline") {
      return { formatted: "0 menit", minutes: 0, missingInfoCount: 0 };
    }
    let minutes = 0;
    let missingInfoCount = 0;

    for (const s of steps) {
      if (!s.data.durationValue && !s.data.owner) {
        missingInfoCount++;
      }
      if (!s.data.durationValue) continue;
      const v = s.data.durationValue;
      const u = s.data.durationUnit || "menit";
      if (u === "menit") minutes += v;
      else if (u === "jam") minutes += v * 60;
      else if (u === "hari") minutes += v * 60 * 8; // asumsi 8 jam kerja/hari
    }

    const days = Math.floor(minutes / (60 * 8));
    const hours = Math.floor((minutes % (60 * 8)) / 60);
    const mins = minutes % 60;

    const parts: string[] = [];
    if (days > 0) parts.push(`${days} hari`);
    if (hours > 0) parts.push(`${hours} jam`);
    if (mins > 0 || parts.length === 0) parts.push(`${mins} menit`);

    return { formatted: parts.join(" "), minutes, missingInfoCount };
  }, [activeSidebarTab, steps]);

  // Progressive infinite scroll pada tab Outline untuk ribuan item
  React.useEffect(() => {
    if (activeSidebarTab !== "outline" || outlineLimit >= steps.length) return;
    const el = outlineSentinelRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setOutlineLimit((prev) => Math.min(steps.length, prev + OUTLINE_BATCH_SIZE));
        }
      },
      { rootMargin: "160px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [activeSidebarTab, outlineLimit, steps.length]);

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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Harap unggah file gambar (PNG, JPG, SVG, WebP)");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran file logo maksimal 2 MB.");
      return;
    }

    try {
      const dataUrl = await compressLogoFile(file);
      if (dataUrl) {
        updateBranding({ companyLogo: dataUrl });
        toast.success("Logo perusahaan berhasil dioptimalkan & disimpan!");
      }
    } catch {
      toast.error("Gagal memproses file logo.");
    }
  };

  return (
    <>
      {/* Backdrop di layar mobile agar kanvas tidak terkunci */}
      <div
        className="fixed inset-0 z-20 bg-black/35 backdrop-blur-xs md:hidden"
        onClick={() => setActiveSidebarTab(null)}
        aria-hidden="true"
      />

      <aside
        aria-label="Panel Laci Samping"
        className="absolute bottom-2.5 left-[54px] top-2.5 sm:bottom-4 sm:left-[66px] sm:top-4 z-20 flex w-[285px] sm:w-[315px] max-w-[calc(100vw-4.5rem)] animate-scale-in flex-col overflow-hidden rounded-2xl sm:rounded-3xl border border-border/80 dark:border-white/[0.08] bg-white dark:bg-[#0E0F16] text-foreground dark:text-white shadow-2xl"
      >
        {/* Header Drawer yang Rapi & Tidak Terhimpit */}
        <header className="flex items-center justify-between border-b border-border/70 dark:border-white/[0.08] px-3.5 py-2.5 bg-slate-50/80 dark:bg-[#12131D]">
          <div className="flex items-center gap-1.5 min-w-0">
            {activeSidebarTab === "layers" && (
              <>
                <Layers className="h-4 w-4 text-violet-500 shrink-0" />
                <span className="text-xs font-bold truncate">Struktur & Layers</span>
                <span className="ml-1 rounded-full bg-violet-500/10 dark:bg-violet-500/20 px-1.5 py-0.2 font-mono text-[9px] font-bold text-violet-600 dark:text-violet-400">
                  {steps.length}
                </span>
              </>
            )}
            {activeSidebarTab === "outline" && (
              <>
                <ListOrdered className="h-4 w-4 text-sky-500 shrink-0" />
                <span className="text-xs font-bold truncate">Ringkasan SOP</span>
              </>
            )}
            {activeSidebarTab === "branding" && (
              <>
                <Building2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="text-xs font-bold truncate">Kop & Logo Perusahaan</span>
              </>
            )}
            {activeSidebarTab === "assets" && (
              <>
                <Boxes className="h-4 w-4 text-amber-500 shrink-0" />
                <span className="text-xs font-bold truncate">Katalog Bentuk</span>
              </>
            )}
          </div>

          {/* Tombol Tutup Bersih (Comfortable Close Button) */}
          <button
            type="button"
            onClick={() => setActiveSidebarTab(null)}
            title="Tutup laci (Esc)"
            className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground dark:hover:text-white shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* =========================================================================
            TAB 1: LAYERS TREE
           ========================================================================= */}
        {activeSidebarTab === "layers" && (
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Search Bar */}
            <div className="p-2.5 border-b border-border/70 dark:border-white/[0.06]">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Cari langkah atau divisi..."
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

            {/* Tree View (Windowed per-lane agar ribuan item tetap ringan) */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 no-scrollbar">
              {lanes.length === 0 && (filteredStepsByLane.get("__unassigned__")?.length ?? 0) === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  <p>{kind === "architect" ? "Belum ada komponen arsitektur" : "Belum ada jalur divisi (lane)"}</p>
                  {!readOnly && kind !== "architect" && (
                    <button
                      onClick={() => addLane()}
                      className="mt-2.5 inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20"
                    >
                      <Plus className="h-3.5 w-3.5" /> Tambah Jalur Divisi
                    </button>
                  )}
                </div>
              ) : lanes.length === 0 ? (
                (() => {
                  const freeSteps = filteredStepsByLane.get("__unassigned__") || [];
                  const limit = laneItemLimits["__unassigned__"] ?? LAYER_BATCH_SIZE;
                  const visibleFree = freeSteps.slice(0, limit);
                  return (
                    <div className="space-y-1">
                      {visibleFree.map((step) => {
                        const isStepSelected = selectedId === step.id;
                        return (
                          <div
                            key={step.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => handleFocusNode(step.id)}
                            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleFocusNode(step.id)}
                            className={cn(
                              "group flex items-center justify-between px-2.5 py-1.5 cursor-pointer rounded-lg text-xs transition-colors",
                              isStepSelected
                                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground dark:hover:bg-white/[0.05]",
                            )}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Database className="h-3 w-3 text-sky-500 shrink-0" />
                              <span className="truncate">{step.data.title || "Komponen Baru"}</span>
                            </div>
                          </div>
                        );
                      })}
                      {freeSteps.length > limit && (
                        <button
                          type="button"
                          onClick={() =>
                            setLaneItemLimits((prev) => ({
                              ...prev,
                              __unassigned__: limit + LAYER_BATCH_SIZE,
                            }))
                          }
                          className="w-full py-1.5 text-[11px] font-semibold text-primary hover:underline"
                        >
                          Tampilkan {Math.min(LAYER_BATCH_SIZE, freeSteps.length - limit)} dari {freeSteps.length - limit} lainnya...
                        </button>
                      )}
                    </div>
                  );
                })()
              ) : (
                lanes.map((lane) => {
                  const laneSteps = filteredStepsByLane.get(lane.id) || [];
                  const isCollapsed = collapsedLanes[lane.id] ?? false;
                  const isLaneSelected = selectedId === lane.id;
                  const style = LANE_STYLES[lane.data.color];
                  const stepLimit = laneItemLimits[lane.id] ?? LAYER_BATCH_SIZE;
                  const visibleSteps = laneSteps.slice(0, stepLimit);

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
                            className="grid h-4 w-4 place-items-center text-muted-foreground hover:text-foreground"
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
                          <span className="font-mono text-[10px] text-muted-foreground bg-muted/60 dark:bg-white/[0.06] px-1.5 py-0.2 rounded-md">
                            {laneSteps.length}
                          </span>
                          {!readOnly && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Hapus lane "${lane.data.title}" beserta langkah di dalamnya?`)) {
                                  removeLane(lane.id);
                                }
                              }}
                              title="Hapus lane"
                              className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-rose-500 transition-opacity"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Step Items inside Lane */}
                      {!isCollapsed && visibleSteps.length > 0 && (
                        <div className="pl-6 pr-2 py-1 space-y-1">
                          {visibleSteps.map((step) => {
                            const isStepSelected = selectedId === step.id;
                            const isDecision = step.type === "decision";
                            const isTerminal = step.type === "terminal";

                            return (
                              <div
                                key={step.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => handleFocusNode(step.id)}
                                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleFocusNode(step.id)}
                                className={cn(
                                  "group flex items-center justify-between px-2 py-1.5 cursor-pointer rounded-lg text-xs transition-colors",
                                  isStepSelected
                                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground dark:hover:bg-white/[0.05]",
                                )}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  {isTerminal ? (
                                    <ArrowRightFromLine className="h-3 w-3 text-emerald-500 shrink-0" />
                                  ) : isDecision ? (
                                    <GitBranch className="h-3 w-3 text-amber-500 shrink-0" />
                                  ) : (
                                    <Square className="h-3 w-3 text-sky-500 shrink-0" />
                                  )}
                                  <span className="truncate">{step.data.title || "Langkah Baru"}</span>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  {step.data.durationValue && (
                                    <span
                                      className={cn(
                                        "font-mono text-[9px] px-1 rounded",
                                        isStepSelected
                                          ? "bg-white/20 text-white"
                                          : "text-muted-foreground/80 bg-muted/40",
                                      )}
                                    >
                                      {step.data.durationValue}
                                      {step.data.durationUnit === "jam"
                                        ? "j"
                                        : step.data.durationUnit === "hari"
                                          ? "h"
                                          : "m"}
                                    </span>
                                  )}
                                  {!readOnly && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteSelected(step.id);
                                      }}
                                      title="Hapus langkah"
                                      className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-rose-500 transition-opacity"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          {laneSteps.length > stepLimit && (
                            <button
                              type="button"
                              onClick={() =>
                                setLaneItemLimits((prev) => ({
                                  ...prev,
                                  [lane.id]: stepLimit + LAYER_BATCH_SIZE,
                                }))
                              }
                              className="w-full py-1 text-left pl-2 text-[11px] font-semibold text-primary hover:underline"
                            >
                              + Tampilkan {Math.min(LAYER_BATCH_SIZE, laneSteps.length - stepLimit)} lainnya ({laneSteps.length - stepLimit} tersisa)
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Add Lane Footer */}
            {!readOnly && lanes.length > 0 && (
              <div className="p-2 border-t border-border/70 dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => addLane()}
                  className="w-full flex items-center justify-center gap-1.5 h-8 rounded-xl border border-dashed border-border hover:border-primary/50 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Tambah Lane Baru</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 2: OUTLINE & RINGKASAN SOP
           ========================================================================= */}
        {activeSidebarTab === "outline" && (
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="p-3 border-b border-border/70 dark:border-white/[0.06] space-y-2 bg-muted/20">
              <div className="grid grid-cols-2 gap-2">
                <MetricBox label="Total Durasi" value={timeSummary.formatted} />
                <MetricBox label="Jumlah Langkah" value={`${steps.length} item`} />
              </div>
              {timeSummary.missingInfoCount > 0 && (
                <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-2.5 py-1.5 text-[11px] text-amber-600 dark:text-amber-400">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{timeSummary.missingInfoCount} langkah belum ada PIC/durasi</span>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-2.5 space-y-2 no-scrollbar">
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground px-1">
                Alur Kerja Berurutan
              </p>
              {steps.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  <p>Belum ada langkah kerja dibuat.</p>
                </div>
              ) : (
                <>
                  {steps.slice(0, outlineLimit).map((step, idx) => {
                    const parentLane = step.parentId ? laneById.get(step.parentId) : undefined;
                    return (
                      <div
                        key={step.id}
                        onClick={() => handleFocusNode(step.id)}
                        className="group flex items-start gap-2.5 p-2 rounded-xl border border-border/60 hover:border-primary/40 hover:bg-muted/40 cursor-pointer transition-colors"
                      >
                        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-muted text-[10px] font-mono font-bold text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {step.data.title || "Langkah tanpa judul"}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground truncate">
                            {parentLane && (
                              <span className="font-medium text-foreground/80">{parentLane.data.title}</span>
                            )}
                            {step.data.owner && <span>• {step.data.owner}</span>}
                            {step.data.durationValue && (
                              <span>
                                • {step.data.durationValue} {step.data.durationUnit || "menit"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {outlineLimit < steps.length && (
                    <div ref={outlineSentinelRef} className="pt-1 pb-2 text-center">
                      <button
                        type="button"
                        onClick={() => setOutlineLimit((prev) => Math.min(steps.length, prev + OUTLINE_BATCH_SIZE))}
                        className="text-[11px] font-semibold text-primary hover:underline"
                      >
                        Muat lebih banyak ({steps.length - outlineLimit} langkah tersisa)
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: BRANDING & KOP SURAT RESMI
           ========================================================================= */}
        {activeSidebarTab === "branding" && (
          <div className="flex-1 overflow-y-auto p-3.5 space-y-4 no-scrollbar">
            {/* Upload Logo Perusahaan */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-foreground">Logo Perusahaan</Label>

              {companyLogo ? (
                <div className="flex items-center gap-3 p-3 rounded-2xl border border-border/80 bg-muted/30">
                  <div className="h-12 w-16 rounded-xl bg-white dark:bg-black/40 border border-border flex items-center justify-center p-1 overflow-hidden shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={companyLogo} alt="Logo Perusahaan" className="max-h-full max-w-full object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">Logo Terpasang</p>
                    <p className="text-[10px] text-muted-foreground truncate">Otomatis dicetak di banner ekspor</p>
                    <button
                      type="button"
                      disabled={readOnly}
                      onClick={() => updateBranding({ companyLogo: "" })}
                      className="mt-1 text-[11px] font-medium text-rose-500 hover:underline"
                    >
                      Hapus Logo
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => !readOnly && fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-border/80 hover:border-primary/50 hover:bg-primary/[0.02] cursor-pointer transition-all text-center"
                >
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary mb-2">
                    <Upload className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-bold text-foreground">Unggah Logo Resmi</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">PNG, JPG, SVG atau WebP (Maks. 800 KB)</p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
                disabled={readOnly}
              />
            </div>

            {/* Nama Instansi / Perusahaan */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Nama Perusahaan / Organisasi</Label>
              <Input
                value={companyName}
                maxLength={100}
                placeholder="mis. PT Nusantara Solusi Digital"
                disabled={readOnly}
                onChange={(e) => updateBranding({ companyName: e.target.value })}
                className="h-8 text-xs"
              />
            </div>

            {/* Nomor Dokumen SOP */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Kode Dokumen / Nomor SOP</Label>
              <Input
                value={docCode}
                maxLength={60}
                placeholder="mis. SOP-IT-2026-004"
                disabled={readOnly}
                onChange={(e) => updateBranding({ docCode: e.target.value })}
                className="h-8 text-xs font-mono"
              />
            </div>

            {/* Arah Alur Diagram */}
            <div className="space-y-1.5 pt-2 border-t border-border/70 dark:border-white/[0.06]">
              <Label className="text-xs font-bold text-foreground flex items-center justify-between">
                <span>Arah Alur Alami</span>
                <span className="font-mono text-[10px] text-primary uppercase font-bold">
                  {orientation === "vertical" ? "Atas ke Bawah" : "Kiri ke Kanan"}
                </span>
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={orientation === "horizontal" ? "brand" : "outline"}
                  disabled={readOnly}
                  onClick={() => setOrientation("horizontal")}
                  className="text-xs h-8 font-semibold"
                >
                  Horizontal
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={orientation === "vertical" ? "brand" : "outline"}
                  disabled={readOnly}
                  onClick={() => setOrientation("vertical")}
                  className="text-xs h-8 font-semibold"
                >
                  Vertikal
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-[11px] text-muted-foreground leading-relaxed">
              <p className="font-semibold text-foreground mb-0.5">ℹ️ Cetak Resmi Otomatis</p>
              Logo, nama instansi, dan kode SOP akan tertata rapi di kop banner saat dokumen di-ekspor ke PDF atau gambar PNG 4K.
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: KATALOG BENTUK & ASET CEPAT
           ========================================================================= */}
        {activeSidebarTab === "assets" && (
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 no-scrollbar">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
              {kind === "architect" ? "Katalog Komponen Database & Arsitektur" : "Tarik ke Kanvas atau Klik untuk Menambah"}
            </p>

            {kind === "architect" ? (
              <>
                <AssetCard
                  type="step"
                  icon={<Database className="h-4 w-4 text-sky-400" />}
                  title="Tabel Database (ERD)"
                  desc="Tabel relasional multi-kolom lengkap dengan PK & FK"
                  onAdd={() => addStep("step")}
                />
                <AssetCard
                  type="step"
                  icon={<Server className="h-4 w-4 text-violet-400" />}
                  title="Microservice API"
                  desc="Service container backend terisolasi (Node, Go, Python)"
                  onAdd={() => addStep("step")}
                />
                <AssetCard
                  type="decision"
                  icon={<Radio className="h-4 w-4 text-amber-400" />}
                  title="Event Broker / Stream"
                  desc="Apache Kafka, RabbitMQ, Redis Pub/Sub topic"
                  onAdd={() => addStep("decision")}
                />
                <AssetCard
                  type="terminal"
                  icon={<Network className="h-4 w-4 text-emerald-400" />}
                  title="API Gateway / Proxy"
                  desc="Kong, Envoy, Cloudflare, Reverse Proxy"
                  onAdd={() => addStep("terminal")}
                />
              </>
            ) : (
              <>
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
                    type="button"
                    onClick={() => addLane()}
                    className="w-full flex items-center justify-center gap-2 h-9 rounded-xl border border-dashed border-violet-500/40 bg-violet-500/5 text-violet-600 dark:text-violet-400 font-semibold text-xs hover:bg-violet-500/10 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Tambah Jalur Divisi (Lane)</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </aside>
    </>
  );
}

function MetricBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border/70 dark:border-white/[0.06] bg-muted/40 dark:bg-white/[0.02] p-2.5">
      <p className="text-[10px] text-muted-foreground truncate">{label}</p>
      <p className="font-bold text-foreground mt-0.5 font-mono text-xs truncate">{value}</p>
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
      className="group flex items-start gap-3 p-3 rounded-2xl border border-border/70 dark:border-white/[0.06] bg-card hover:border-primary/40 dark:hover:border-primary/50 hover:bg-primary/[0.02] dark:hover:bg-primary/[0.05] cursor-grab active:cursor-grabbing transition-all duration-150 shadow-xs"
    >
      <div className="grid h-8 w-8 place-items-center rounded-xl bg-muted/80 dark:bg-white/[0.05] group-hover:scale-105 transition-transform shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{title}</p>
          <span className="text-[9px] font-mono text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            + Tambah
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{desc}</p>
      </div>
    </div>
  );
}
