export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      {/* Hero section skeleton */}
      <section className="grid gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)] items-center">
        <div className="space-y-3">
          <div className="h-5 w-40 animate-pulse rounded bg-slate-800/70" />
          <div className="h-9 w-64 animate-pulse rounded bg-slate-800/70" />
          <div className="h-4 w-80 animate-pulse rounded bg-slate-800/60" />
        </div>
        <div className="flex justify-center">
          <div className="h-40 w-40 animate-pulse rounded-full bg-slate-800/70" />
        </div>
      </section>

      {/* Stats cards skeleton */}
      <section className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-xl border border-slate-800/60 bg-slate-900/60"
          />
        ))}
      </section>
    </div>
  );
}
