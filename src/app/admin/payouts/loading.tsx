export default function AdminPayoutsLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-800/70" />
          <div className="h-4 w-64 animate-pulse rounded bg-slate-800/60" />
        </div>
        <div className="h-10 w-24 animate-pulse rounded-lg bg-slate-800/70" />
      </div>

      {/* Stats row skeleton */}
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl border border-slate-800/60 bg-slate-900/60"
          />
        ))}
      </div>

      {/* Payouts table skeleton */}
      <div className="rounded-xl border border-slate-800/60 bg-slate-900/60">
        {/* Table header */}
        <div className="border-b border-slate-800/60 p-4">
          <div className="flex gap-6">
            <div className="h-4 w-28 animate-pulse rounded bg-slate-800/70" />
            <div className="h-4 w-20 animate-pulse rounded bg-slate-800/70" />
            <div className="h-4 w-24 animate-pulse rounded bg-slate-800/70" />
            <div className="h-4 w-16 animate-pulse rounded bg-slate-800/70" />
            <div className="h-4 w-20 animate-pulse rounded bg-slate-800/70" />
          </div>
        </div>
        {/* Table rows */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="border-b border-slate-800/40 p-4">
            <div className="flex items-center gap-6">
              <div className="h-4 w-28 animate-pulse rounded bg-slate-800/60" />
              <div className="h-4 w-20 animate-pulse rounded bg-slate-800/60" />
              <div className="h-4 w-24 animate-pulse rounded bg-slate-800/60" />
              <div className="h-6 w-16 animate-pulse rounded-full bg-slate-800/60" />
              <div className="flex gap-2">
                <div className="h-8 w-20 animate-pulse rounded-lg bg-slate-800/60" />
                <div className="h-8 w-16 animate-pulse rounded-lg bg-slate-800/60" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
