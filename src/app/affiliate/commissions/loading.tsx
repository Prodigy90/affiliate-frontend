export default function CommissionsLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-slate-800/70" />
        <div className="h-4 w-72 animate-pulse rounded bg-slate-800/60" />
      </div>

      {/* Filters skeleton */}
      <div className="flex gap-3">
        <div className="h-10 w-40 animate-pulse rounded-lg bg-slate-800/70" />
        <div className="h-10 w-32 animate-pulse rounded-lg bg-slate-800/70" />
      </div>

      {/* Commissions table skeleton */}
      <div className="rounded-xl border border-slate-800/60 bg-slate-900/60">
        {/* Table header */}
        <div className="border-b border-slate-800/60 p-4">
          <div className="flex gap-4">
            <div className="h-4 w-24 animate-pulse rounded bg-slate-800/70" />
            <div className="h-4 w-20 animate-pulse rounded bg-slate-800/70" />
            <div className="h-4 w-28 animate-pulse rounded bg-slate-800/70" />
            <div className="h-4 w-16 animate-pulse rounded bg-slate-800/70" />
          </div>
        </div>
        {/* Table rows */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="border-b border-slate-800/40 p-4">
            <div className="flex items-center gap-4">
              <div className="h-4 w-24 animate-pulse rounded bg-slate-800/60" />
              <div className="h-4 w-20 animate-pulse rounded bg-slate-800/60" />
              <div className="h-4 w-28 animate-pulse rounded bg-slate-800/60" />
              <div className="h-6 w-16 animate-pulse rounded-full bg-slate-800/60" />
            </div>
          </div>
        ))}
      </div>

      {/* Pagination skeleton */}
      <div className="flex justify-center gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 w-8 animate-pulse rounded bg-slate-800/70" />
        ))}
      </div>
    </div>
  );
}
