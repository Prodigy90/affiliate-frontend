export default function AffiliateLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-800/70" />
        <div className="h-4 w-72 animate-pulse rounded bg-slate-800/60" />
      </div>

      {/* Content skeleton */}
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-xl border border-slate-800/60 bg-slate-900/60"
          />
        ))}
      </div>

      {/* Additional content skeleton */}
      <div className="h-64 animate-pulse rounded-xl border border-slate-800/60 bg-slate-900/60" />
    </div>
  );
}
