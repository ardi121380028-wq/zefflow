"use client";

import * as React from "react";
import { Boxes, Building2, Layers, ListOrdered } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCanvasStore, type SidebarTab } from "../store/canvas-store";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Rail Icon Vertikal Sisi Kiri (Figma-Style Tool Rail)
 * - Ikon disusun ke bawah secara elegan dan minimalis.
 * - Tidak membuka panel secara default agar kanvas leluasa dan bersih.
 * - Mengklik ikon membuka flyout drawer yang sesuai di sebelahnya.
 * - Mengklik ikon yang sedang aktif akan menutup panel.
 */
export function StudioSidebarRail() {
  const sidebarOpen = useCanvasStore((s) => s.sidebarOpen);
  const activeSidebarTab = useCanvasStore((s) => s.activeSidebarTab);
  const toggleSidebarTab = useCanvasStore((s) => s.toggleSidebarTab);
  const stepCount = useCanvasStore((s) => s.stepCount);
  const hasBranding = useCanvasStore((s) => Boolean(s.companyLogo || s.companyName));

  const items: {
    id: NonNullable<SidebarTab>;
    label: string;
    icon: React.ReactNode;
    badge?: string | number;
    indicator?: boolean;
  }[] = [
    {
      id: "layers",
      label: "Struktur & Layers",
      icon: <Layers className="h-4 w-4" />,
      badge: stepCount > 0 ? stepCount : undefined,
    },
    {
      id: "outline",
      label: "Ringkasan SOP & Durasi",
      icon: <ListOrdered className="h-4 w-4" />,
    },
    {
      id: "branding",
      label: "Kop Surat & Logo Perusahaan",
      icon: <Building2 className="h-4 w-4" />,
      indicator: hasBranding,
    },
    {
      id: "assets",
      label: "Katalog Bentuk BPMN",
      icon: <Boxes className="h-4 w-4" />,
    },
  ];

  return (
    <aside
      aria-label="Sidebar Rail Studio"
      className="absolute left-2.5 sm:left-4 top-3 sm:top-4 z-30 flex flex-col items-center gap-1.5 rounded-2xl border border-border/80 dark:border-white/[0.08] bg-white dark:bg-[#0E0F16] p-1.5 shadow-xl"
    >
      <TooltipProvider delayDuration={150}>
        {items.map((item) => {
          const isActive = sidebarOpen && activeSidebarTab === item.id;
          return (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => toggleSidebarTab(item.id)}
                  aria-pressed={isActive}
                  className={cn(
                    "relative grid h-9 w-9 place-items-center rounded-xl transition-all duration-200 active:scale-95",
                    isActive
                      ? "bg-violet-600 text-white shadow-[0_0_14px_rgba(139,92,246,0.5),inset_0_1px_1px_rgba(255,255,255,0.35)]"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground dark:hover:text-white dark:hover:bg-white/[0.06]",
                  )}
                >
                  {item.icon}

                  {/* Badge counter angka (misal jumlah step) */}
                  {item.badge !== undefined && (
                    <span
                      className={cn(
                        "absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 font-mono text-[9px] font-bold",
                        isActive
                          ? "bg-white text-violet-700 shadow-sm"
                          : "bg-muted-foreground/20 text-muted-foreground dark:bg-white/[0.12] dark:text-zinc-200",
                      )}
                    >
                      {item.badge}
                    </span>
                  )}

                  {/* Dot indicator (misal logo aktif) */}
                  {item.indicator && item.badge === undefined && (
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={10} className="text-xs font-medium">
                {item.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </TooltipProvider>
    </aside>
  );
}
