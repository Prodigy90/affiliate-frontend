type StatCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  accent?: string;
};

export function StatCard({ title, value, subtitle, accent }: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-800/70 bg-slate-900/60 px-4 py-4 shadow-sm">
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${
          accent || "from-slate-700/10 to-slate-900/5"
        } opacity-0 transition-opacity group-hover:opacity-100`}
      />
      <div className="relative space-y-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
          {title}
        </p>
        <p className="text-lg font-semibold text-slate-50">{value}</p>
        {subtitle ? (
          <p className="text-[11px] text-slate-400">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}
