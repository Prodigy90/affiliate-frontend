export default function AdminPayoutsLoading() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="space-y-3">
        <div className="h-3 w-16 animate-pulse rounded bg-slate-800/70" />
        <div className="h-9 w-64 animate-pulse rounded-lg bg-slate-800/70" />
        <div className="h-4 w-full max-w-xl animate-pulse rounded bg-slate-800/60" />
      </div>

      {/* Summary strip skeleton */}
      <div className="flex flex-wrap gap-6 rounded-2xl border border-slate-800/70 bg-slate-900/40 px-4 py-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-4 w-20 animate-pulse rounded bg-slate-800/60" />
        ))}
      </div>

      {/* Payout requests card skeleton */}
      <div className="space-y-4 rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <div className="h-4 w-32 animate-pulse rounded bg-slate-800/70" />
        </div>

        <div className="h-10 w-full max-w-sm animate-pulse rounded-lg bg-slate-800/70" />

        {/* Table header */}
        <div className="flex gap-6 border-b border-slate-800/50 pb-2">
          <div className="h-3 w-28 animate-pulse rounded bg-slate-800/70" />
          <div className="h-3 w-20 animate-pulse rounded bg-slate-800/70" />
          <div className="h-3 w-24 animate-pulse rounded bg-slate-800/70" />
          <div className="h-3 w-16 animate-pulse rounded bg-slate-800/70" />
          <div className="ml-auto h-3 w-20 animate-pulse rounded bg-slate-800/70" />
        </div>

        {/* Table rows */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-6 border-b border-slate-800/50 py-3 last:border-b-0">
            <div className="h-4 w-28 animate-pulse rounded bg-slate-800/60" />
            <div className="h-4 w-20 animate-pulse rounded bg-slate-800/60" />
            <div className="h-6 w-20 animate-pulse rounded-full bg-slate-800/60" />
            <div className="h-4 w-24 animate-pulse rounded bg-slate-800/60" />
            <div className="ml-auto flex gap-2">
              <div className="h-8 w-24 animate-pulse rounded-full bg-slate-800/60" />
              <div className="h-8 w-16 animate-pulse rounded-full bg-slate-800/60" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
