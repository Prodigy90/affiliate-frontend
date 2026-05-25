import { Trophy } from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState";

// Placeholder dataset. Wired to real data in a follow-up — for now this
// gives the bento layout the right rhythm and shows what the leaderboard
// will look like once the endpoint lands.
const PLACEHOLDER: { rank: number; name: string; earnings: string }[] = [];

export function TopEarnersPanel() {
	if (PLACEHOLDER.length === 0) {
		return (
			<EmptyState
				icon={Trophy}
				accent="violet"
				title="Leaderboard coming soon"
				body="We're tallying the top earners across the program. You'll see how your numbers stack up here once the board goes live."
			/>
		);
	}

	return (
		<div className="rounded-xl border border-slate-800/70 bg-slate-900/60 p-5">
			<div className="mb-4 flex items-center justify-between gap-3">
				<div className="flex items-center gap-2">
					<span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-300">
						<Trophy className="h-4 w-4" aria-hidden="true" />
					</span>
					<p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
						Top earners this month
					</p>
				</div>
			</div>
			<ul className="divide-y divide-slate-800/70">
				{PLACEHOLDER.map((row) => (
					<li
						key={row.rank}
						className="flex items-center justify-between py-3 text-sm"
					>
						<div className="flex items-center gap-3">
							<span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-slate-300">
								{row.rank}
							</span>
							<span className="text-slate-200">{row.name}</span>
						</div>
						<span className="font-semibold text-slate-100">
							{row.earnings}
						</span>
					</li>
				))}
			</ul>
		</div>
	);
}
