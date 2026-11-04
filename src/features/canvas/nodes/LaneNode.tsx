"use client";

import { memo } from "react";
import { NodeResizeControl, type NodeProps } from "@xyflow/react";
import type { LucideIcon } from "lucide-react";
import {
  Boxes,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Database,
  GitBranch,
  GripHorizontal,
  GripVertical,
  Headphones,
  HeartHandshake,
  Radio,
  Receipt,
  Scale,
  Server,
  ShieldCheck,
  Split,
  Trash2,
  TrendingUp,
  User,
  UserCog,
  Users,
  Workflow,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCanvasStore } from "../store/canvas-store";
import { LANE_HEADER_WIDTH, LANE_MIN_HEIGHT, LANE_STYLES, LANE_V_HEADER_HEIGHT, LANE_V_MIN_WIDTH } from "../lib/layout";
import type { LaneNodeType } from "../types";

export function normalizeLaneTitle(rawTitle: string): string {
  const trimmed = rawTitle.trim();
  const lower = trimmed.toLowerCase();
  if (lower === "noc" || lower === "n.o.c" || lower === "n.o.c." || lower === "n o c") return "Network Operation Center";
  if (lower === "cust. service" || lower === "cust.service" || lower === "cust service") return "Customer Service";
  if (lower === "t. support" || lower === "t.support" || lower === "t support") return "Technical Support";
  if (lower === "cs & finance" || lower === "cs & fin" || lower === "cs / finance" || lower === "cs/finance") return "Customer Service & Finance";
  if (lower === "cs") return "Customer Success";
  return rawTitle;
}

/** Resolusi otomatis icon modern berdasarkan nama lane, divisi, atau icon eksplisit */
export function getLaneIcon(title?: string, division?: string, explicitIcon?: string): LucideIcon {
  const t = `${title || ""} ${division || ""} ${explicitIcon || ""}`.toLowerCase();

  // 1. Customer Service / Helpdesk
  if (t.includes("customer service") || t.includes("helpdesk") || t.includes("cs ")) return Headphones;
  // 2. Customer / Pelanggan
  if (t.includes("customer") || t.includes("pelanggan") || t.includes("klien") || t.includes("client") || t.includes("residensial")) return Users;
  // 3. Sales / Pemasaran / Penjualan
  if (t.includes("sales") || t.includes("marketing") || t.includes("pemasaran") || t.includes("penjualan") || t.includes("account executive")) return TrendingUp;
  // 4. Technical Support / Teknisi Lapangan
  if (t.includes("technical support") || t.includes("teknisi") || t.includes("field engineer") || t.includes("support")) return Wrench;
  // 5. NOC / Network Operations Center
  if (t.includes("noc") || t.includes("network operations") || t.includes("monitoring")) return Radio;
  // 6. Backbone / Splicer / Fiber Optic Cut
  if (t.includes("backbone") || t.includes("splicer") || t.includes("fo cut") || t.includes("core")) return GitBranch;
  // 7. Fishbone / Feeder / Last-Mile / LOS
  if (t.includes("fishbone") || t.includes("feeder") || t.includes("distribusi") || t.includes("last-mile") || t.includes("los")) return Split;
  // 8. Network Engineer / POP / Corporate Dedicated
  if (t.includes("network engineer") || t.includes("pop") || t.includes("router") || t.includes("switch") || t.includes("bgp")) return Server;
  // 9. Finance / Billing / Keuangan / Invoice
  if (t.includes("finance") || t.includes("keuangan") || t.includes("billing") || t.includes("invoice") || t.includes("pembayaran")) return Receipt;
  // 10. Management / Direksi / Eksekutif / Approval
  if (t.includes("management") || t.includes("direksi") || t.includes("direktur") || t.includes("manajemen") || t.includes("commercial")) return Building2;
  // 11. Warehouse / Logistik / Gudang / Perangkat
  if (t.includes("warehouse") || t.includes("logistik") || t.includes("gudang") || t.includes("perangkat") || t.includes("pengadaan")) return Boxes;
  // 12. SPV / Supervisor
  if (t.includes("spv") || t.includes("supervisor") || t.includes("lead")) return UserCog;
  // 13. HRD / Human Resources / SDM
  if (t.includes("hrd") || t.includes("human resource") || t.includes("sdm") || t.includes("cuti") || t.includes("over shift")) return HeartHandshake;
  // 14. Personal / Karyawan / Pemohon
  if (t.includes("personal") || t.includes("karyawan") || t.includes("pemohon") || t.includes("pegawai")) return User;
  // 15. Database / SQL / ERD
  if (t.includes("database") || t.includes("data") || t.includes("sql") || t.includes("table")) return Database;
  // 16. Security / Keamanan
  if (t.includes("security") || t.includes("keamanan") || t.includes("audit")) return ShieldCheck;
  // 17. Legal / Hukum / Kontrak
  if (t.includes("legal") || t.includes("hukum") || t.includes("kontrak") || t.includes("mou")) return Scale;

  return Workflow;
}

const SOLID_HEADERS: Record<string, { bg: string; dot: string; text: string }> = {
  rose: { bg: "bg-[#DC2626] text-white", dot: "bg-white", text: "text-white" },
  amber: { bg: "bg-[#EA580C] text-white", dot: "bg-white", text: "text-white" },
  violet: { bg: "bg-[#7E22CE] text-white", dot: "bg-white", text: "text-white" },
  emerald: { bg: "bg-[#0284C7] text-white", dot: "bg-white", text: "text-white" },
  sky: { bg: "bg-[#1E40AF] text-white", dot: "bg-white", text: "text-white" },
  slate: { bg: "bg-[#0F172A] text-white", dot: "bg-white", text: "text-white" },
};

/** Gaya Modern Premium Glass: gradasi lembut, frosted glass backdrop, dan aksen garis elegan */
const GLASS_LANES: Record<string, {
  bandH: string;
  bandV: string;
  headerH: string;
  headerV: string;
  dot: string;
  accentBar: string;
  text: string;
  division: string;
}> = {
  rose: {
    bandH: "bg-gradient-to-r from-rose-500/[0.08] via-rose-500/[0.025] to-transparent border-b border-rose-500/20 dark:from-rose-950/[0.22] dark:via-rose-950/[0.08] dark:to-transparent dark:border-rose-500/15",
    bandV: "bg-gradient-to-b from-rose-500/[0.08] via-rose-500/[0.025] to-transparent border-r border-rose-500/20 dark:from-rose-950/[0.22] dark:via-rose-950/[0.08] dark:to-transparent dark:border-rose-500/15",
    headerH: "bg-white/80 dark:bg-[#12141C]/80 backdrop-blur-xl border-r border-rose-500/25 dark:border-rose-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]",
    headerV: "bg-white/80 dark:bg-[#12141C]/80 backdrop-blur-xl border-b border-rose-500/25 dark:border-rose-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]",
    dot: "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.7)]",
    accentBar: "bg-gradient-to-b from-rose-500 via-rose-600 to-red-600 shadow-[0_0_12px_rgba(244,63,94,0.6)]",
    text: "text-rose-950 dark:text-rose-100",
    division: "text-rose-700/80 dark:text-rose-300/70",
  },
  amber: {
    bandH: "bg-gradient-to-r from-amber-500/[0.08] via-amber-500/[0.025] to-transparent border-b border-amber-500/20 dark:from-amber-950/[0.22] dark:via-amber-950/[0.08] dark:to-transparent dark:border-amber-500/15",
    bandV: "bg-gradient-to-b from-amber-500/[0.08] via-amber-500/[0.025] to-transparent border-r border-amber-500/20 dark:from-amber-950/[0.22] dark:via-amber-950/[0.08] dark:to-transparent dark:border-amber-500/15",
    headerH: "bg-white/80 dark:bg-[#151310]/80 backdrop-blur-xl border-r border-amber-500/25 dark:border-amber-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]",
    headerV: "bg-white/80 dark:bg-[#151310]/80 backdrop-blur-xl border-b border-amber-500/25 dark:border-amber-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]",
    dot: "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.7)]",
    accentBar: "bg-gradient-to-b from-amber-500 via-orange-500 to-amber-600 shadow-[0_0_12px_rgba(245,158,11,0.6)]",
    text: "text-amber-950 dark:text-amber-100",
    division: "text-amber-700/80 dark:text-amber-300/70",
  },
  violet: {
    bandH: "bg-gradient-to-r from-violet-500/[0.08] via-violet-500/[0.025] to-transparent border-b border-violet-500/20 dark:from-violet-950/[0.22] dark:via-violet-950/[0.08] dark:to-transparent dark:border-violet-500/15",
    bandV: "bg-gradient-to-b from-violet-500/[0.08] via-violet-500/[0.025] to-transparent border-r border-violet-500/20 dark:from-violet-950/[0.22] dark:via-violet-950/[0.08] dark:to-transparent dark:border-violet-500/15",
    headerH: "bg-white/80 dark:bg-[#13121A]/80 backdrop-blur-xl border-r border-violet-500/25 dark:border-violet-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]",
    headerV: "bg-white/80 dark:bg-[#13121A]/80 backdrop-blur-xl border-b border-violet-500/25 dark:border-violet-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]",
    dot: "bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.7)]",
    accentBar: "bg-gradient-to-b from-violet-500 via-purple-600 to-indigo-600 shadow-[0_0_12px_rgba(139,92,246,0.6)]",
    text: "text-violet-950 dark:text-violet-100",
    division: "text-violet-700/80 dark:text-violet-300/70",
  },
  emerald: {
    bandH: "bg-gradient-to-r from-emerald-500/[0.08] via-emerald-500/[0.025] to-transparent border-b border-emerald-500/20 dark:from-emerald-950/[0.22] dark:via-emerald-950/[0.08] dark:to-transparent dark:border-emerald-500/15",
    bandV: "bg-gradient-to-b from-emerald-500/[0.08] via-emerald-500/[0.025] to-transparent border-r border-emerald-500/20 dark:from-emerald-950/[0.22] dark:via-emerald-950/[0.08] dark:to-transparent dark:border-emerald-500/15",
    headerH: "bg-white/80 dark:bg-[#101714]/80 backdrop-blur-xl border-r border-emerald-500/25 dark:border-emerald-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]",
    headerV: "bg-white/80 dark:bg-[#101714]/80 backdrop-blur-xl border-b border-emerald-500/25 dark:border-emerald-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]",
    dot: "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.7)]",
    accentBar: "bg-gradient-to-b from-emerald-500 via-teal-600 to-emerald-700 shadow-[0_0_12px_rgba(16,185,129,0.6)]",
    text: "text-emerald-950 dark:text-emerald-100",
    division: "text-emerald-700/80 dark:text-emerald-300/70",
  },
  sky: {
    bandH: "bg-gradient-to-r from-sky-500/[0.08] via-sky-500/[0.025] to-transparent border-b border-sky-500/20 dark:from-sky-950/[0.22] dark:via-sky-950/[0.08] dark:to-transparent dark:border-sky-500/15",
    bandV: "bg-gradient-to-b from-sky-500/[0.08] via-sky-500/[0.025] to-transparent border-r border-sky-500/20 dark:from-sky-950/[0.22] dark:via-sky-950/[0.08] dark:to-transparent dark:border-sky-500/15",
    headerH: "bg-white/80 dark:bg-[#10141B]/80 backdrop-blur-xl border-r border-sky-500/25 dark:border-sky-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]",
    headerV: "bg-white/80 dark:bg-[#10141B]/80 backdrop-blur-xl border-b border-sky-500/25 dark:border-sky-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]",
    dot: "bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.7)]",
    accentBar: "bg-gradient-to-b from-sky-500 via-blue-600 to-cyan-600 shadow-[0_0_12px_rgba(14,165,233,0.6)]",
    text: "text-sky-950 dark:text-sky-100",
    division: "text-sky-700/80 dark:text-sky-300/70",
  },
  slate: {
    bandH: "bg-gradient-to-r from-slate-500/[0.06] via-slate-500/[0.02] to-transparent border-b border-slate-500/15 dark:from-zinc-900/[0.28] dark:via-zinc-900/[0.08] dark:to-transparent dark:border-zinc-700/15",
    bandV: "bg-gradient-to-b from-slate-500/[0.06] via-slate-500/[0.02] to-transparent border-r border-slate-500/15 dark:from-zinc-900/[0.28] dark:via-zinc-900/[0.08] dark:to-transparent dark:border-zinc-700/15",
    headerH: "bg-white/80 dark:bg-[#121316]/80 backdrop-blur-xl border-r border-slate-500/25 dark:border-zinc-700/25 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]",
    headerV: "bg-white/80 dark:bg-[#121316]/80 backdrop-blur-xl border-b border-slate-500/25 dark:border-zinc-700/25 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]",
    dot: "bg-slate-500 shadow-[0_0_10px_rgba(100,116,139,0.7)]",
    accentBar: "bg-gradient-to-b from-slate-500 via-slate-600 to-zinc-700 shadow-[0_0_12px_rgba(100,116,139,0.6)]",
    text: "text-slate-950 dark:text-zinc-100",
    division: "text-slate-600/80 dark:text-zinc-400/70",
  },
};

/**
 * Satu lane = satu divisi/departemen (Parent node di React Flow).
 * - horizontal: header di kiri, alur ke samping.
 * - vertical  : header di atas (kolom), alur ke bawah.
 */
function LaneNodeImpl({ id, data, width, height }: NodeProps<LaneNodeType>) {
  const readOnly = useCanvasStore((s) => s.readOnly);
  const selected = useCanvasStore((s) => s.selectedId === id);
  const vertical = useCanvasStore((s) => s.orientation === "vertical");
  const wallpaper = useCanvasStore((s) => s.wallpaper);
  const isSolidZitline = wallpaper === "solid-zitline";
  const laneIndex = parseInt(id.replace("lane_", ""), 10) || 0;
  const solidBand = laneIndex % 2 === 0 ? "bg-[#D6E8FA] border-b-2 border-white" : "bg-[#BDDCF8] border-b-2 border-white";
  const solidHeader = SOLID_HEADERS[data.color] ?? SOLID_HEADERS.rose!;
  const glass = GLASS_LANES[data.color] ?? GLASS_LANES.sky!;
  const select = useCanvasStore((s) => s.select);
  const { moveLane, removeLane, resizeLane } = useCanvasStore.getState();
  const displayTitle = normalizeLaneTitle(data.title || "Tanpa nama");

  const confirmRemove = () => {
    if (window.confirm(`Hapus lane "${displayTitle}" beserta semua langkah di dalamnya?`)) removeLane(id);
  };

  const LaneIcon = getLaneIcon(data.title, data.division, data.icon);

  const headerContent = (
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl transition-transform group-hover:scale-105",
            isSolidZitline
              ? "bg-white/20 text-white shadow-sm border border-white/30 backdrop-blur-md"
              : "bg-white/85 dark:bg-zinc-800/85 text-foreground shadow-sm border border-border/50 backdrop-blur-md",
          )}
        >
          <LaneIcon className={cn("h-7 w-7 stroke-[2.4]", isSolidZitline ? "text-white" : glass.text)} />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "line-clamp-3 break-words font-sans text-[36px] font-extrabold leading-[42px] tracking-tight",
              isSolidZitline ? "text-white uppercase tracking-wide drop-shadow-sm" : glass.text,
            )}
          >
            {displayTitle}
          </p>
        </div>
      </div>
    </div>
  );

  if (vertical) {
    return (
      <div
        className={cn(
          "group relative flex h-full w-full flex-col overflow-visible transition-colors",
          isSolidZitline ? (laneIndex % 2 === 0 ? "bg-[#D6E8FA] border-r-2 border-white" : "bg-[#BDDCF8] border-r-2 border-white") : glass.bandV,
        )}
        style={{ width, height }}
      >
        {/* Header kolom (atas) */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => select(id)}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && select(id)}
          className={cn(
            "pointer-events-auto relative flex shrink-0 cursor-pointer flex-col justify-center overflow-hidden px-7 pb-4 pt-6 outline-none transition-colors duration-150",
            selected && "bg-primary/10 shadow-[inset_0_0_0_2px_hsl(var(--primary))]",
            isSolidZitline ? solidHeader.bg : glass.headerV,
          )}
          style={{ height: LANE_V_HEADER_HEIGHT }}
        >
          {/* Aksen warna gradasi di sisi atas */}
          {!isSolidZitline && <div className={cn("absolute left-0 right-0 top-0 h-2.5", glass.accentBar)} />}
          {headerContent}

          {!readOnly && (
            <div
              className={cn(
                "nodrag nopan absolute right-3 top-4 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100",
                selected && "opacity-100",
              )}
            >
              <LaneBtn label="Geser lane ke kiri" onClick={() => moveLane(id, -1)}>
                <ChevronLeft className="h-4 w-4" />
              </LaneBtn>
              <LaneBtn label="Geser lane ke kanan" onClick={() => moveLane(id, 1)}>
                <ChevronRight className="h-4 w-4" />
              </LaneBtn>
              <LaneBtn label="Hapus lane" onClick={confirmRemove} danger>
                <Trash2 className="h-4 w-4" />
              </LaneBtn>
            </div>
          )}
        </div>

        {/* Handle resize lebar kolom */}
        {!readOnly && selected && (
          <NodeResizeControl
            position="top-right"
            resizeDirection="horizontal"
            minWidth={LANE_V_MIN_WIDTH}
            onResizeEnd={(_, p) => resizeLane(id, p.width)}
            className="pointer-events-auto !border-0 !bg-transparent"
          >
            <div className="absolute left-0 top-[88px] -translate-x-1/2 -translate-y-1/2 cursor-ew-resize rounded-full border border-border bg-card px-1 py-2.5 shadow-lg">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
          </NodeResizeControl>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group relative flex h-full w-full overflow-visible transition-colors",
        isSolidZitline ? solidBand : glass.bandH,
      )}
      style={{ width, height }}
    >
      {/* Header lane (kiri) */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => select(id)}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && select(id)}
        className={cn(
          "pointer-events-auto relative flex shrink-0 cursor-pointer flex-col justify-between overflow-hidden py-6 pl-7 pr-5 outline-none transition-colors duration-150",
          selected && "bg-primary/10 shadow-[inset_0_0_0_2px_hsl(var(--primary))]",
          isSolidZitline ? solidHeader.bg : glass.headerH,
        )}
        style={{ width: LANE_HEADER_WIDTH }}
      >
        {/* Aksen warna gradasi di sisi kiri */}
        {!isSolidZitline && <div className={cn("absolute bottom-0 left-0 top-0 w-2.5", glass.accentBar)} />}
        {headerContent}

        {!readOnly && (
          <div className={cn("nodrag nopan flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100", selected && "opacity-100")}>
            <LaneBtn label="Naikkan lane" onClick={() => moveLane(id, -1)}>
              <ChevronUp className="h-4 w-4" />
            </LaneBtn>
            <LaneBtn label="Turunkan lane" onClick={() => moveLane(id, 1)}>
              <ChevronDown className="h-4 w-4" />
            </LaneBtn>
            <LaneBtn label="Hapus lane" onClick={confirmRemove} danger>
              <Trash2 className="h-4 w-4" />
            </LaneBtn>
          </div>
        )}
      </div>

      {/* Handle resize tinggi lane */}
      {!readOnly && selected && (
        <NodeResizeControl
          position="bottom-left"
          resizeDirection="vertical"
          minHeight={LANE_MIN_HEIGHT}
          onResizeEnd={(_, p) => resizeLane(id, p.height)}
          className="pointer-events-auto !border-0 !bg-transparent"
        >
          <div className="absolute left-[190px] top-0 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize rounded-full border border-border bg-card px-2.5 py-1 shadow-lg">
            <GripHorizontal className="h-4 w-4 text-muted-foreground" />
          </div>
        </NodeResizeControl>
      )}
    </div>
  );
}

function LaneBtn({ children, label, onClick, danger }: { children: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "grid h-8 w-8 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        danger && "hover:bg-rose-500/10 hover:text-rose-500",
      )}
    >
      {children}
    </button>
  );
}

export const LaneNode = memo(LaneNodeImpl);
