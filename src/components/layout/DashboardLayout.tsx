"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Bell,
  ChevronDown,
  Compass,
  Database,
  FileSpreadsheet,
  FolderGit2,
  HelpCircle,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  Sparkles,
  Users2,
  Workflow,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutAction, switchWorkspaceAction } from "@/features/flows/actions";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import type { WorkspaceContext } from "@/server/auth/session";
import { CreateWorkspaceModal } from "./CreateWorkspaceModal";
import { TeamManagementModal } from "./TeamManagementModal";
import { CreateFlowDialog } from "@/features/flows/components/CreateFlowDialog";

interface DashboardLayoutProps {
  children: React.ReactNode;
  workspaceCtx: WorkspaceContext;
  onOpenCreateFlow?: () => void;
}

export function DashboardLayout({ children, workspaceCtx, onOpenCreateFlow }: DashboardLayoutProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "overview";
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [createWsOpen, setCreateWsOpen] = React.useState(false);
  const [teamModalOpen, setTeamModalOpen] = React.useState(false);
  const [createFlowOpen, setCreateFlowOpen] = React.useState(false);
  const [createFlowKind, setCreateFlowKind] = React.useState<"sop" | "journey" | "architect">("sop");
  const [isPending, startTransition] = React.useTransition();

  const handleOpenFlowModal = (k: "sop" | "journey" | "architect" = "sop") => {
    if (onOpenCreateFlow) {
      onOpenCreateFlow();
    } else {
      setCreateFlowKind(k);
      setCreateFlowOpen(true);
    }
  };

  const { active, workspaces, profile } = workspaceCtx;

  const navItems = [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard, tab: "overview" },
    { label: "Semua Diagram", href: "/dashboard?tab=all", icon: Workflow, tab: "all" },
    { label: "Customer Journey", href: "/dashboard?tab=journey", icon: Compass, tab: "journey" },
    { label: "SOP Bisnis", href: "/dashboard?tab=sop", icon: FolderGit2, tab: "sop" },
    { label: "Studio 2: Architect", href: "/dashboard?tab=architect", icon: Database, tab: "architect", badge: "Studio 2" },
    { label: "Templates Library", href: "/dashboard?tab=templates", icon: LayoutTemplate, tab: "templates" },
  ];

  const handleWorkspaceChange = (id: string) => {
    startTransition(async () => {
      await switchWorkspaceAction(id);
    });
  };

  return (
    <div className="relative flex min-h-screen w-full bg-background text-foreground font-sans antialiased selection:bg-violet-600/30 selection:text-white">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-md lg:hidden"
        />
      )}

      {/* ElevenLabs Style Sleek Left Sidebar — Sticky pinned on desktop */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card dark:bg-[#0C0D12] transition-transform duration-300 ease-spring lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:translate-x-0",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-border/80 px-5">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-indigo-600 to-fuchsia-600 shadow-[0_0_18px_rgba(139,92,246,0.5)] transition-transform group-hover:scale-105">
              <Workflow className="h-4.5 w-4.5 text-white" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-display text-base font-bold tracking-tight text-foreground">
                Zefflow
              </span>
              <span className="rounded-md border border-violet-500/30 bg-violet-500/10 px-1.5 py-0.2 text-[9px] font-mono font-bold tracking-widest text-violet-600 dark:text-violet-400">
                STUDIO
              </span>
            </div>
          </Link>

          <button
            onClick={() => setMobileMenuOpen(false)}
            className="grid h-8 w-8 place-items-center rounded-lg text-zinc-400 hover:bg-zinc-800 lg:hidden"
            aria-label="Tutup menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Workspace Switcher */}
        <div className="p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="group flex w-full items-center justify-between rounded-xl border border-border bg-muted/40 px-3 py-2 text-left transition-all duration-200 hover:border-primary/30 hover:bg-muted"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-700 font-mono text-[11px] font-bold text-white shadow-sm">
                    {active.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-foreground">
                      {active.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground capitalize">
                      {active.plan} tier • {active.role}
                    </p>
                  </div>
                </div>
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:text-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 border-border bg-card text-foreground shadow-2xl rounded-2xl p-1.5 backdrop-blur-xl" align="start">
              <DropdownMenuLabel className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground px-2 py-1">
                Workspace Terdaftar
              </DropdownMenuLabel>
              <div className="max-h-48 overflow-y-auto no-scrollbar space-y-0.5">
                {workspaces.map((ws) => (
                  <DropdownMenuItem
                    key={ws.id}
                    onClick={() => handleWorkspaceChange(ws.id)}
                    className={cn(
                      "flex items-center justify-between py-2 px-2.5 rounded-xl text-xs cursor-pointer focus:bg-muted/80",
                      ws.id === active.id && "bg-primary/10 text-primary font-semibold",
                    )}
                  >
                    <span className="truncate font-medium">{ws.name}</span>
                    <span className="rounded-md bg-muted px-1.5 py-0.5 text-[9px] font-mono uppercase text-muted-foreground">
                      {ws.role}
                    </span>
                  </DropdownMenuItem>
                ))}
              </div>
              <DropdownMenuSeparator className="bg-border my-1" />
              <DropdownMenuItem
                onClick={() => setCreateWsOpen(true)}
                className="flex items-center gap-2 py-2 px-2.5 rounded-xl text-xs font-semibold text-primary cursor-pointer hover:bg-primary/10 focus:bg-primary/10"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Buat Workspace Baru</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTeamModalOpen(true)}
                className="flex items-center gap-2 py-2 px-2.5 rounded-xl text-xs cursor-pointer focus:bg-muted/80 text-foreground"
              >
                <Users2 className="h-3.5 w-3.5 text-violet-500" />
                <span>Kelola Tim (Multi-User)</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Primary Navigation */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-1">
          <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Studio
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isOverview = !searchParams.get("tab") || searchParams.get("tab") === "overview";
            const isActive =
              item.tab === "overview"
                ? pathname === "/dashboard" && isOverview
                : pathname === "/dashboard" && currentTab === item.tab;
            return (
              <Link
                key={item.label}
                href={item.href}
                prefetch={true}
                className={cn(
                  "flex items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition-all duration-150",
                  isActive
                    ? "bg-primary/10 text-primary font-semibold shadow-sm border border-primary/20"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="rounded-md border border-sky-500/30 bg-sky-500/10 px-1.5 py-0.5 text-[9px] font-mono font-bold tracking-wider text-sky-600 dark:text-sky-400">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="pt-4">
            <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Dokumentasi & Integrasi
            </p>
            <Link
              href="/api-docs"
              prefetch={true}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition-all duration-150",
                pathname === "/api-docs"
                  ? "bg-primary/10 text-primary font-semibold shadow-sm border border-primary/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <FileSpreadsheet className={cn("h-4 w-4 shrink-0", pathname === "/api-docs" ? "text-primary" : "text-muted-foreground")} />
              <span>Dokumentasi API</span>
            </Link>
            <Link
              href="/settings"
              prefetch={true}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition-all duration-150",
                pathname === "/settings"
                  ? "bg-primary/10 text-primary font-semibold shadow-sm border border-primary/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Settings className={cn("h-4 w-4 shrink-0", pathname === "/settings" ? "text-primary" : "text-muted-foreground")} />
              <span>Pengaturan Akun</span>
            </Link>
          </div>
        </nav>

        {/* Workspace Tier Info Card */}
        <div className="p-3">
          <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Zap className="h-3.5 w-3.5 text-violet-500 fill-violet-500" />
                Zefflow Pro
              </span>
              <span className="rounded bg-emerald-500/10 px-1.5 py-0.2 text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                ACTIVE
              </span>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              Swimlanes multi-divisi, ekspor vector PDF, & canvas tanpa batas.
            </p>
          </div>
        </div>

        {/* User Profile & Logout Menu */}
        <div className="border-t border-border p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="group flex w-full items-center justify-between rounded-xl p-2 text-left transition-colors hover:bg-muted"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-muted border border-border font-mono text-xs font-bold text-foreground">
                    {profile?.fullName?.charAt(0) ?? profile?.email?.charAt(0) ?? "U"}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-foreground">
                      {profile?.fullName || profile?.email || "Pengguna"}
                    </p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {profile?.email || "demo@zefflow.app"}
                    </p>
                  </div>
                </div>
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 border-border bg-card text-foreground" align="end" side="top">
              <DropdownMenuLabel className="font-normal text-muted-foreground text-xs">
                Masuk sebagai <strong className="text-foreground">{profile?.email}</strong>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem asChild className="text-xs cursor-pointer">
                <Link href="/settings" className="flex items-center w-full">
                  <Settings className="mr-2 h-4 w-4 text-violet-500" /> Pengaturan Akun
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="text-xs cursor-pointer">
                <Link href="/api-docs" className="flex items-center w-full">
                  <HelpCircle className="mr-2 h-4 w-4 text-sky-500" /> Dokumentasi API
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem
                destructive
                className="text-xs text-rose-500 focus:bg-rose-500/10 focus:text-rose-600"
                onClick={() => {
                  startTransition(async () => {
                    await signOutAction();
                  });
                }}
              >
                <LogOut className="mr-2 h-4 w-4" /> Keluar Sesi
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Studio Viewport */}
      <div className="flex flex-1 flex-col overflow-hidden bg-background">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/80 px-4 sm:px-6 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="grid h-8 w-8 place-items-center rounded-xl border border-border text-muted-foreground hover:bg-muted lg:hidden"
              aria-label="Buka menu"
            >
              <Menu className="h-4 w-4" />
            </button>

            {/* Modern Raycast/Linear-style Search Pill */}
            <div className="relative hidden items-center md:flex">
              <Search className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-muted-foreground/75" />
              <input
                type="text"
                placeholder="Cari alur kerja, SOP, atau divisi..."
                className="h-9 w-80 rounded-xl border border-border/80 dark:border-white/[0.08] bg-slate-100/80 dark:bg-[#12131F] pl-9 pr-12 text-xs text-foreground placeholder:text-muted-foreground/70 focus:border-violet-500/60 focus:bg-white dark:focus:bg-[#0E0F16] focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all duration-150 shadow-sm"
              />
              <kbd className="pointer-events-none absolute right-2.5 flex items-center gap-0.5 rounded-md border border-border/80 dark:border-white/[0.1] bg-white dark:bg-[#1B1D2C] px-1.5 py-0.5 text-[10px] font-mono font-medium text-muted-foreground shadow-sm">
                ⌘K
              </kbd>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="brand"
              size="sm"
              onClick={() => handleOpenFlowModal("sop")}
              className="gap-1.5 text-xs font-semibold h-8 px-2.5 sm:px-3 bg-gradient-to-r from-violet-600 to-indigo-600"
            >
              <Workflow className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Swimlane SOP</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenFlowModal("architect")}
              className="gap-1.5 text-xs font-semibold h-8 px-2.5 sm:px-3 border-sky-500/40 bg-sky-500/10 text-sky-600 dark:text-sky-300 hover:bg-sky-500/20"
            >
              <Database className="h-3.5 w-3.5 text-sky-500" />
              <span className="hidden sm:inline">Studio 2: Architect</span>
            </Button>
          </div>
        </header>

        {/* Dynamic Studio Workspace Body */}
        <main className="flex-1 overflow-y-auto bg-background dark:bg-[#090A0E] p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>

      {/* Modals for Workspace Creation, Team Management, and Flow Creation */}
      <CreateWorkspaceModal
        open={createWsOpen}
        onOpenChange={setCreateWsOpen}
      />

      <TeamManagementModal
        open={teamModalOpen}
        onOpenChange={setTeamModalOpen}
        workspaceId={active.id}
        workspaceName={active.name}
        currentUserRole={active.role}
      />

      <CreateFlowDialog
        open={createFlowOpen}
        onOpenChange={setCreateFlowOpen}
        defaultKind={createFlowKind}
      />
    </div>
  );
}
