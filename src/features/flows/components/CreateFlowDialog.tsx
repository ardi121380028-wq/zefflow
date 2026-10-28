"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Compass,
  Database,
  FileSpreadsheet,
  FolderPlus,
  LayoutTemplate,
  Loader2,
  Sparkles,
  Workflow,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input, Label } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { createFlowAction } from "../actions";
import { TEMPLATES, type FlowTemplate } from "../templates";

interface CreateFlowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateFlowDialog({ open, onOpenChange }: CreateFlowDialogProps) {
  const router = useRouter();
  const [tab, setTab] = React.useState<"blank" | "templates">("blank");
  const [title, setTitle] = React.useState("");
  const [kind, setKind] = React.useState<"sop" | "journey" | "architect">("sop");
  const [isLoading, setIsLoading] = React.useState(false);

  const handleCreateBlank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Judul alur kerja wajib diisi");
      return;
    }

    setIsLoading(true);
    try {
      const res = await createFlowAction({ title: title.trim(), kind });
      if (res.ok) {
        toast.success("Diagram berhasil dibuat");
        onOpenChange(false);
        router.push(`/flows/${res.data.id}`);
      } else {
        toast.error(res.error.message);
      }
    } catch {
      toast.error("Terjadi kesalahan saat membuat diagram.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTemplate = async (template: FlowTemplate) => {
    setIsLoading(true);
    try {
      const res = await createFlowAction({ templateId: template.id });
      if (res.ok) {
        toast.success(`Template "${template.title}" berhasil dimuat`);
        onOpenChange(false);
        router.push(`/flows/${res.data.id}`);
      } else {
        toast.error(res.error.message);
      }
    } catch {
      toast.error("Gagal memuat template alur kerja.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogTitle>Buat Diagram Swimlane Baru</DialogTitle>
        <DialogDescription>
          Rancang Standard Operating Procedure (SOP) atau alur perjalanan pelanggan lintas divisi.
        </DialogDescription>

        {/* Tab Selection */}
        <div className="mt-4 flex gap-1 rounded-2xl border border-border bg-muted/40 p-1">
          <button
            type="button"
            onClick={() => setTab("blank")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold transition-all",
              tab === "blank"
                ? "bg-card text-foreground shadow-sm border border-border/80"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <FolderPlus className="h-3.5 w-3.5 text-violet-500" /> Alur Kosong
          </button>
          <button
            type="button"
            onClick={() => setTab("templates")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold transition-all",
              tab === "templates"
                ? "bg-card text-foreground shadow-sm border border-border/80"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <LayoutTemplate className="h-3.5 w-3.5 text-sky-500" /> Pilih Template ({TEMPLATES.length})
          </button>
        </div>

        {tab === "blank" ? (
          <form onSubmit={handleCreateBlank} className="mt-5 space-y-4">
            <div>
              <Label>Nama Alur / SOP</Label>
              <Input
                placeholder="mis. SOP Pengajuan Cuti Karyawan"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                autoFocus
              />
            </div>

            <div>
              <Label>Pilih Tipe Studio &amp; Diagram</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-1.5">
                <button
                  type="button"
                  onClick={() => setKind("sop")}
                  className={cn(
                    "flex flex-col items-start rounded-2xl border p-3 text-left transition-all duration-200",
                    kind === "sop"
                      ? "border-violet-500 bg-violet-500/10 dark:bg-violet-500/15 shadow-[0_0_20px_rgba(139,92,246,0.15)] ring-1 ring-violet-500"
                      : "border-border dark:border-white/[0.08] bg-card dark:bg-[#12141F] hover:border-violet-500/40",
                  )}
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500 mb-1">
                    <Workflow className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-foreground">SOP Bisnis</span>
                  <span className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                    Swimlane bertingkat departemen &amp; PIC
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setKind("journey")}
                  className={cn(
                    "flex flex-col items-start rounded-2xl border p-3 text-left transition-all duration-200",
                    kind === "journey"
                      ? "border-amber-500 bg-amber-500/10 dark:bg-amber-500/15 shadow-[0_0_20px_rgba(245,158,11,0.15)] ring-1 ring-amber-500"
                      : "border-border dark:border-white/[0.08] bg-card dark:bg-[#12141F] hover:border-amber-500/40",
                  )}
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 mb-1">
                    <Compass className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-foreground">Customer Journey</span>
                  <span className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                    Titik sentuh &amp; pengalaman pengguna
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setKind("architect")}
                  className={cn(
                    "flex flex-col items-start rounded-2xl border p-3 text-left transition-all duration-200",
                    kind === "architect"
                      ? "border-sky-500 bg-sky-500/10 dark:bg-sky-500/15 shadow-[0_0_20px_rgba(14,165,233,0.15)] ring-1 ring-sky-500"
                      : "border-border dark:border-white/[0.08] bg-card dark:bg-[#12141F] hover:border-sky-500/40",
                  )}
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10 text-sky-500 mb-1">
                    <Database className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-foreground">Studio 2: Architect</span>
                  <span className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                    ERD Database, Microservice, &amp; Cloud Draw.io
                  </span>
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border mt-6">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Batal
              </Button>
              <Button type="submit" variant="default" loading={isLoading}>
                Mulai Mendesain
              </Button>
            </div>
          </form>
        ) : (
          <div className="mt-5 space-y-3">
            <p className="text-xs text-muted-foreground">
              Pilih template siap pakai untuk mempercepat penyusunan proses organisasi Anda:
            </p>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  disabled={isLoading}
                  onClick={() => handleSelectTemplate(tmpl)}
                  className="card-premium flex flex-col justify-between rounded-2xl border border-border dark:border-white/[0.08] bg-card dark:bg-[#12141F] p-4 text-left hover:border-violet-500/50 shadow-sm transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded-md border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider text-violet-600 dark:text-violet-300">
                        {tmpl.kind === "journey" ? "CUSTOMER JOURNEY" : "SOP STANDAR"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {tmpl.lanes.length} Divisi
                      </span>
                    </div>
                    <h4 className="mt-2.5 font-display text-xs font-bold text-foreground">
                      {tmpl.title}
                    </h4>
                    <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                      {tmpl.description}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-violet-600 dark:text-violet-400">
                    <Sparkles className="h-3 w-3" /> Gunakan template ini
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
