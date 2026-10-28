export default function DashboardLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 border-b border-border/80 pb-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-56 rounded-lg bg-muted/70" />
            <div className="h-5 w-16 rounded-full bg-muted/60" />
          </div>
          <div className="h-3.5 w-72 rounded bg-muted/50" />
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="h-9 w-64 rounded-xl bg-muted/60" />
          <div className="h-9 w-36 rounded-xl bg-violet-500/20" />
          <div className="h-9 w-36 rounded-xl bg-sky-500/15" />
        </div>
      </div>

      {/* Body skeleton */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        <div className="flex-1 min-w-0 w-full space-y-4">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <div className="h-7 w-24 rounded-full bg-violet-500/25" />
            <div className="h-7 w-28 rounded-full bg-muted/60" />
            <div className="h-7 w-28 rounded-full bg-muted/60" />
            <div className="h-7 w-32 rounded-full bg-muted/60" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="h-40 rounded-2xl border border-border/70 bg-card/60 p-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="h-4 w-20 rounded bg-muted/70" />
                  <div className="h-4 w-3/4 rounded bg-muted/70" />
                  <div className="h-3 w-full rounded bg-muted/50" />
                </div>
                <div className="h-3 w-24 rounded bg-muted/50" />
              </div>
            ))}
          </div>
        </div>

        <aside className="w-full lg:w-72 xl:w-[280px] shrink-0 space-y-3.5">
          <div className="h-36 rounded-2xl border border-border/70 bg-card/60 p-3" />
          <div className="h-72 rounded-2xl border border-border/70 bg-card/60 p-3" />
        </aside>
      </div>
    </div>
  );
}

