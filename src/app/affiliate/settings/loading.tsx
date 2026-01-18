export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-32 animate-pulse rounded-lg bg-slate-800/70" />
        <div className="h-4 w-64 animate-pulse rounded bg-slate-800/60" />
      </div>

      {/* Profile section skeleton */}
      <div className="rounded-xl border border-slate-800/60 bg-slate-900/60 p-6">
        <div className="space-y-4">
          <div className="h-5 w-24 animate-pulse rounded bg-slate-800/70" />
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 animate-pulse rounded-full bg-slate-800/70" />
            <div className="space-y-2 flex-1">
              <div className="h-5 w-40 animate-pulse rounded bg-slate-800/70" />
              <div className="h-4 w-56 animate-pulse rounded bg-slate-800/60" />
            </div>
          </div>
        </div>
      </div>

      {/* Bank account section skeleton */}
      <div className="rounded-xl border border-slate-800/60 bg-slate-900/60 p-6">
        <div className="space-y-4">
          <div className="h-5 w-40 animate-pulse rounded bg-slate-800/70" />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="h-4 w-20 animate-pulse rounded bg-slate-800/70" />
              <div className="h-10 animate-pulse rounded-lg bg-slate-800/70" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-28 animate-pulse rounded bg-slate-800/70" />
              <div className="h-10 animate-pulse rounded-lg bg-slate-800/70" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-32 animate-pulse rounded bg-slate-800/70" />
            <div className="h-10 animate-pulse rounded-lg bg-slate-800/70" />
          </div>
          <div className="flex justify-end">
            <div className="h-10 w-28 animate-pulse rounded-lg bg-slate-800/70" />
          </div>
        </div>
      </div>
    </div>
  );
}
