"use client";

import { useOwnRank } from "@/lib/hooks/use-own-rank";
import { formatInteger, formatNaira } from "@/lib/utils/format";

/**
 * "Leaderboard" — the caller's own rank, as a compact side card. Per the
 * privacy decision this is NOT a list of top earners; it only ever shows the
 * logged-in affiliate's own position. Kept the `TopEarnersPanel` export name
 * so the dashboard import stays unchanged.
 */
export function TopEarnersPanel() {
	const { data, isLoading, isError } = useOwnRank();

	if (isLoading) {
		return (
			<div className="rounded-xl border border-slate-800/70 bg-slate-900/60 p-4">
				<div className="flex items-center justify-between gap-3">
					<div className="h-3 w-24 animate-pulse rounded bg-slate-800/70" />
					<div className="h-5 w-20 animate-pulse rounded-full bg-slate-800/70" />
				</div>
				<div className="mt-2 h-3 w-32 animate-pulse rounded bg-slate-800/60" />
			</div>
		);
	}

	// Fail quietly — a leaderboard hiccup shouldn't take down the dashboard.
	if (isError || !data) {
		return null;
	}

	if (!data.ranked) {
		return (
			<div className="rounded-xl border border-slate-800/70 bg-slate-900/60 p-4">
				<p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
					Leaderboard
				</p>
				<p className="mt-1.5 text-[11px] text-slate-400">
					Not ranked yet — your first commission puts you on the board.
				</p>
			</div>
		);
	}

	// percentile is a raw float (e.g. 3.53). Round for display, and never show
	// "Top 0%" — the floor is "Top 1%".
	const topPercent = Math.max(1, Math.round(data.percentile));

	return (
		<div className="rounded-xl border border-slate-800/70 bg-slate-900/60 p-4">
			<div className="flex items-center justify-between gap-3">
				<p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
					Leaderboard
				</p>
				<span className="inline-flex items-center rounded-full bg-violet-500/10 px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-violet-200 ring-1 ring-violet-500/30">
					#{formatInteger(data.rank)} of {formatInteger(data.total_affiliates)}
				</span>
			</div>
			<p className="mt-1.5 text-[11px] text-slate-400">
				Top {topPercent}% ·{" "}
				<span className="font-mono tabular-nums text-slate-300">
					{formatNaira(data.total_earnings, data.currency)}
				</span>{" "}
				earned to date.
			</p>
		</div>
	);
}
