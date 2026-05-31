"use client";

import type { LucideIcon } from "lucide-react";
import { Banknote, ChevronRight, HandCoins, UserPlus, Users } from "lucide-react";

import { useFunnel } from "@/lib/hooks/use-funnel";
import type { FunnelData } from "@/lib/types/analytics";
import { formatCurrency, formatInteger } from "@/lib/utils/format";

type Accent = "teal" | "violet" | "amber" | "emerald";

const ACCENT: Record<Accent, { iconBg: string; iconText: string; ring: string }> = {
	teal: {
		iconBg: "bg-teal-500/10",
		iconText: "text-teal-300",
		ring: "ring-teal-500/20",
	},
	violet: {
		iconBg: "bg-violet-500/10",
		iconText: "text-violet-300",
		ring: "ring-violet-500/20",
	},
	amber: {
		iconBg: "bg-amber-500/10",
		iconText: "text-amber-300",
		ring: "ring-amber-500/20",
	},
	emerald: {
		iconBg: "bg-emerald-500/10",
		iconText: "text-emerald-300",
		ring: "ring-emerald-500/20",
	},
};

type Stage = {
	label: string;
	value: string;
	caption: string;
	icon: LucideIcon;
	accent: Accent;
};

/** Connector between two stages, carrying the rate that links them. */
function Connector({ rate, note }: { rate: number; note: string }) {
	const safe = typeof rate === "number" && !isNaN(rate) ? rate : 0;
	const pct = `${formatInteger(Math.round(safe))}%`;
	return (
		<div className="flex shrink-0 flex-row items-center justify-center gap-1 py-1 sm:flex-col sm:py-0">
			<ChevronRight
				className="h-5 w-5 rotate-90 text-slate-600 sm:rotate-0"
				aria-hidden="true"
			/>
			<div className="flex flex-row items-baseline gap-1 sm:flex-col sm:items-center sm:gap-0">
				<span className="text-sm font-semibold text-slate-200">{pct}</span>
				<span className="text-[10px] uppercase tracking-[0.12em] text-slate-500">
					{note}
				</span>
			</div>
		</div>
	);
}

function StageCard({ stage }: { stage: Stage }) {
	const palette = ACCENT[stage.accent];
	const Icon = stage.icon;
	return (
		<div
			className={`flex min-w-0 flex-1 flex-col rounded-xl border border-slate-800/70 bg-slate-900/60 p-4 ring-1 ring-inset ${palette.ring}`}
		>
			<div className="flex items-center gap-2">
				<span
					className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${palette.iconBg} ${palette.iconText}`}
				>
					<Icon className="h-4 w-4" aria-hidden="true" />
				</span>
				<p className="truncate text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
					{stage.label}
				</p>
			</div>
			<p className="mt-3 truncate text-xl font-semibold text-slate-50 sm:text-2xl">
				{stage.value}
			</p>
			<p className="mt-1 text-[11px] text-slate-500">{stage.caption}</p>
		</div>
	);
}

export function FunnelStripSkeleton() {
	return (
		<div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
			{Array.from({ length: 4 }).map((_, i) => (
				<div key={i} className="contents">
					<div className="h-[110px] flex-1 animate-pulse rounded-xl border border-slate-800/60 bg-slate-900/60" />
					{i < 3 && (
						<div className="flex shrink-0 items-center justify-center py-1 sm:py-0">
							<div className="h-5 w-5 animate-pulse rounded bg-slate-800/60" />
						</div>
					)}
				</div>
			))}
		</div>
	);
}

export function FunnelStrip() {
	const { data, isLoading, isError } = useFunnel();

	if (isLoading) {
		return <FunnelStripSkeleton />;
	}

	// Fail soft: never crash the dashboard if the funnel can't load.
	if (isError || !data) {
		return null;
	}

	const funnel: FunnelData = data;
	const currency = funnel.currency;

	const stages: Stage[] = [
		{
			label: "Signups",
			value: formatInteger(funnel.signups),
			caption: "Joined via your link",
			icon: UserPlus,
			accent: "teal",
		},
		{
			label: "Converted",
			value: formatInteger(funnel.converted),
			caption: "Became paying customers",
			icon: Users,
			accent: "violet",
		},
		{
			label: "Earning",
			value: formatCurrency(funnel.earning, currency),
			caption: "Commission credited",
			icon: HandCoins,
			accent: "amber",
		},
		{
			label: "Paid",
			value: formatCurrency(funnel.paid, currency),
			caption: "Cashed out to you",
			icon: Banknote,
			accent: "emerald",
		},
	];

	return (
		<section aria-label="Referral funnel">
			<div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-stretch">
				<StageCard stage={stages[0]} />
				<Connector rate={funnel.signup_to_converted_rate} note="convert" />
				<StageCard stage={stages[1]} />
				<div className="flex shrink-0 items-center justify-center py-1 sm:py-0">
					<ChevronRight
						className="h-5 w-5 rotate-90 text-slate-600 sm:rotate-0"
						aria-hidden="true"
					/>
				</div>
				<StageCard stage={stages[2]} />
				<Connector rate={funnel.earning_to_paid_rate} note="paid out" />
				<StageCard stage={stages[3]} />
			</div>
		</section>
	);
}
