export default function AdminProductsLoading() {
	return (
		<div className="space-y-8">
			{/* Header skeleton */}
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div className="space-y-2">
					<div className="h-3 w-20 animate-pulse rounded bg-slate-800/70" />
					<div className="h-9 w-72 animate-pulse rounded-lg bg-slate-800/70" />
					<div className="h-4 w-96 animate-pulse rounded bg-slate-800/60" />
				</div>
				<div className="h-10 w-32 animate-pulse rounded-full bg-slate-800/70" />
			</div>

			{/* Search bar skeleton */}
			<div className="h-10 w-full max-w-sm animate-pulse rounded-md bg-slate-800/60" />

			{/* Products grid skeleton */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{[1, 2, 3, 4, 5, 6].map((i) => (
					<div
						key={i}
						className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-5"
					>
						<div className="space-y-4">
							<div className="flex items-start justify-between gap-2">
								<div className="flex items-start gap-3">
									<div className="h-10 w-10 animate-pulse rounded-xl bg-slate-800/70" />
									<div className="space-y-2">
										<div className="h-4 w-28 animate-pulse rounded bg-slate-800/70" />
										<div className="h-3 w-20 animate-pulse rounded bg-slate-800/60" />
									</div>
								</div>
								<div className="h-6 w-16 animate-pulse rounded-full bg-slate-800/70" />
							</div>
							<div className="flex items-center gap-2">
								<div className="h-5 w-24 animate-pulse rounded-md bg-slate-800/60" />
								<div className="h-5 w-28 animate-pulse rounded-md bg-slate-800/60" />
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
