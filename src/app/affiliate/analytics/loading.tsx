export default function AnalyticsLoading() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-32 animate-pulse rounded-lg bg-slate-800/70" />
          <div className="h-4 w-64 animate-pulse rounded bg-slate-800/60" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-32 animate-pulse rounded-lg bg-slate-800/70" />
          <div className="h-10 w-24 animate-pulse rounded-lg bg-slate-800/70" />
        </div>
      </div>

      {/* Stats cards skeleton */}
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl border border-slate-800/60 bg-slate-900/60"
          />
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="rounded-xl border border-slate-800/60 bg-slate-900/60 p-6">
        <div className="mb-4 h-5 w-40 animate-pulse rounded bg-slate-800/70" />
        <div className="h-64 animate-pulse rounded-lg bg-slate-800/50" />
      </div>

      {/* Product performance skeleton */}
      <div className="rounded-xl border border-slate-800/60 bg-slate-900/60 p-6">
        <div className="mb-4 h-5 w-48 animate-pulse rounded bg-slate-800/70" />
        <div className="h-48 animate-pulse rounded-lg bg-slate-800/50" />
      </div>
    </div>
  );
}
