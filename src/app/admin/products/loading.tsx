export default function AdminProductsLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-32 animate-pulse rounded-lg bg-slate-800/70" />
          <div className="h-4 w-64 animate-pulse rounded bg-slate-800/60" />
        </div>
        <div className="h-10 w-28 animate-pulse rounded-lg bg-slate-800/70" />
      </div>

      {/* Products grid skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-800/60 bg-slate-900/60 p-5"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 animate-pulse rounded-lg bg-slate-800/70" />
                <div className="space-y-2 flex-1">
                  <div className="h-5 w-32 animate-pulse rounded bg-slate-800/70" />
                  <div className="h-3 w-20 animate-pulse rounded bg-slate-800/60" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="h-4 w-24 animate-pulse rounded bg-slate-800/60" />
                <div className="h-6 w-16 animate-pulse rounded-full bg-slate-800/70" />
              </div>
              <div className="h-8 w-full animate-pulse rounded-lg bg-slate-800/70" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
