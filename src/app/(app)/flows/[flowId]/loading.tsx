import { Loader2, Workflow } from "lucide-react";

export default function FlowEditorLoading() {
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground">
      {/* Studio Editor Header Skeleton */}
      <header className="flex h-13 items-center justify-between border-b border-border bg-card px-4">
        <div className="flex items-center gap-3">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-violet-500 via-indigo-600 to-fuchsia-600 text-white shadow-sm">
            <Workflow className="h-4 w-4" />
          </div>
          <div className="space-y-1.5 animate-pulse">
            <div className="h-4 w-48 rounded bg-muted/80" />
            <div className="h-2.5 w-28 rounded bg-muted/50" />
          </div>
        </div>
        <div className="flex items-center gap-2 animate-pulse">
          <div className="h-8 w-20 rounded-xl bg-muted/60" />
          <div className="h-8 w-24 rounded-xl bg-violet-500/20" />
        </div>
      </header>

      {/* Studio Canvas Skeleton */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Left Sidebar Rail Skeleton */}
        <div className="hidden sm:flex w-12 shrink-0 flex-col items-center gap-3 border-r border-border bg-card/80 py-3 animate-pulse">
          <div className="h-8 w-8 rounded-xl bg-muted/70" />
          <div className="h-8 w-8 rounded-xl bg-muted/60" />
          <div className="h-8 w-8 rounded-xl bg-muted/60" />
          <div className="h-8 w-8 rounded-xl bg-muted/60" />
        </div>

        {/* Canvas Grid Area */}
        <div
          className="relative flex flex-1 items-center justify-center bg-slate-50/50 dark:bg-[#090A10]"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(139,92,246,0.14) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        >
          <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-card/95 px-4 py-2.5 shadow-lg">
            <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
            <span className="text-xs font-semibold text-foreground">
              Menyiapkan Kanvas Studio...
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

