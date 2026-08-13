"use client";

import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";

import { Sparkline } from "@/components/shared/Sparkline";
import { cn } from "@/lib/utils";

/**
 * KPI bento for the affiliate dashboard/analytics surfaces — compact
 * preformatted value, signed delta chip vs the previous equal period,
 * per-metric icon chip, micro-sparkline. Adapted from wasbot-frontend's
 * StatusKpiCard: same house bento pattern (flat at rest, hue-tinted border +
 * ambient radial glow + lift on hover), but `value` here is a preformatted
 * string (we display naira amounts, not just counts).
 */

export type KpiHue = "sky" | "violet" | "amber" | "teal" | "rose";

const HUE: Record<
	KpiHue,
	{ hoverBorder: string; glow: string; chip: string; dot: string }
> = {
	sky: {
		hoverBorder: "hover:border-sky-500/40",
		glow: "rgba(56, 189, 248, 0.12)",
		chip: "bg-sky-500/10 text-sky-300 ring-sky-500/30",
		dot: "#38bdf8",
	},
	violet: {
		hoverBorder: "hover:border-violet-500/40",
		glow: "rgba(167, 139, 250, 0.12)",
		chip: "bg-violet-500/10 text-violet-300 ring-violet-500/30",
		dot: "#a78bfa",
	},
	amber: {
		hoverBorder: "hover:border-amber-500/40",
		glow: "rgba(251, 191, 36, 0.12)",
		chip: "bg-amber-500/10 text-amber-300 ring-amber-500/30",
		dot: "#fbbf24",
	},
	teal: {
		hoverBorder: "hover:border-teal-500/40",
		glow: "rgba(45, 212, 191, 0.14)",
		chip: "bg-teal-500/10 text-teal-300 ring-teal-500/30",
		dot: "#2dd4bf",
	},
	rose: {
		hoverBorder: "hover:border-rose-500/40",
		glow: "rgba(251, 113, 133, 0.12)",
		chip: "bg-rose-500/10 text-rose-300 ring-rose-500/30",
		dot: "#fb7185",
	},
};

/** "+42%" / "-8%" with sub-1% magnitudes kept visible ("+0.4%"). */
function fmtDelta(delta: number): string {
	const abs = Math.abs(delta);
	const body = abs < 1 ? `${Math.round(abs * 10) / 10}` : `${Math.round(abs)}`;
	return `${delta >= 0 ? "+" : "-"}${body}%`;
}

export function KpiTile({
	label,
	icon: Icon,
	hue,
	value,
	valueTitle,
	delta,
	compareLabel,
	secondary,
	spark,
	accent = false,
}: {
	label: string;
	icon: LucideIcon;
	hue: KpiHue;
	/** Preformatted display value (e.g. a naira amount or a plain count). */
	value: string;
	/** Optional full-precision title attribute for the value (e.g. exact amount). */
	valueTitle?: string;
	/**
	 * Percent change vs the previous period. undefined renders no chip at all;
	 * null renders the quiet "new" chip; a number renders the signed arrow chip.
	 */
	delta?: number | null;
	compareLabel?: string;
	/** Optional inline qualifier, e.g. "12% of signups convert". */
	secondary?: string;
	/** Per-bucket values for the current window — the tile's micro-trend. */
	spark?: number[];
	/** Teal-tint the value — reserve for the hero metric. */
	accent?: boolean;
}) {
	const up = delta != null && delta > 0;
	const down = delta != null && delta < 0;
	const h = HUE[hue];
	const showSpark = !!spark && spark.length >= 2;

	return (
		<div
			className={cn(
				"group relative min-w-0 overflow-hidden rounded-xl border border-slate-800/70 bg-slate-900/60 p-3.5 transition-all duration-200 hover:-translate-y-0.5 sm:p-4",
				h.hoverBorder,
			)}
		>
			<div
				className="pointer-events-none absolute -inset-1/2 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
				style={{ background: `radial-gradient(ellipse at 30% 0%, ${h.glow}, transparent 60%)` }}
				aria-hidden="true"
			/>

			<div className="relative flex items-center gap-2">
				<span
					className={cn(
						"flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1",
						h.chip,
					)}
				>
					<Icon className="h-3.5 w-3.5" aria-hidden="true" />
				</span>
				<span className="min-w-0 truncate text-xs text-slate-400">{label}</span>
				{delta === undefined ? null : delta === null ? (
					<span className="ml-auto rounded-md bg-slate-800/70 px-1.5 py-0.5 text-[11px] font-medium text-slate-500">
						new
					</span>
				) : (
					<span
						title={compareLabel}
						className={cn(
							"ml-auto inline-flex shrink-0 items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
							up && "bg-teal-500/10 text-teal-300",
							down && "bg-rose-500/10 text-rose-300",
							!up && !down && "bg-slate-800/70 text-slate-400",
						)}
					>
						{up && <ArrowUpRight className="h-3 w-3" aria-hidden="true" />}
						{down && <ArrowDownRight className="h-3 w-3" aria-hidden="true" />}
						{fmtDelta(delta)}
						{compareLabel && <span className="sr-only"> {compareLabel}</span>}
					</span>
				)}
			</div>

			<div className="relative mt-2 flex items-end justify-between gap-2">
				<div className="min-w-0">
					<div
						className={cn(
							"truncate font-mono text-xl font-semibold leading-7 tracking-tight tabular-nums sm:text-[1.35rem]",
							accent ? "text-teal-300" : "text-slate-50",
						)}
						title={valueTitle}
					>
						{value}
					</div>
					{secondary && (
						<div className="mt-0.5 truncate text-[11px] text-slate-500">{secondary}</div>
					)}
				</div>
				{showSpark && (
					<div className="shrink-0 opacity-60 transition-opacity group-hover:opacity-100">
						<Sparkline points={spark!} width={84} height={30} stroke="#475569" dotFill={h.dot} />
					</div>
				)}
			</div>
		</div>
	);
}
