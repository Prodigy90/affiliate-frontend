export default function PayoutsLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-32 animate-pulse rounded-lg bg-slate-800/70" />
        <div className="h-4 w-64 animate-pulse rounded bg-slate-800/60" />
      </div>

      {/* Balance card skeleton */}
      <div className="rounded-xl border border-slate-800/60 bg-slate-900/60 p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 w-32 animate-pulse rounded bg-slate-800/70" />
            <div className="h-8 w-40 animate-pulse rounded bg-slate-800/70" />
          </div>
          <div className="h-10 w-32 animate-pulse rounded-lg bg-slate-800/70" />
        </div>
      </div>

      {/* Request form skeleton */}
      <div className="rounded-xl border border-slate-800/60 bg-slate-900/60 p-6">
        <div className="space-y-4">
          <div className="h-5 w-36 animate-pulse rounded bg-slate-800/70" />
          <div className="flex gap-3">
            <div className="h-10 flex-1 animate-pulse rounded-lg bg-slate-800/70" />
            <div className="h-10 w-28 animate-pulse rounded-lg bg-slate-800/70" />
          </div>
        </div>
      </div>

      {/* Payouts table skeleton */}
      <div className="space-y-3">
        <div className="h-5 w-32 animate-pulse rounded bg-slate-800/70" />
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 w-full animate-pulse rounded-lg bg-slate-800/60"
          />
        ))}
      </div>
    </div>
  );
}
