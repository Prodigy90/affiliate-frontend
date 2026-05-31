"use client";

import { Trophy } from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState";
import { useOwnRank } from "@/lib/hooks/use-own-rank";
import { formatCurrency, formatInteger } from "@/lib/utils/format";

/**
 * "Your standing" — the caller's own rank on the affiliate leaderboard.
 * Per the privacy decision, this is NOT a list of top earners; it only ever
 * shows the logged-in affiliate's own position. Kept the `TopEarnersPanel`
 * export name so the dashboard import stays unchanged.
 */
export function TopEarnersPanel() {
	const { data, isLoading, isError } = useOwnRank();

	if (isLoading) {
		return <StandingSkeleton />;
	}

	// Fail quietly — a leaderboard hiccup shouldn't take down the dashboard.
	if (isError || !data) {
		return null;
	}

	if (!data.ranked) {
		return (
			<EmptyState
				icon={Trophy}
				accent="violet"
				title="You're not ranked yet"
				body="Your first commission puts you on the board. Share your link and watch your standing climb."
			/>
		);
	}

	// percentile is a raw float (e.g. 3.53). Round for display, and never show
	// "Top 0%" — the floor is "Top 1%".
	const topPercent = Math.max(1, Math.round(data.percentile));

	return (
		<div className="rounded-xl border border-slate-800/70 bg-gradient-to-br from-violet-500/5 via-slate-900/60 to-slate-900/60 p-5">
			<div className="mb-4 flex items-center justify-between gap-3">
				<div className="flex items-center gap-2">
					<span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-300">
						<Trophy className="h-4 w-4" aria-hidden="true" />
					</span>
					<p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
						Your standing
					</p>
				</div>
				<span className="inline-flex items-center rounded-full bg-violet-500/10 px-2.5 py-1 text-[11px] font-semibold text-violet-200 ring-1 ring-violet-500/30">
					Top {topPercent}%
				</span>
			</div>

			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="text-3xl font-semibold leading-none tracking-tight text-slate-50 sm:text-4xl">
						#{formatInteger(data.rank)}
					</p>
					<p className="mt-1.5 text-xs text-slate-400">
						of {formatInteger(data.total_affiliates)} affiliates
					</p>
				</div>
				<div className="text-right">
					<p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
						Earnings to date
					</p>
					<p className="mt-1 text-lg font-semibold text-slate-100 sm:text-xl">
						{formatCurrency(data.total_earnings, data.currency)}
					</p>
				</div>
			</div>
		</div>
	);
}

function StandingSkeleton() {
	return (
		<div className="rounded-xl border border-slate-800/70 bg-slate-900/60 p-5">
			<div className="mb-4 flex items-center justify-between gap-3">
				<div className="h-5 w-32 animate-pulse rounded bg-slate-800/70" />
				<div className="h-6 w-16 animate-pulse rounded-full bg-slate-800/70" />
			</div>
			<div className="flex items-end justify-between gap-4">
				<div className="space-y-2">
					<div className="h-9 w-24 animate-pulse rounded bg-slate-800/70" />
					<div className="h-3 w-28 animate-pulse rounded bg-slate-800/70" />
				</div>
				<div className="space-y-2 text-right">
					<div className="ml-auto h-3 w-24 animate-pulse rounded bg-slate-800/70" />
					<div className="ml-auto h-5 w-20 animate-pulse rounded bg-slate-800/70" />
				</div>
			</div>
		</div>
	);
}
