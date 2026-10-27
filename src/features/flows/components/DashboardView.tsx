"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Compass,
  FileCheck2,
  FolderGit2,
  LayoutDashboard,
  LayoutGrid,
  LayoutTemplate,
  Plus,
  Search,
  Sparkles,
  Workflow,
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
  const [createOpen, setCreateOpen] = React.useState(false);
  const [selectedShareFlow, setSelectedShareFlow] = React.useState<FlowCardData | null>(null);
  const [isCloning, setIsCloning] = React.useState(false);

  React.useEffect(() => {
    const current = searchParams.get("tab");
    if (current) {
      setActiveTab(current);
    } else {
      setActiveTab("overview");
    }
  }, [searchParams]);

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    const url = newTab === "overview" || newTab === "recent" ? "/dashboard" : `/dashboard?tab=${newTab}`;
    router.push(url);
  };

  const handleUseTemplate = async (tmpl: FlowTemplate) => {
    setIsCloning(true);
    try {
      const res = await createFlowAction({ templateId: tmpl.id });
      if (res.ok) {
        toast.success(`Template "${tmpl.title}" siap digunakan!`);
        router.push(`/flows/${res.data.id}`);
      } else {
        toast.error(res.error.message);
      }
    } catch {
      toast.error("Gagal menduplikasi template.");
    } finally {
      setIsCloning(false);
    }
  };

  const filteredFlows = React.useMemo(() => {
    return flows.filter((f) => {
      const matchesSearch =
        f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.description && f.description.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (activeTab === "drafts") return f.status === "draft";
      if (activeTab === "sop") return f.kind === "sop";
      if (activeTab === "journey") return f.kind === "journey";
      return true;
    });
  }, [flows, searchQuery, activeTab]);

  const draftCount = flows.filter((f) => f.status === "draft").length;
  const sopCount = flows.filter((f) => f.kind === "sop").length;
  const journeyCount = flows.filter((f) => f.kind === "journey").length;

  const isOverview = activeTab === "overview" || activeTab === "recent";
  const isTemplatesTab = activeTab === "templates";

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Studio Hero Banner (Tampil di Overview atau saat filter belum dipersempit) */}
      {isOverview && (
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-r from-violet-500/10 via-background to-indigo-500/10 dark:from-[#0F1017] dark:via-[#0D0E14] dark:to-[#14121E] p-6 md:p-8 shadow-sm dark:shadow-[0_12px_40px_rgba(0,0,0,0.8)]">
          {/* Ambient glow background */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-violet-600/15 blur-[100px]" />
          <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-indigo-600/10 blur-[90px]" />

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-700 dark:text-violet-300">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-500 shadow-[0_0_8px_#a78bfa]" />
              <span>Workspace: {workspaceName}</span>
            </div>

            <h1 className="mt-3.5 font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Desain SOP &amp; Alur Kerja Multi-Divisi
            </h1>
            <p className="mt-2 text-xs md:text-sm leading-relaxed text-muted-foreground">
              Rancang tanggung jawab departemen, waktu siklus tugas, dan output deliverables dalam kanvas swimlane interaktif siap ekspor.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button
                variant="brand"
                onClick={() => setCreateOpen(true)}
                className="gap-2 font-semibold text-xs"
              >
                <Plus className="h-4 w-4" />
                <span>Buat Diagram Baru</span>
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleTabChange("templates")}
                className="gap-2 text-xs font-semibold"
              >
                <LayoutTemplate className="h-4 w-4 text-violet-500" />
                <span>Jelajahi Template ({TEMPLATES.length})</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Templates Section (Ditampilkan penuh di tab Templates, atau ringkas di tab Overview) */}
      {(isOverview || isTemplatesTab) && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="grid h-7 w-7 place-items-center rounded-lg bg-violet-500/10 text-violet-500 border border-violet-500/20">
                <LayoutTemplate className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-display text-sm font-semibold text-foreground tracking-tight">
                  {isTemplatesTab ? "Pustaka Template Alur Kerja & SOP Siap Pakai" : "Template Siap Pakai"}
                </h2>
                {isTemplatesTab && (
                  <p className="text-[11px] text-muted-foreground">
                    Gunakan kerangka terstandarisasi untuk mempercepat perancangan alur divisi Anda.
                  </p>
                )}
              </div>
            </div>
            {!isTemplatesTab && (
              <button
                type="button"
                onClick={() => handleTabChange("templates")}
                className="text-[11px] font-semibold text-primary hover:underline"
              >
                Lihat Semua ({TEMPLATES.length})
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TEMPLATES.map((tmpl) => (
              <div
                key={tmpl.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-md border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                      {tmpl.kind === "journey" ? "CUSTOMER JOURNEY" : "SOP STANDAR"}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {tmpl.lanes.length} Divisi
                    </span>
                  </div>

                  <h3 className="mt-2.5 font-display text-xs font-semibold text-foreground tracking-tight group-hover:text-primary transition-colors">
                    {tmpl.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground leading-relaxed">
                    {tmpl.description}
                  </p>

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
                </div>

                <div className="mt-4 pt-3 border-t border-border/60">
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={isCloning}
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
      )}

      {/* Tabs & Search Filter (Ditampilkan jika bukan halaman murni template) */}
      {!isTemplatesTab && (
        <section className="space-y-4 pt-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Segmented Pill Controls */}
            <div className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 p-1 overflow-x-auto max-w-full">
              <TabPill
                active={activeTab === "overview" || activeTab === "recent"}
                onClick={() => handleTabChange("overview")}
                label="Terbaru"
                count={flows.length}
              />
              <TabPill
                active={activeTab === "all"}
                onClick={() => handleTabChange("all")}
                label="Semua Diagram"
                count={flows.length}
              />
              <TabPill
                active={activeTab === "sop"}
                onClick={() => handleTabChange("sop")}
                label="SOP Bisnis"
                count={sopCount}
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

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/75" />
              <input
                type="text"
                placeholder="Filter diagram, SOP, atau divisi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-xl border border-border/80 dark:border-white/[0.08] bg-slate-100/70 dark:bg-[#12131F] pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground/70 focus:border-violet-500/60 focus:bg-white dark:focus:bg-[#0E0F16] focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all duration-150 shadow-sm"
              />
            </div>
          </div>

          {/* Flows Grid */}
          {filteredFlows.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredFlows.map((flow) => (
                <FlowCard
                  key={flow.id}
                  flow={flow}
                  onShareClick={(f) => setSelectedShareFlow(f)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/60 p-12 text-center shadow-sm">
              <div className="grid h-12 w-12 place-items-center rounded-2xl border border-border bg-muted/60 text-muted-foreground">
                <Workflow className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 font-display text-sm font-semibold text-foreground">
                {searchQuery
                  ? "Diagram tidak ditemukan"
                  : activeTab === "journey"
                  ? "Belum ada Customer Journey Map"
                  : activeTab === "sop"
                  ? "Belum ada diagram SOP Bisnis"
                  : "Belum ada diagram di kategori ini"}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                {searchQuery
                  ? `Tidak ada diagram yang cocok dengan kata kunci "${searchQuery}".`
                  : activeTab === "journey"
                  ? "Petakan titik interaksi pengalaman pelanggan Anda lintas departemen sekarang."
                  : activeTab === "sop"
                  ? "Mulai standarisasi tugas divisi, waktu siklus SLA, dan deliverables."
                  : "Mulai buat swimlane baru untuk memetakan proses divisi Anda."}
              </p>
              {!searchQuery && (
                <Button
                  variant="brand"
                  size="sm"
                  onClick={() => setCreateOpen(true)}
                  className="mt-4 text-xs font-semibold gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>
                    {activeTab === "journey"
                      ? "Buat Customer Journey Baru"
                      : activeTab === "sop"
                      ? "Buat SOP Bisnis Baru"
                      : "Buat Diagram Baru"}
                  </span>
                </Button>
              )}
            </div>
          )}
        </section>
      )}

      {/* Create Flow Modal */}
      <CreateFlowDialog open={createOpen} onOpenChange={setCreateOpen} />

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
        "flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-medium transition-all duration-150 shrink-0",
        active
          ? "bg-background text-foreground font-semibold shadow-sm border border-border"
          : "text-muted-foreground hover:text-foreground hover:bg-background/50",
      )}
    >
      <span>{label}</span>
      {typeof count === "number" && (
        <span
          className={cn(
            "rounded-full px-1.5 py-0.2 text-[9px] font-mono",
            active ? "bg-muted text-foreground font-bold" : "bg-muted/60 text-muted-foreground",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
