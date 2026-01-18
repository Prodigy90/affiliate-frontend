export default function AdminLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-800/70" />
        <div className="h-4 w-72 animate-pulse rounded bg-slate-800/60" />
      </div>

      {/* Content skeleton */}
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
