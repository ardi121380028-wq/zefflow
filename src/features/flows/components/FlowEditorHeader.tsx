"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Download,
  FileDown,
  FileImage,
  Globe2,
  Image as ImageIcon,
  Loader2,
  PanelLeft,
  Redo2,
  Save,
  Share2,
  Undo2,
  UserPlus,
  Users,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportDiagram } from "@/features/canvas/lib/export";
import { useCanvasStore } from "@/features/canvas/store/canvas-store";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { updateFlowMetaAction } from "../actions";
import { ShareDialog } from "./ShareDialog";
import { SqlExportModal } from "./SqlExportModal";

interface FlowEditorHeaderProps {
  flowId: string;
  initialTitle: string;
  kind: "sop" | "journey";
  initialShareEnabled: boolean;
  initialShareToken?: string | null;
  onManualSave?: () => Promise<void>;
}

export function FlowEditorHeader({
  flowId,
  initialTitle,
  kind,
  initialShareEnabled,
  initialShareToken,
  onManualSave,
}: FlowEditorHeaderProps) {
  const [title, setTitle] = React.useState(initialTitle);
  const [isEditingTitle, setIsEditingTitle] = React.useState(false);
  const [shareOpen, setShareOpen] = React.useState(false);
  const [shareEnabled, setShareEnabled] = React.useState(initialShareEnabled);
  const [shareToken, setShareToken] = React.useState(initialShareToken);
  const [isExporting, setIsExporting] = React.useState(false);
  const [sqlExportOpen, setSqlExportOpen] = React.useState(false);

  const saveStatus = useCanvasStore((s) => s.saveStatus);
  const canUndo = useCanvasStore((s) => s.past.length > 0);
  const canRedo = useCanvasStore((s) => s.future.length > 0);
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const orientation = useCanvasStore((s) => s.orientation);
  const companyLogo = useCanvasStore((s) => s.companyLogo);
  const companyName = useCanvasStore((s) => s.companyName);
  const docCode = useCanvasStore((s) => s.docCode);
  const sidebarOpen = useCanvasStore((s) => s.sidebarOpen);
  const toggleSidebar = useCanvasStore((s) => s.toggleSidebar);
  const { undo, redo } = useCanvasStore.getState();

  const handleTitleSubmit = async () => {
    setIsEditingTitle(false);
    const trimmed = title.trim();
    if (!trimmed || trimmed === initialTitle) return;

    try {
      const res = await updateFlowMetaAction({ flowId, title: trimmed });
      if (res.ok) {
        toast.success("Judul diagram diperbarui");
      } else {
        toast.error(res.error.message);
      }
    } catch {
      toast.error("Gagal memperbarui judul.");
    }
  };

  const handleExport = async (format: "png" | "pdf") => {
    setIsExporting(true);
    try {
      await exportDiagram(nodes, format, title || "flow-zefflow", orientation, {
        companyLogo,
        companyName,
        docCode,
      });
      toast.success(`Berhasil mengekspor sebagai ${format.toUpperCase()}`);
    } catch (err) {
      toast.error((err as Error).message || "Gagal mengekspor diagram.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <header className="relative z-30 flex h-14 w-full items-center justify-between border-b border-border bg-card/95 px-3 sm:px-4 backdrop-blur-2xl">
        {/* Left: Back & Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link
            href="/dashboard"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-border bg-muted/60 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Kembali ke Dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <button
            type="button"
            onClick={toggleSidebar}
            title={sidebarOpen ? "Sembunyikan panel samping (Ctrl+B)" : "Tampilkan panel samping (Ctrl+B)"}
            className={cn(
              "hidden sm:grid h-8 w-8 shrink-0 place-items-center rounded-xl border transition-colors",
              sidebarOpen
                ? "border-primary/40 bg-primary/10 text-primary shadow-sm"
                : "border-border bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <PanelLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            {isEditingTitle ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleTitleSubmit();
                  if (e.key === "Escape") {
                    setTitle(initialTitle);
                    setIsEditingTitle(false);
                  }
                }}
                autoFocus
                className="h-8 max-w-[200px] sm:max-w-[280px] rounded-lg border border-primary/50 bg-background px-2.5 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            ) : (
              <button
                onClick={() => setIsEditingTitle(true)}
                className="group flex items-center gap-1.5 sm:gap-2 truncate rounded-lg px-2 py-1 text-left font-display text-xs sm:text-sm font-bold text-foreground hover:bg-muted/60"
                title="Klik untuk mengubah nama"
              >
                <span className="truncate max-w-[140px] sm:max-w-[240px] md:max-w-none">{title}</span>
                <span className="text-[9px] font-mono uppercase text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hidden sm:inline">
                  UBAH
                </span>
              </button>
            )}

            <span className="hidden rounded-md border border-border bg-muted/80 px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground sm:inline-block">
              {kind === "journey" ? "CUSTOMER JOURNEY" : "SOP"}
            </span>
          </div>
        </div>

        {/* Center: Autosave Status Indicator */}
        <div className="hidden items-center gap-2 text-xs lg:flex">
          {saveStatus === "saving" && (
            <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              <span>Menyimpan ke cloud...</span>
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="flex items-center gap-1.5 text-emerald-500 text-xs font-mono">
              <Check className="h-3.5 w-3.5" />
              <span>TERSIMPAN</span>
            </span>
          )}
          {saveStatus === "dirty" && (
            <span className="flex items-center gap-1.5 text-amber-500 text-xs">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_6px_#fbbf24]" />
              <span>Perubahan belum disimpan</span>
            </span>
          )}
          {saveStatus === "error" && (
            <span className="flex items-center gap-1.5 text-rose-500 text-xs">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              <span>Gagal menyimpan</span>
            </span>
          )}
        </div>

        {/* Right: Actions (Undo/Redo, Theme, Export, Share, Manual Save) */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            type="button"
            disabled={!canUndo}
            onClick={undo}
            title="Undo (Ctrl+Z)"
            className="hidden sm:grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-20"
          >
            <Undo2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            disabled={!canRedo}
            onClick={redo}
            title="Redo (Ctrl+Shift+Z)"
            className="hidden sm:grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-20"
          >
            <Redo2 className="h-3.5 w-3.5" />
          </button>

          <span className="hidden sm:inline-block mx-0.5 h-4 w-px bg-border" />

          {/* Theme Toggle (Light / Dark mode) */}
          <ThemeToggle />

          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                loading={isExporting}
                className="gap-1 sm:gap-1.5 text-xs h-8 px-2 sm:px-3 dark:border-white/15 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] dark:hover:border-violet-500/40 dark:shadow-[0_0_12px_rgba(139,92,246,0.15)] transition-all"
              >
                <Download className="h-3.5 w-3.5 text-violet-500" />
                <span className="font-semibold text-xs">Ekspor</span>
                <ChevronDown className="h-3 w-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 border-border bg-card text-foreground">
              <DropdownMenuItem onClick={() => handleExport("png")} className="text-xs py-2">
                <FileImage className="mr-2 h-4 w-4 text-violet-500" />
                <div className="flex flex-col">
                  <span className="font-medium">Gambar PNG (4K Sharp)</span>
                  <span className="text-[10px] text-muted-foreground">High resolution, crisp legible text</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("pdf")} className="text-xs py-2">
                <FileDown className="mr-2 h-4 w-4 text-emerald-500" />
                <div className="flex flex-col">
                  <span className="font-medium">Dokumen PDF (Vector Quality)</span>
                  <span className="text-[10px] text-muted-foreground">Anti-pelangi, full diagram included</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSqlExportOpen(true)} className="text-xs py-2">
                <Database className="mr-2 h-4 w-4 text-sky-500" />
                <div className="flex flex-col">
                  <span className="font-medium">Skrip SQL DDL (Database ERD)</span>
                  <span className="text-[10px] text-muted-foreground">Postgres, MySQL, &amp; Prisma Schema</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Active Collaborators Presence Bubble (Figma-Style Multiplayer) */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setShareOpen(true)}
            title="3 anggota tim terdaftar. Klik untuk mengundang rekan kerja"
            className="hidden lg:flex items-center -space-x-1.5 cursor-pointer hover:opacity-90 transition-opacity px-1"
          >
            <div className="relative grid h-7 w-7 place-items-center rounded-full bg-violet-600 text-white font-bold text-[10px] ring-2 ring-card shadow-xs">
              AD
              <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-card" />
            </div>
            <div className="relative grid h-7 w-7 place-items-center rounded-full bg-emerald-600 text-white font-bold text-[10px] ring-2 ring-card shadow-xs">
              SL
              <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-card" />
            </div>
            <div className="grid h-7 w-7 place-items-center rounded-full bg-muted border border-border text-[9px] font-mono font-bold text-muted-foreground ring-2 ring-card">
              +1
            </div>
          </div>

          {/* Invite Collaborator / Share Button */}
          <Button
            variant="brand"
            size="sm"
            onClick={() => setShareOpen(true)}
            className="gap-1 sm:gap-1.5 text-xs h-8 px-2.5 sm:px-3 font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-[0_0_14px_rgba(139,92,246,0.35)] transition-all"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span className="hidden xs:inline">Undang</span>
          </Button>

          {/* Manual Save Button - Glossy Glowing Modern AI button */}
          {onManualSave && (
            <Button
              variant="brand"
              size="sm"
              onClick={onManualSave}
              className="gap-1 sm:gap-1.5 text-xs font-semibold h-8 px-2.5 sm:px-3.5"
            >
              <Save className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Simpan</span>
            </Button>
          )}
        </div>
      </header>

      {/* Share Modal Dialog */}
      <ShareDialog
        flowId={flowId}
        flowTitle={title}
        initialShareEnabled={shareEnabled}
        initialShareToken={shareToken}
        open={shareOpen}
        onOpenChange={setShareOpen}
        onShareUpdated={(enabled, token) => {
          setShareEnabled(enabled);
          if (token) setShareToken(token);
        }}
      />

      {/* Developer SQL DDL Exporter Modal */}
      <SqlExportModal
        open={sqlExportOpen}
        onOpenChange={setSqlExportOpen}
        nodes={nodes}
        edges={edges}
        flowTitle={title}
      />
    </>
  );
}
