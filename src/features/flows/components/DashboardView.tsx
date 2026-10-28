"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Compass,
  Database,
  FileCheck2,
  FolderGit2,
  LayoutDashboard,
  LayoutGrid,
  LayoutTemplate,
  Plus,
  Search,
  Sparkles,
  Workflow,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createFlowAction } from "../actions";
import type { FlowCardData } from "../queries";
import { TEMPLATES, type FlowTemplate } from "../templates";
import { CreateFlowDialog } from "./CreateFlowDialog";
import { FlowCard } from "./FlowCard";
import { ShareDialog } from "./ShareDialog";

const DASHBOARD_BATCH_SIZE = 36;

interface DashboardViewProps {
  flows: FlowCardData[];
  workspaceName: string;
}

export function DashboardView({ flows, workspaceName }: DashboardViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const initialTab = tabParam || "overview";

  const [activeTab, setActiveTab] = React.useState<string>(initialTab);
  const [searchQuery, setSearchQuery] = React.useState("");
  const deferredSearch = React.useDeferredValue(searchQuery);
  const [visibleCount, setVisibleCount] = React.useState(DASHBOARD_BATCH_SIZE);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [createKind, setCreateKind] = React.useState<"sop" | "journey" | "architect">("sop");
  const [selectedShareFlow, setSelectedShareFlow] = React.useState<FlowCardData | null>(null);
  const [isCloning, setIsCloning] = React.useState<string | null>(null);
  const loadMoreRef = React.useRef<HTMLDivElement | null>(null);

  const handleShareClick = React.useCallback((f: FlowCardData) => {
    setSelectedShareFlow(f);
  }, []);

  // Sinkronisasi pencarian dari Top Navbar (Ctrl+K / Cmd+K)
  React.useEffect(() => {
    const onNavbarSearch = (e: Event) => {
      const val = (e as CustomEvent<string>).detail ?? "";
      setSearchQuery(val);
    };
    window.addEventListener("zefflow:dashboard-search", onNavbarSearch);
    return () => window.removeEventListener("zefflow:dashboard-search", onNavbarSearch);
  }, []);

  const handleOpenCreate = (k: "sop" | "journey" | "architect" = "sop") => {
    setCreateKind(k);
    setCreateOpen(true);
  };

  React.useEffect(() => {
    const current = searchParams.get("tab");
    if (current) {
      setActiveTab(current);
    } else {
      setActiveTab("overview");
    }
  }, [searchParams]);

  // Transisi tab instan tanpa RSC re-fetch server roundtrip
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    const url = newTab === "overview" || newTab === "recent" ? "/dashboard" : `/dashboard?tab=${newTab}`;
    window.history.replaceState(null, "", url);
  };

  // Preload bundle Studio Canvas di background saat browser idle agar klik "Gunakan Template" langsung membuka editor 0ms
  React.useEffect(() => {
    const preloadEditor = () => {
      void import("./FlowEditorClient");
    };
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (typeof w.requestIdleCallback === "function") {
      const idleId = w.requestIdleCallback(preloadEditor, { timeout: 1500 });
      return () => w.cancelIdleCallback?.(idleId);
    }
    const timer = window.setTimeout(preloadEditor, 500);
    return () => window.clearTimeout(timer);
  }, []);

  const handleUseTemplate = async (tmpl: FlowTemplate) => {
    if (isCloning) return;
    setIsCloning(tmpl.id);
    try {
      const res = await createFlowAction({ templateId: tmpl.id });
      if (res && !res.ok) {
        toast.error(res.error.message);
        setIsCloning(null);
      }
    } catch (err) {
      if (typeof (err as { digest?: string } | null)?.digest === "string" && (err as { digest: string }).digest.startsWith("NEXT_")) {
        return;
      }
      toast.error("Gagal menduplikasi template.");
      setIsCloning(null);
    }
  };

  const filteredFlows = React.useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    const list = flows.filter((f) => {
      if (q) {
        const matchTitle = f.title.toLowerCase().includes(q);
        const matchDesc = f.description ? f.description.toLowerCase().includes(q) : false;
        if (!matchTitle && !matchDesc) return false;
      }

      if (activeTab === "drafts") return f.status === "draft";
      if (activeTab === "sop") return f.kind === "sop";
      if (activeTab === "journey") return f.kind === "journey";
      if (activeTab === "architect") return f.kind === "architect";
      return true;
    });

    // Server query sudah mengurutkan desc(updatedAt); jaga urutan tetap konsisten tanpa alokasi Date berulang
    if (activeTab === "overview" || activeTab === "recent") {
      list.sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : b.updatedAt < a.updatedAt ? -1 : 0));
    }

    return list;
  }, [flows, deferredSearch, activeTab]);

  // Reset jumlah kartu terlihat saat tab atau kata kunci berubah
  React.useEffect(() => {
    setVisibleCount(DASHBOARD_BATCH_SIZE);
  }, [activeTab, deferredSearch]);

  // Progressive infinite scroll agar ribuan diagram tetap ter-render instan (<8ms batch 36 kartu)
  React.useEffect(() => {
    if (visibleCount >= filteredFlows.length) return;
    const el = loadMoreRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((prev) => Math.min(filteredFlows.length, prev + DASHBOARD_BATCH_SIZE));
        }
      },
      { rootMargin: "240px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [visibleCount, filteredFlows.length]);

  const { allCount, draftCount, sopCount, journeyCount, architectCount } = React.useMemo(() => {
    let draft = 0;
    let sop = 0;
    let journey = 0;
    let architect = 0;
    for (const f of flows) {
      if (f.status === "draft") draft++;
      if (f.kind === "sop") sop++;
      else if (f.kind === "journey") journey++;
      else if (f.kind === "architect") architect++;
    }
    return {
      allCount: flows.length,
      draftCount: draft,
      sopCount: sop,
      journeyCount: journey,
      architectCount: architect,
    };
  }, [flows]);

  const visibleFlows = React.useMemo(
    () => filteredFlows.slice(0, visibleCount),
    [filteredFlows, visibleCount],
  );

  const isTemplatesTab = activeTab === "templates";

  // Template unggulan untuk sidebar kanan
  const quickTemplates = React.useMemo(() => {
    return [
      TEMPLATES.find((t) => t.id === "billing-subscription-erd") ?? TEMPLATES[0]!,
      TEMPLATES.find((t) => t.id === "customer-onboarding") ?? TEMPLATES[1]!,
      TEMPLATES.find((t) => t.id === "saas-database-erd") ?? TEMPLATES[2]!,
      TEMPLATES.find((t) => t.id === "microservice-architecture") ?? TEMPLATES[3]!,
    ].filter(Boolean) as FlowTemplate[];
  }, []);

  return (
    <div className="space-y-5 animate-fade-up">
      {/* =========================================================================
          TOP HEADER: SEARCH SEJAJAR DENGAN HEADING & QUICK ACTIONS
          Menghilangkan white-space sia-sia & menjaga keselarasan baris
         ========================================================================= */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 border-b border-border/80 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-xl font-bold tracking-tight text-foreground md:text-2xl">
              {isTemplatesTab ? "Pustaka Template Alur Kerja & Arsitektur" : "Recents & File Diagram"}
            </h1>
            <span className="rounded-full border border-border bg-muted/60 px-2.5 py-0.5 font-mono text-xs font-semibold text-muted-foreground">
              {isTemplatesTab ? `${TEMPLATES.length} Template` : `${filteredFlows.length} File`}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Workspace: <span className="font-semibold text-foreground">{workspaceName}</span> • Kelola SOP operasional dan arsitektur database Anda.
          </p>
        </div>

        {/* Action Controls: Search Sejajar Heading + Tombol Pembuatan */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Kotak Pencarian Sejajar Heading */}
          {!isTemplatesTab && (
            <div className="relative w-full sm:w-64 md:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/75" />
              <input
                type="text"
                placeholder="Cari file diagram atau SOP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-xl border border-border/80 dark:border-white/[0.08] bg-slate-100/70 dark:bg-[#12131F] pl-9 pr-7 text-xs text-foreground placeholder:text-muted-foreground/70 focus:border-violet-500/60 focus:bg-white dark:focus:bg-[#0E0F16] focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all duration-150 shadow-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          )}

          <Button
            variant="brand"
            size="sm"
            onClick={() => handleOpenCreate("sop")}
            className="gap-2 font-semibold text-xs h-9 px-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 shadow-[0_0_16px_rgba(139,92,246,0.25)]"
          >
            <Workflow className="h-3.5 w-3.5" />
            <span>+ Swimlane SOP</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenCreate("architect")}
            className="gap-2 font-semibold text-xs h-9 px-3.5 border-sky-500/40 bg-sky-500/10 text-sky-600 dark:text-sky-300 hover:bg-sky-500/20 hover:border-sky-500/70 shadow-[0_0_16px_rgba(14,165,233,0.15)] transition-all"
          >
            <Database className="h-3.5 w-3.5 text-sky-500" />
            <span>+ Studio 2: Architect</span>
          </Button>

          {!isTemplatesTab && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleTabChange("templates")}
              className="gap-1.5 text-xs h-9 px-3 text-muted-foreground hover:text-foreground"
              title="Buka seluruh koleksi template"
            >
              <LayoutTemplate className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Pustaka Template</span>
            </Button>
          )}
        </div>
      </div>

      {/* FULL TEMPLATE LIBRARY VIEW (Jika tab template aktif) */}
      {isTemplatesTab ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Pilih template di bawah untuk langsung menduplikasikannya ke workspace Anda dan mulai mengedit.
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleTabChange("overview")}
              className="text-xs text-primary font-semibold"
            >
              ← Kembali ke File Saya
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {TEMPLATES.map((tmpl) => (
              <div
                key={tmpl.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "rounded-md border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider",
                        tmpl.kind === "architect"
                          ? "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400"
                          : tmpl.kind === "journey"
                          ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400",
                      )}
                    >
                      {tmpl.kind === "architect"
                        ? "STUDIO 2: ARCHITECT"
                        : tmpl.kind === "journey"
                        ? "CUSTOMER JOURNEY"
                        : "SOP STANDAR"}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {tmpl.lanes.length > 0 ? `${tmpl.lanes.length} Divisi` : "Freeform ERD"}
                    </span>
                  </div>

                  <h3 className="mt-2.5 font-display text-xs font-semibold text-foreground tracking-tight group-hover:text-primary transition-colors">
                    {tmpl.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground leading-relaxed">
                    {tmpl.description}
                  </p>

                  {tmpl.lanes.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {tmpl.lanes.slice(0, 3).map((l, idx) => (
                        <span
                          key={idx}
                          className="rounded-md bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground"
                        >
                          {l.title}
                        </span>
                      ))}
                      {tmpl.lanes.length > 3 && (
                        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">
                          +{tmpl.lanes.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-border/60">
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={isCloning === tmpl.id}
                    onClick={() => handleUseTemplate(tmpl)}
                    className="w-full justify-between text-xs font-semibold"
                  >
                    <span>Gunakan Template</span>
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        /* FIGMA-STYLE SPLIT LAYOUT: TENGAH PROJEK (4 KOLOM), KANAN QUICK START */
        <div className="flex flex-col lg:flex-row gap-5 items-start">
          {/* =========================================================================
              KOLOM UTAMA (TENGAH): File & Projek Diagram
             ========================================================================= */}
          <main className="flex-1 min-w-0 w-full space-y-4">
            {/* Filter Pills Baris Sendiri (Spacious, Tanpa Terhimpit Search) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <TabPill
                active={activeTab === "overview" || activeTab === "recent"}
                onClick={() => handleTabChange("overview")}
                label="Terbaru"
                count={allCount}
              />
              <TabPill
                active={activeTab === "all"}
                onClick={() => handleTabChange("all")}
                label="Semua Diagram"
                count={allCount}
              />
              <TabPill
                active={activeTab === "sop"}
                onClick={() => handleTabChange("sop")}
                label="Studio 1: SOP"
                count={sopCount}
              />
              <TabPill
                active={activeTab === "architect"}
                onClick={() => handleTabChange("architect")}
                label="Studio 2: Architect"
                count={architectCount}
              />
              <TabPill
                active={activeTab === "journey"}
                onClick={() => handleTabChange("journey")}
                label="Customer Journey"
                count={journeyCount}
              />
              <TabPill
                active={activeTab === "drafts"}
                onClick={() => handleTabChange("drafts")}
                label="Drafts"
                count={draftCount}
              />
            </div>

            {/* Grid Kartu Projek: Mampu Menampilkan 4 Kolom Ke Samping (Windowed untuk ribuan file) */}
            {filteredFlows.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-3.5">
                  {visibleFlows.map((flow) => (
                    <FlowCard
                      key={flow.id}
                      flow={flow}
                      onShareClick={handleShareClick}
                    />
                  ))}
                </div>
                {visibleCount < filteredFlows.length && (
                  <div ref={loadMoreRef} className="pt-2 text-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setVisibleCount((prev) => Math.min(filteredFlows.length, prev + DASHBOARD_BATCH_SIZE))
                      }
                      className="text-xs font-semibold"
                    >
                      Muat lebih banyak ({filteredFlows.length - visibleCount} file tersisa)
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center shadow-sm">
                <div className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-muted/60 text-muted-foreground">
                  <Workflow className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-3 font-display text-sm font-semibold text-foreground">
                  {searchQuery
                    ? "Diagram tidak ditemukan"
                    : activeTab === "architect"
                    ? "Belum ada Diagram Arsitektur / Database"
                    : activeTab === "journey"
                    ? "Belum ada Customer Journey Map"
                    : activeTab === "sop"
                    ? "Belum ada diagram SOP Bisnis"
                    : "Belum ada diagram di workspace ini"}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                  {searchQuery
                    ? `Tidak ada diagram yang cocok dengan kata kunci "${searchQuery}".`
                    : "Mulai buat dokumen SOP swimlane multi-divisi atau skema database relasional baru sekarang."}
                </p>
                {!searchQuery && (
                  <div className="mt-4 flex flex-wrap items-center gap-2.5">
                    <Button
                      variant="brand"
                      size="sm"
                      onClick={() => handleOpenCreate("sop")}
                      className="text-xs font-semibold gap-1.5 h-8 px-3"
                    >
                      <Workflow className="h-3 w-3" />
                      <span>Buat Swimlane SOP</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenCreate("architect")}
                      className="text-xs font-semibold gap-1.5 h-8 px-3 border-sky-500/40 text-sky-400 bg-sky-500/10 hover:bg-sky-500/20"
                    >
                      <Database className="h-3 w-3" />
                      <span>Buat Studio 2: Architect</span>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </main>

          {/* =========================================================================
              SIDEBAR KANAN (RIGHT SIDEBAR): Mulai Cepat & Template Populer
              Kompak & leluasa, tidak merebut ruang grid 4 kolom projek
             ========================================================================= */}
          <aside className="w-full lg:w-72 xl:w-[280px] shrink-0 space-y-3.5 lg:sticky lg:top-4">
            {/* Quick Create Studio Cards */}
            <div className="rounded-2xl border border-border/80 dark:border-white/[0.08] bg-card p-3 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                  Mulai Cepat Dari Nol
                </span>
                <Sparkles className="h-3 w-3 text-primary" />
              </div>

              {/* Button Studio 1 */}
              <button
                type="button"
                onClick={() => handleOpenCreate("sop")}
                className="group flex w-full items-center gap-2.5 rounded-xl border border-violet-500/30 bg-violet-500/[0.06] hover:bg-violet-500/15 p-2 text-left transition-all duration-150 hover:border-violet-500/60"
              >
                <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-violet-600 text-white shadow-sm group-hover:scale-105 transition-transform">
                  <Workflow className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-foreground group-hover:text-violet-500 transition-colors">
                    Studio 1: Swimlane SOP
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    Alur proses & tugas divisi
                  </p>
                </div>
                <Plus className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground shrink-0" />
              </button>

              {/* Button Studio 2 */}
              <button
                type="button"
                onClick={() => handleOpenCreate("architect")}
                className="group flex w-full items-center gap-2.5 rounded-xl border border-sky-500/30 bg-sky-500/[0.06] hover:bg-sky-500/15 p-2 text-left transition-all duration-150 hover:border-sky-500/60"
              >
                <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-sky-600 text-white shadow-sm group-hover:scale-105 transition-transform">
                  <Database className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-foreground group-hover:text-sky-500 transition-colors">
                    Studio 2: Architect
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    Skema database ERD & sistem
                  </p>
                </div>
                <Plus className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground shrink-0" />
              </button>
            </div>

            {/* Popular Templates Shelf in Right Sidebar */}
            <div className="rounded-2xl border border-border/80 dark:border-white/[0.08] bg-card p-3 shadow-sm space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-foreground">
                    Template Populer
                  </h3>
                  <p className="text-[10px] text-muted-foreground">
                    Duplikasi cepat ke kanvas
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleTabChange("templates")}
                  className="text-[10px] font-semibold text-primary hover:underline flex items-center gap-0.5"
                >
                  <span>Semua ({TEMPLATES.length})</span>
                  <ArrowRight className="h-2.5 w-2.5" />
                </button>
              </div>

              {/* Quick Template Cards */}
              <div className="space-y-1.5">
                {quickTemplates.map((tmpl) => (
                  <div
                    key={tmpl.id}
                    className="group rounded-xl border border-border/70 dark:border-white/[0.06] bg-muted/30 p-2 transition-all duration-150 hover:bg-muted/70 hover:border-primary/40"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.2 font-mono text-[8px] font-bold uppercase",
                          tmpl.kind === "architect"
                            ? "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                            : tmpl.kind === "journey"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : "bg-violet-500/10 text-violet-600 dark:text-violet-400",
                        )}
                      >
                        {tmpl.kind === "architect" ? "ARCHITECT" : tmpl.kind === "journey" ? "JOURNEY" : "SOP"}
                      </span>
                      <span className="font-mono text-[9px] text-muted-foreground">
                        {tmpl.lanes.length > 0 ? `${tmpl.lanes.length} Divisi` : "Freeform ERD"}
                      </span>
                    </div>

                    <h4 className="mt-1 text-[11px] font-bold text-foreground truncate group-hover:text-primary transition-colors">
                      {tmpl.title}
                    </h4>
                    <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                      {tmpl.description}
                    </p>

                    <div className="mt-1.5 flex items-center justify-end">
                      <Button
                        variant="secondary"
                        size="sm"
                        loading={isCloning === tmpl.id}
                        onClick={() => handleUseTemplate(tmpl)}
                        className="h-5.5 px-2 text-[10px] font-semibold gap-1 bg-background hover:bg-primary hover:text-primary-foreground transition-all"
                      >
                        <span>Gunakan</span>
                        <Sparkles className="h-2.5 w-2.5 text-primary group-hover:text-primary-foreground" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Create Flow Modal */}
      <CreateFlowDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultKind={createKind}
      />

      {/* Share Modal */}
      {selectedShareFlow && (
        <ShareDialog
          flowId={selectedShareFlow.id}
          flowTitle={selectedShareFlow.title}
          initialShareEnabled={selectedShareFlow.shareEnabled}
          open={!!selectedShareFlow}
          onOpenChange={(open) => !open && setSelectedShareFlow(null)}
          onShareUpdated={(enabled) => {
            selectedShareFlow.shareEnabled = enabled;
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function TabPill({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all duration-150 shrink-0",
        active
          ? "bg-primary text-primary-foreground font-semibold shadow-sm"
          : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted border border-border/70",
      )}
    >
      <span>{label}</span>
      {typeof count === "number" && (
        <span
          className={cn(
            "rounded-full px-1.5 py-0.2 text-[9px] font-mono",
            active ? "bg-white/20 text-white font-bold" : "bg-muted text-muted-foreground",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
