export default function AdminAffiliatesLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-36 animate-pulse rounded-lg bg-slate-800/70" />
          <div className="h-4 w-56 animate-pulse rounded bg-slate-800/60" />
        </div>
        <div className="h-10 w-32 animate-pulse rounded-lg bg-slate-800/70" />
      </div>

      {/* Search/filter skeleton */}
      <div className="flex gap-3">
        <div className="h-10 w-64 animate-pulse rounded-lg bg-slate-800/70" />
        <div className="h-10 w-32 animate-pulse rounded-lg bg-slate-800/70" />
      </div>

      {/* Affiliates table skeleton */}
      <div className="rounded-xl border border-slate-800/60 bg-slate-900/60">
        {/* Table header */}
        <div className="border-b border-slate-800/60 p-4">
          <div className="flex gap-6">
            <div className="h-4 w-32 animate-pulse rounded bg-slate-800/70" />
            <div className="h-4 w-40 animate-pulse rounded bg-slate-800/70" />
            <div className="h-4 w-20 animate-pulse rounded bg-slate-800/70" />
            <div className="h-4 w-24 animate-pulse rounded bg-slate-800/70" />
            <div className="h-4 w-16 animate-pulse rounded bg-slate-800/70" />
          </div>
        </div>
        {/* Table rows */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="border-b border-slate-800/40 p-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 animate-pulse rounded-full bg-slate-800/70" />
                <div className="h-4 w-28 animate-pulse rounded bg-slate-800/60" />
              </div>
              <div className="h-4 w-40 animate-pulse rounded bg-slate-800/60" />
              <div className="h-4 w-20 animate-pulse rounded bg-slate-800/60" />
              <div className="h-4 w-24 animate-pulse rounded bg-slate-800/60" />
              <div className="h-8 w-16 animate-pulse rounded-lg bg-slate-800/60" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
