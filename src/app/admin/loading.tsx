export default function AdminDashboardLoading() {
	return (
		<div className="space-y-4" aria-busy="true">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="space-y-2">
					<div className="h-3 w-14 animate-pulse rounded bg-slate-800/70" />
					<div className="h-7 w-64 animate-pulse rounded bg-slate-800/70" />
				</div>
				<div className="h-9 w-64 animate-pulse rounded-lg bg-slate-800/70" />
			</div>
			<div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<div
						key={i}
						className="h-28 animate-pulse rounded-xl border border-slate-800/60 bg-slate-900/60"
					/>
				))}
			</div>
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
				<div className="h-[420px] animate-pulse rounded-2xl border border-slate-800/60 bg-slate-900/60 lg:col-span-2" />
				<div className="space-y-4">
					<div className="h-[200px] animate-pulse rounded-2xl border border-slate-800/60 bg-slate-900/60" />
					<div className="h-[200px] animate-pulse rounded-2xl border border-slate-800/60 bg-slate-900/60" />
				</div>
			</div>
		</div>
	);
}
