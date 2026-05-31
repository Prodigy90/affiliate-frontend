import type { LucideIcon } from "lucide-react";
import { Banknote, Clock, TrendingUp, UserPlus } from "lucide-react";

import type { EarningsSummary } from "@/lib/types/affiliate";
import { formatCurrency, formatInteger } from "@/lib/utils/format";

type Tile = {
	label: string;
	value: string;
	hint?: string;
	icon: LucideIcon;
	accent: "teal" | "amber" | "violet" | "sky";
};

const ACCENT: Record<Tile["accent"], { iconBg: string; iconText: string }> = {
	teal: { iconBg: "bg-teal-500/10", iconText: "text-teal-300" },
	amber: { iconBg: "bg-amber-500/10", iconText: "text-amber-300" },
	violet: { iconBg: "bg-violet-500/10", iconText: "text-violet-300" },
	sky: { iconBg: "bg-sky-500/10", iconText: "text-sky-300" },
};

export function StatTiles({
	data,
	signupsCount,
}: {
	data: EarningsSummary;
	/** Total referred signups (top-of-funnel). Undefined while loading. */
	signupsCount?: number;
}) {
	const currency = data.currency;

	const tiles: Tile[] = [
		{
			label: "Earnings to date",
			value: formatCurrency(data.total_earnings, currency),
			hint: "All commissions ever credited",
			icon: TrendingUp,
			accent: "teal",
		},
		{
			label: "Ready to withdraw",
			value: formatCurrency(data.available_for_payout, currency),
			hint: "Net of refunds",
			icon: Banknote,
			accent: "amber",
		},
		{
			label: "Pending clearance",
			value: formatCurrency(data.pending_balance, currency),
			hint: "Clears once refund window closes",
			icon: Clock,
			accent: "sky",
		},
		{
			label: "Referred signups",
			value: signupsCount === undefined ? "—" : formatInteger(signupsCount),
			hint: "People who joined via your link",
			icon: UserPlus,
			accent: "violet",
		},
	];

	return (
		<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
			{tiles.map((tile) => {
				const palette = ACCENT[tile.accent];
				const Icon = tile.icon;
				return (
					<div
						key={tile.label}
						className="rounded-xl border border-slate-800/70 bg-slate-900/60 p-5 transition-colors hover:border-slate-700/70"
					>
						<div className="flex items-start justify-between gap-3">
							<p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
								{tile.label}
							</p>
							<span
								className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${palette.iconBg} ${palette.iconText}`}
							>
								<Icon className="h-4 w-4" aria-hidden="true" />
							</span>
						</div>
						<p className="mt-3 text-xl font-semibold text-slate-50 sm:text-2xl">
							{tile.value}
						</p>
						{tile.hint && (
							<p className="mt-1 text-[11px] text-slate-500">{tile.hint}</p>
						)}
					</div>
				);
			})}
		</div>
	);
}
