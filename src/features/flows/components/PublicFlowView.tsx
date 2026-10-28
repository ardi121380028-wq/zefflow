"use client";

import * as React from "react";
import Link from "next/link";
import {
  Download,
  Eye,
  FileDown,
  FileImage,
  Sparkles,
  Workflow,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportDiagram } from "@/features/canvas/lib/export";
import { useCanvasStore } from "@/features/canvas/store/canvas-store";
import { SwimlaneCanvas } from "@/features/canvas/SwimlaneCanvas";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import type { FlowDocument } from "@/lib/validation/flow";

interface PublicFlowViewProps {
  flowId: string;
  title: string;
  kind: string;
  description?: string | null;
  document: FlowDocument;
}

export function PublicFlowView({
  flowId,
  title,
  kind,
  description,
  document,
}: PublicFlowViewProps) {
  const [isExporting, setIsExporting] = React.useState(false);

  const handleExport = async (format: "png" | "pdf") => {
    setIsExporting(true);
    try {
      const s = useCanvasStore.getState();
      await exportDiagram(s.nodes, format, title || "flow-export", s.orientation, {
        companyLogo: s.companyLogo,
        companyName: s.companyName,
        docCode: s.docCode,
      });
      toast.success(`Berhasil mengunduh ${format.toUpperCase()}`);
    } catch (err) {
      toast.error((err as Error).message || "Gagal mengekspor diagram.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      {/* Top Read-Only Bar */}
      <header className="relative z-30 flex h-14 items-center justify-between border-b border-border/80 bg-surface/90 px-5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-gradient">
              <Workflow className="h-4 w-4 text-white" />
            </div>
            <span className="font-display text-sm font-bold tracking-tight">Zefflow</span>
          </Link>

          <span className="h-4 w-px bg-border/80" />

          <div className="flex items-center gap-2">
            <h1 className="font-display text-xs font-bold sm:text-sm">{title}</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
              <Eye className="h-3 w-3" /> Hanya-Baca
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" loading={isExporting} className="gap-1.5 text-xs">
                <Download className="h-3.5 w-3.5" />
                <span>Unduh Diagram</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => handleExport("png")}>
                <FileImage className="mr-2 h-4 w-4 text-primary" />
                <span>Format PNG</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("pdf")}>
                <FileDown className="mr-2 h-4 w-4 text-emerald-500" />
                <span>Format PDF</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="brand" size="sm" asChild className="text-xs font-semibold">
            <Link href="/login">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              Buat Diagram Serupa
            </Link>
          </Button>
        </div>
      </header>

      {/* Canvas in Read-Only Mode */}
      <main className="relative flex-1 overflow-hidden">
        <SwimlaneCanvas
          flowId={flowId}
          initialDocument={document}
          initialVersion={1}
          readOnly={true}
        />
      </main>
    </div>
  );
}
