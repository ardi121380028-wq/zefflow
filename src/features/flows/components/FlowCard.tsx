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
    <div className="card-premium group relative flex flex-col justify-between overflow-hidden p-5 hover:border-primary/50">
      <div>
        {/* Top Badges & Kind Indicator */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "grid h-8 w-8 place-items-center rounded-xl border",
                isArchitect
                  ? "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400"
                  : isJourney
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400",
              )}
            >
              {isArchitect ? (
                <Database className="h-4 w-4" />
              ) : isJourney ? (
                <Compass className="h-4 w-4" />
              ) : (
                <Workflow className="h-4 w-4" />
              )}
            </span>
            <span
              className={cn(
                "rounded-md border px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider",
                isArchitect
                  ? "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300"
                  : isJourney
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                  : "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",
              )}
            >
              {isArchitect ? "ARCHITECT STUDIO" : isJourney ? "CUSTOMER JOURNEY" : "SOP FLOW"}
            </span>
          </div>

          {/* Action Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground opacity-60 transition-opacity hover:bg-muted hover:text-foreground hover:opacity-100 group-hover:opacity-100"
                aria-label="Opsi diagram"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 border-border bg-card text-foreground">
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
        <Link href={`/flows/${flow.id}`} className="mt-4 block group-hover:text-primary">
          <h3 className="line-clamp-1 font-display text-[15px] font-bold text-foreground transition-colors group-hover:text-primary">
            {flow.title}
          </h3>
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {flow.description || "Diagram swimlane interaktif dengan pemisahan tugas antar divisi."}
          </p>
        </Link>
      </div>

      {/* Footer Info: Status, Share indicator, timeAgo */}
      <div className="mt-6 flex items-center justify-between border-t border-border pt-3 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-2">
          {flow.shareEnabled ? (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#34d399]" />
              Publik
            </span>
          ) : (
            <span className="flex items-center gap-1 text-zinc-500">
              <Lock className="h-3 w-3" /> Privat
            </span>
          )}
          <span className="h-1 w-1 rounded-full bg-zinc-700" />
          <span className="capitalize text-zinc-400">{flow.status}</span>
        </div>
        <span title={new Date(flow.updatedAt).toLocaleString("id")} className="font-mono text-[10px] text-zinc-500">
          {timeAgo(flow.updatedAt)}
        </span>
      </div>
    </div>
  );
}
