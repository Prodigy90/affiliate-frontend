"use client";

import { useState } from "react";
import { CalendarDays, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RangeCalendar } from "./RangeCalendar";
import {
	EXTENDED_PRESETS,
	RANGE_PRESETS,
	isExtendedRangeKey,
	isoDate,
} from "@/lib/stats/series";

/**
 * The analytics page's one range control — a 1:1 port of wasbot-frontend's
 * StatsRangeControl: fixed-width preset chips plus a popover picker with
 * named calendar periods and a custom range calendar. Everything on the
 * page scopes off this single selection surface.
 */
export function StatsRangeControl({
	rangeKey,
	customRange,
	activeLabel,
	onChange,
}: {
	/** Current selection key: a RANGE_PRESETS key, an extended key, or 'custom'. */
	rangeKey: string;
	/** Applied custom window when rangeKey === 'custom'. */
	customRange: { from: string; to: string } | null;
	/** Resolved label for the trigger chip when a picker range is active. */
	activeLabel: string;
	onChange: (rangeKey: string, customRange: { from: string; to: string } | null) => void;
}) {
	const [customOpen, setCustomOpen] = useState(false);
	const [draftFrom, setDraftFrom] = useState("");
	const [draftTo, setDraftTo] = useState("");

	const today = isoDate(new Date());
	const draftValid = !!draftFrom && !!draftTo && draftFrom <= draftTo && draftTo <= today;
	const pickerActive = rangeKey === "custom" || isExtendedRangeKey(rangeKey);

	const openCustomPicker = (open: boolean) => {
		if (open) {
			// Seed the calendar with the current custom selection only — a preset
			// window pre-painted on the grid reads as an accidental selection.
			setDraftFrom(rangeKey === "custom" && customRange ? customRange.from : "");
			setDraftTo(rangeKey === "custom" && customRange ? customRange.to : "");
		}
		setCustomOpen(open);
	};

	const applyCustomRange = () => {
		if (!draftValid) return;
		onChange("custom", { from: draftFrom, to: draftTo });
		setCustomOpen(false);
	};

	const selectExtended = (key: string) => {
		onChange(key, null);
		setCustomOpen(false);
	};

	const resetRange = () => {
		onChange("30d", null);
		setCustomOpen(false);
	};

	return (
		<div
			role="tablist"
			aria-label="Date range"
			className="flex rounded-lg border border-slate-800/70 bg-slate-950/60 p-0.5"
		>
			{RANGE_PRESETS.map((p) => (
				<button
					key={p.key}
					role="tab"
					aria-selected={rangeKey === p.key}
					onClick={() => onChange(p.key, null)}
					className={cn(
						"rounded-md px-2.5 py-1 text-xs font-medium transition-colors sm:px-3",
						rangeKey === p.key
							? "bg-teal-500/15 text-teal-300"
							: "text-slate-400 hover:text-slate-200",
					)}
				>
					{p.label}
				</button>
			))}
			<Popover open={customOpen} onOpenChange={openCustomPicker}>
				<PopoverTrigger asChild>
					<button
						role="tab"
						aria-selected={pickerActive}
						className={cn(
							"inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors sm:px-3",
							pickerActive
								? "bg-teal-500/15 text-teal-300"
								: "text-slate-400 hover:text-slate-200",
						)}
					>
						<CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
						{pickerActive ? activeLabel : "More"}
					</button>
				</PopoverTrigger>
				{/* Preset rows first, calendar behind a hairline — nobody fights
				    a calendar grid for "this month". */}
				<PopoverContent
					align="end"
					className="w-[300px] border-slate-700/70 bg-slate-900 p-0 shadow-xl"
				>
					<div className="grid grid-cols-2 gap-0.5 p-2">
						{EXTENDED_PRESETS.map((p) => (
							<button
								key={p.key}
								type="button"
								onClick={() => selectExtended(p.key)}
								className={cn(
									"flex items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors",
									rangeKey === p.key
										? "bg-teal-500/15 font-medium text-teal-300"
										: "text-slate-300 hover:bg-slate-800/70",
								)}
							>
								{p.label}
								{rangeKey === p.key && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
							</button>
						))}
					</div>

					<div className="border-t border-slate-800/70 p-3">
						<RangeCalendar
							from={draftFrom}
							to={draftTo}
							maxDate={today}
							onChange={(f, t) => {
								setDraftFrom(f);
								setDraftTo(t);
							}}
						/>
						<div className="mt-2.5 flex items-center gap-2">
							<span className="min-w-0 flex-1 truncate text-[11px] tabular-nums text-slate-500">
								{draftFrom
									? `${draftFrom}${draftTo ? ` → ${draftTo}` : " → pick an end date"}`
									: "Pick a start date"}
							</span>
							<button
								type="button"
								onClick={resetRange}
								className="rounded-lg border border-slate-700/70 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-800/70"
							>
								Reset
							</button>
							<button
								type="button"
								onClick={applyCustomRange}
								disabled={!draftValid}
								className="rounded-lg bg-teal-500 px-3 py-1.5 text-xs font-semibold text-slate-950 transition-colors hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-40"
							>
								Apply
							</button>
						</div>
					</div>
				</PopoverContent>
			</Popover>
		</div>
	);
}
