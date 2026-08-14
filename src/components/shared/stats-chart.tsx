"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { bucketTooltipLabel, type SeriesGranularity } from "@/lib/stats/series";

/**
 * Chart scaffolding ported from wasbot-frontend's stats pages — the
 * header/tab bar, definite-height container, empty state, legend, and
 * tooltip renderer are identical by design so the affiliate analytics
 * surface reads as the same product.
 */

export const CHART_GRID_STROKE = "#1e293b";
export const CHART_TICK_FILL = "#64748b";

/** One plotted series: identity for the tooltip + legend. */
export interface ChartSeriesDef {
	key: string;
	name: string;
	color: string;
	/** Optional display formatter (e.g. naira amounts); defaults to toLocaleString. */
	formatValue?: (value: number) => string;
}

/**
 * Recharts tooltip content shared by every stats chart. Rows follow `defs`
 * order (not payload order); a row whose value isn't a number is omitted.
 */
export function StatsChartTooltip({
	active,
	payload,
	label,
	granularity,
	defs,
}: {
	active?: boolean;
	payload?: { dataKey?: string | number; name?: string; value?: number | string }[];
	label?: string;
	granularity: SeriesGranularity;
	defs: ChartSeriesDef[];
}) {
	if (!active || !payload?.length || !label) return null;
	return (
		<div className="rounded-lg border border-slate-700/70 bg-slate-900/95 px-3 py-2 shadow-xl">
			<div className="text-[11px] font-medium text-slate-400">
				{bucketTooltipLabel(label, granularity)}
			</div>
			<div className="mt-1.5 space-y-1">
				{defs.map((def) => {
					const row = payload.find((p) => p.dataKey === def.key);
					if (!row || typeof row.value !== "number") return null;
					const value = row.value;
					return (
						<div key={def.key} className="flex items-center gap-2 text-xs">
							<span
								aria-hidden="true"
								className="h-0.5 w-3 shrink-0 rounded-full"
								style={{ backgroundColor: def.color }}
							/>
							<span className="font-semibold tabular-nums text-slate-50">
								{def.formatValue ? def.formatValue(value) : value.toLocaleString()}
							</span>
							<span className="text-slate-400">{def.name}</span>
						</div>
					);
				})}
			</div>
		</div>
	);
}

/**
 * The chart card frame: title + mode tabs on top, a definite-height plot
 * area (never flex-resolved — ResponsiveContainer inside a flex-resolved
 * height renders its marks at the pre-layout size and never recovers), the
 * empty state, and a legend for multi-series modes. `children` is the chart
 * itself, rendered only when there's data.
 */
export function StatsChartShell<M extends string>({
	title = "Growth",
	modes,
	mode,
	onModeChange,
	isEmpty,
	emptyText,
	isLoading = false,
	legendDefs,
	footer,
	children,
}: {
	title?: string;
	modes: { key: M; label: string }[];
	mode: M;
	onModeChange: (mode: M) => void;
	isEmpty: boolean;
	emptyText: string;
	isLoading?: boolean;
	/** Defs of the active mode — legend renders when it has ≥2 entries. */
	legendDefs: ChartSeriesDef[];
	/** Optional extra row under the legend. */
	footer?: ReactNode;
	children: ReactNode;
}) {
	return (
		<div className="flex h-full flex-col rounded-2xl border border-slate-800/70 bg-slate-900/40 p-4 sm:p-5">
			<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
				<h2 className="text-sm font-medium text-slate-200">{title}</h2>
				<div
					role="tablist"
					aria-label="Chart metric"
					className="flex rounded-lg border border-slate-800/70 bg-slate-950/60 p-0.5"
				>
					{modes.map((m) => (
						<button
							key={m.key}
							role="tab"
							aria-selected={mode === m.key}
							onClick={() => onModeChange(m.key)}
							className={cn(
								"rounded-md px-3 py-1 text-xs font-medium transition-colors",
								mode === m.key
									? "bg-slate-800 text-slate-50"
									: "text-slate-400 hover:text-slate-200",
							)}
						>
							{m.label}
						</button>
					))}
				</div>
			</div>

			<div
				className={cn(
					"relative h-[280px] w-full lg:h-[400px]",
					isLoading && "opacity-50 transition-opacity",
				)}
			>
				{isEmpty ? (
					<div className="flex h-full items-center justify-center text-sm text-slate-500">
						{emptyText}
					</div>
				) : (
					children
				)}
			</div>

			{legendDefs.length > 1 && !isEmpty && (
				<div className="mt-3 flex flex-wrap items-center gap-4">
					{legendDefs.map((def) => (
						<span key={def.key} className="inline-flex items-center gap-1.5 text-xs text-slate-400">
							<span
								aria-hidden="true"
								className="h-0.5 w-4 rounded-full"
								style={{ backgroundColor: def.color }}
							/>
							{def.name}
						</span>
					))}
				</div>
			)}

			{!isEmpty && footer}
		</div>
	);
}
