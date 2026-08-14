"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Compact single-month range calendar for the period picker — a 1:1 port of
 * wasbot-frontend's RangeCalendar (no library, just a 7-column grid). Click
 * once for the range start, again for the end; clicking before the start
 * restarts the selection. Future days are disabled. All date math is UTC to
 * match the page's bucket boundaries.
 */

const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

function iso(d: Date): string {
	return d.toISOString().slice(0, 10);
}

function monthTitle(view: Date): string {
	return `${view.toLocaleString("en", { month: "long", timeZone: "UTC" })} ${view.getUTCFullYear()}`;
}

/** All cells for a month view — leading/trailing days pad to full ISO-Monday weeks. */
function monthCells(view: Date): { date: Date; inMonth: boolean }[] {
	const first = new Date(Date.UTC(view.getUTCFullYear(), view.getUTCMonth(), 1));
	const start = new Date(first.getTime() - (((first.getUTCDay() + 6) % 7) * 86_400_000));
	const cells: { date: Date; inMonth: boolean }[] = [];
	for (let i = 0; i < 42; i++) {
		const date = new Date(start.getTime() + i * 86_400_000);
		cells.push({ date, inMonth: date.getUTCMonth() === view.getUTCMonth() });
	}
	// Drop a fully-out-of-month trailing week so short months stay compact.
	return cells.length && !cells[35].inMonth && !cells[41].inMonth ? cells.slice(0, 35) : cells;
}

export function RangeCalendar({
	from,
	to,
	maxDate,
	onChange,
}: {
	/** Selected range bounds, ISO dates — `to` may be empty mid-selection. */
	from: string;
	to: string;
	/** Latest selectable ISO date (today). */
	maxDate: string;
	onChange: (from: string, to: string) => void;
}) {
	const anchor = to || from || maxDate;
	const [view, setView] = useState(() => {
		const d = new Date(`${anchor}T00:00:00Z`);
		return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
	});

	const stepMonth = (delta: number) =>
		setView((v) => new Date(Date.UTC(v.getUTCFullYear(), v.getUTCMonth() + delta, 1)));

	const pick = (dayISO: string) => {
		if (!from || (from && to) || dayISO < from) {
			onChange(dayISO, "");
		} else {
			onChange(from, dayISO);
		}
	};

	const today = maxDate;

	return (
		<div>
			<div className="flex items-center justify-between px-1 pb-2">
				<button
					type="button"
					onClick={() => stepMonth(-1)}
					aria-label="Previous month"
					className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-800/70 hover:text-slate-200"
				>
					<ChevronLeft className="h-4 w-4" />
				</button>
				<span className="text-xs font-semibold text-slate-200">{monthTitle(view)}</span>
				<button
					type="button"
					onClick={() => stepMonth(1)}
					aria-label="Next month"
					className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-800/70 hover:text-slate-200"
				>
					<ChevronRight className="h-4 w-4" />
				</button>
			</div>

			<div className="grid grid-cols-7 gap-y-0.5 text-center">
				{WEEKDAYS.map((d) => (
					<span key={d} className="pb-1 text-[9px] font-semibold tracking-wider text-slate-600">
						{d}
					</span>
				))}
				{monthCells(view).map(({ date, inMonth }) => {
					const dayISO = iso(date);
					const disabled = dayISO > today;
					const isStart = dayISO === from;
					const isEnd = dayISO === (to || from);
					const inRange = !!from && !!to && dayISO > from && dayISO < to;
					const isToday = dayISO === today;
					return (
						<button
							key={dayISO}
							type="button"
							disabled={disabled}
							onClick={() => pick(dayISO)}
							className={cn(
								"mx-auto flex h-7 w-7 items-center justify-center rounded-md text-xs tabular-nums transition-colors",
								disabled && "cursor-not-allowed text-slate-700",
								!disabled && !inMonth && "text-slate-600 hover:bg-slate-800/70",
								!disabled && inMonth && "text-slate-300 hover:bg-slate-800/70",
								inRange && "rounded-none bg-teal-500/15 text-teal-200 hover:bg-teal-500/25",
								(isStart || isEnd) &&
									"bg-teal-500 font-semibold text-slate-950 hover:bg-teal-400",
								isToday && !isStart && !isEnd && !inRange && "ring-1 ring-inset ring-teal-500/50",
							)}
						>
							{date.getUTCDate()}
						</button>
					);
				})}
			</div>
		</div>
	);
}
