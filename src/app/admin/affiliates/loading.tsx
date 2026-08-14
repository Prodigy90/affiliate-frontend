export default function AdminAffiliatesLoading() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="space-y-3">
        <div className="h-3 w-20 animate-pulse rounded bg-slate-800/70" />
        <div className="h-9 w-72 animate-pulse rounded-lg bg-slate-800/70" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded bg-slate-800/60" />
      </div>

      {/* Filters skeleton */}
      <div className="space-y-4 rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4">
        <div className="h-3 w-24 animate-pulse rounded bg-slate-800/70" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="h-9 w-full max-w-sm animate-pulse rounded-md bg-slate-800/70" />
          <div className="flex gap-2">
            <div className="h-8 w-40 animate-pulse rounded-lg bg-slate-800/70" />
            <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-800/70" />
          </div>
        </div>

        {/* Table skeleton */}
        <div className="space-y-2">
          <div className="h-5 w-40 animate-pulse rounded bg-slate-800/70" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 rounded-lg border border-slate-800/50 p-3">
              <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-slate-800/70" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="h-3.5 w-32 animate-pulse rounded bg-slate-800/70" />
                <div className="h-3 w-44 animate-pulse rounded bg-slate-800/60" />
              </div>
              <div className="hidden h-5 w-24 animate-pulse rounded-full bg-slate-800/60 sm:block" />
              <div className="hidden h-3 w-28 animate-pulse rounded bg-slate-800/60 md:block" />
              <div className="h-7 w-16 shrink-0 animate-pulse rounded-full bg-slate-800/60" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
