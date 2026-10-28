"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Compass,
  Database,
  FileCheck2,
  GitBranch,
  Globe2,
  Lock,
  MoreVertical,
  Pencil,
  Share2,
  Trash2,
  Workflow,
} from "lucide-react";
import { toast } from "sonner";
import { cn, timeAgo } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteFlowAction } from "../actions";
import type { FlowCardData } from "../queries";

interface FlowCardProps {
  flow: FlowCardData;
  onShareClick?: (flow: FlowCardData) => void;
}

export function FlowCard({ flow, onShareClick }: FlowCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Hapus diagram "${flow.title}" secara permanen?`)) return;

    setIsDeleting(true);
    try {
      const res = await deleteFlowAction(flow.id);
      if (res.ok) {
        toast.success("Diagram berhasil dihapus");
        router.refresh();
      } else {
        toast.error(res.error.message);
      }
    } catch {
      toast.error("Gagal menghapus diagram.");
    } finally {
      setIsDeleting(false);
    }
  };

  const isArchitect = flow.kind === "architect";
  const isJourney = flow.kind === "journey";

  return (
    <div className="card-premium group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border/80 dark:border-white/[0.08] bg-card p-3.5 sm:p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
      <div>
        {/* Top Badges & Kind Indicator */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "grid h-6 w-6 place-items-center rounded-lg border",
                isArchitect
                  ? "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400"
                  : isJourney
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400",
              )}
            >
              {isArchitect ? (
                <Database className="h-3.5 w-3.5" />
              ) : isJourney ? (
                <Compass className="h-3.5 w-3.5" />
              ) : (
                <Workflow className="h-3.5 w-3.5" />
              )}
            </span>
            <span
              className={cn(
                "rounded-md border px-1.5 py-0.2 font-mono text-[9px] font-bold uppercase tracking-wider",
                isArchitect
                  ? "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300"
                  : isJourney
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                  : "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",
              )}
            >
              {isArchitect ? "ARCHITECT" : isJourney ? "JOURNEY" : "SOP FLOW"}
            </span>
          </div>

          {/* Action Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground opacity-60 transition-opacity hover:bg-muted hover:text-foreground hover:opacity-100 group-hover:opacity-100"
                aria-label="Opsi diagram"
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 border-border bg-card text-foreground">
              <DropdownMenuItem onClick={() => router.push(`/flows/${flow.id}`)} className="text-xs">
                <Pencil className="mr-2 h-3.5 w-3.5" /> Buka Editor
              </DropdownMenuItem>
              {onShareClick && (
                <DropdownMenuItem onClick={() => onShareClick(flow)} className="text-xs">
                  <Share2 className="mr-2 h-3.5 w-3.5" /> Bagikan Link
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem
                destructive
                disabled={isDeleting}
                onClick={handleDelete}
                className="text-xs text-rose-500 focus:bg-rose-500/10 focus:text-rose-600"
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" /> Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Title & Description */}
        <Link href={`/flows/${flow.id}`} prefetch={true} className="mt-2.5 block group-hover:text-primary">
          <h3 className="line-clamp-1 font-display text-sm font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
            {flow.title}
          </h3>
          <p className="mt-1 line-clamp-1 text-[11px] leading-relaxed text-muted-foreground">
            {flow.description || "Diagram swimlane interaktif dengan pemisahan tugas antar divisi."}
          </p>
        </Link>
      </div>

      {/* Footer Info: Status, Share indicator, timeAgo */}
      <div className="mt-3.5 flex items-center justify-between border-t border-border/70 pt-2.5 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-2">
          {flow.shareEnabled ? (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#34d399]" />
              Publik
            </span>
          ) : (
            <span className="flex items-center gap-1 text-muted-foreground/80">
              <Lock className="h-2.5 w-2.5" /> Privat
            </span>
          )}
          <span className="h-0.5 w-0.5 rounded-full bg-muted-foreground/40" />
          <span className="capitalize">{flow.status}</span>
        </div>
        <span title={new Date(flow.updatedAt).toLocaleString("id")} className="font-mono text-[9px] text-muted-foreground">
          {timeAgo(flow.updatedAt)}
        </span>
      </div>
    </div>
  );
}
