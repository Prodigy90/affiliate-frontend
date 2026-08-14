/**
 * Range/bucket helpers for the analytics page — ported from
 * wasbot-frontend's `lib/status/series.ts` so the affiliate stats surface
 * keeps the exact same range semantics as the product's stats pages
 * (preset chips, named calendar periods, custom calendar ranges,
 * granularity auto-picked by span, ISO-Monday weeks, UTC bucket math).
 */

export type SeriesGranularity = "day" | "week" | "month";

/** Type guard for the picker's named-period keys. */
export function isExtendedRangeKey(key: string): key is ExtendedRangeKey {
	return EXTENDED_PRESETS.some((p) => p.key === key);
}

/**
 * Range presets — one control scoping the KPI tiles and the trend chart.
 * Bucket counts pair with a granularity so the chart always has a readable
 * number of marks: days up to a month, weeks up to six months, months
 * beyond.
 */
export interface RangePreset {
	key: RangeKey;
	label: string;
	/** Comparison copy, e.g. "vs previous 30 days". */
	compareLabel: string;
	granularity: SeriesGranularity;
	/** Buckets in the visible window. */
	buckets: number;
}

export type RangeKey = "7d" | "30d" | "3m" | "6m" | "12m";

export const RANGE_PRESETS: RangePreset[] = [
	{ key: "7d", label: "7D", compareLabel: "vs previous 7 days", granularity: "day", buckets: 7 },
	{ key: "30d", label: "30D", compareLabel: "vs previous 30 days", granularity: "day", buckets: 30 },
	{ key: "3m", label: "3M", compareLabel: "vs previous 3 months", granularity: "week", buckets: 13 },
	{ key: "6m", label: "6M", compareLabel: "vs previous 6 months", granularity: "week", buckets: 26 },
	{ key: "12m", label: "12M", compareLabel: "vs previous 12 months", granularity: "month", buckets: 12 },
];

/** UTC midnight for a Date's calendar day. */
function utcDay(d: Date): Date {
	return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Bucket start containing d — ISO-Monday weeks, month-first months. */
export function bucketStart(d: Date, granularity: SeriesGranularity): Date {
	const day = utcDay(d);
	if (granularity === "week") {
		const back = (day.getUTCDay() + 6) % 7;
		return new Date(day.getTime() - back * 86_400_000);
	}
	if (granularity === "month") {
		return new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), 1));
	}
	return day;
}

/** Step back n buckets from a bucket start. */
export function stepBack(start: Date, granularity: SeriesGranularity, n: number): Date {
	if (granularity === "month") {
		return new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() - n, 1));
	}
	const days = granularity === "week" ? 7 * n : n;
	return new Date(start.getTime() - days * 86_400_000);
}

export function isoDate(d: Date): string {
	return d.toISOString().slice(0, 10);
}

function parseISODate(iso: string): Date {
	return new Date(`${iso}T00:00:00Z`);
}

/** Step forward one bucket. */
export function nextBucket(start: Date, granularity: SeriesGranularity): Date {
	if (granularity === "month") {
		return new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
	}
	const days = granularity === "week" ? 7 : 1;
	return new Date(start.getTime() + days * 86_400_000);
}

/** Buckets spanned by [from, to] inclusive at a granularity. */
export function countBuckets(from: Date, to: Date, granularity: SeriesGranularity): number {
	let n = 0;
	const end = bucketStart(to, granularity);
	for (
		let b = bucketStart(from, granularity);
		b.getTime() <= end.getTime();
		b = nextBucket(b, granularity)
	) {
		n++;
		if (n > 400) break; // runaway guard, mirrors the backend cap
	}
	return n;
}

/**
 * A resolved page range — presets and custom windows normalize to this one
 * shape, so the tiles, chart, funnel, and product breakdown all scope off
 * the same object.
 */
export interface ActiveRange {
	key: string;
	/** Short chip label, e.g. "30D" or "12 Jun – 3 Jul". */
	label: string;
	compareLabel: string;
	granularity: SeriesGranularity;
	/** Buckets in the visible window. */
	buckets: number;
	/** Visible window, inclusive ISO dates. */
	from: string;
	to: string;
}

/** Resolve a preset relative to `now` (injectable for tests). */
export function resolvePresetRange(preset: RangePreset, now: Date): ActiveRange {
	const currentBucket = bucketStart(now, preset.granularity);
	const from = stepBack(currentBucket, preset.granularity, preset.buckets - 1);
	return {
		key: preset.key,
		label: preset.label,
		compareLabel: preset.compareLabel,
		granularity: preset.granularity,
		buckets: preset.buckets,
		from: isoDate(from),
		to: isoDate(utcDay(now)),
	};
}

/**
 * Resolve a custom [from, to] window (inclusive ISO dates). Granularity
 * auto-picks so the chart keeps a readable mark count: days up to ~6 weeks,
 * weeks up to ~6 months, months beyond.
 */
export function resolveCustomRange(fromISO: string, toISO: string): ActiveRange {
	const from = parseISODate(fromISO);
	const to = parseISODate(toISO);
	const days = Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1;
	const granularity: SeriesGranularity = days <= 45 ? "day" : days <= 190 ? "week" : "month";
	const shortFrom = bucketTickLabel(fromISO, "day");
	const shortTo = bucketTickLabel(toISO, "day");
	return {
		key: `custom:${fromISO}:${toISO}`,
		label: `${shortFrom} – ${shortTo}`,
		compareLabel: `vs previous ${days} day${days === 1 ? "" : "s"}`,
		granularity,
		buckets: countBuckets(from, to, granularity),
		from: fromISO,
		to: toISO,
	};
}

/**
 * Named calendar periods for the picker's preset rows — calendar-anchored
 * windows ("this month") that the fixed-width chips can't express. Each
 * resolves through resolveCustomRange so granularity auto-picks by span.
 */
export type ExtendedRangeKey =
	| "today"
	| "this_week"
	| "this_month"
	| "this_year"
	| "last_90d"
	| "all_time";

export const EXTENDED_PRESETS: { key: ExtendedRangeKey; label: string }[] = [
	{ key: "today", label: "Today" },
	{ key: "this_week", label: "This week" },
	{ key: "this_month", label: "This month" },
	{ key: "this_year", label: "This year" },
	{ key: "last_90d", label: "Last 90 days" },
	{ key: "all_time", label: "All time" },
];

/**
 * Resolve a named period relative to `now`. Weeks are ISO-Monday, matching
 * every bucket boundary on the page. "All time" is a 24-month horizon —
 * older than any affiliate-program data.
 */
export function resolveExtendedRange(key: ExtendedRangeKey, now: Date): ActiveRange {
	const day = utcDay(now);
	const to = isoDate(day);
	let from: Date;
	switch (key) {
		case "today":
			from = day;
			break;
		case "this_week":
			from = bucketStart(day, "week");
			break;
		case "this_month":
			from = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), 1));
			break;
		case "this_year":
			from = new Date(Date.UTC(day.getUTCFullYear(), 0, 1));
			break;
		case "last_90d":
			from = new Date(day.getTime() - 89 * 86_400_000);
			break;
		case "all_time":
			from = new Date(Date.UTC(day.getUTCFullYear() - 2, day.getUTCMonth(), 1));
			break;
	}
	const label = EXTENDED_PRESETS.find((p) => p.key === key)!.label;
	const resolved = resolveCustomRange(isoDate(from), to);
	return {
		...resolved,
		key,
		label,
		compareLabel: key === "all_time" ? "vs the period before" : resolved.compareLabel,
	};
}

/**
 * The range's bucket grid as ISO dates — used to zero-fill sparse API
 * series (the affiliate analytics endpoints GROUP BY date_trunc and skip
 * empty buckets; the chart wants a continuous axis). Period keys are ISO
 * dates truncated the same way (Monday weeks, month firsts), so
 * exact-match lookup against this grid is safe.
 */
export function bucketPeriods(range: ActiveRange): string[] {
	const out: string[] = [];
	const end = bucketStart(parseISODate(range.to), range.granularity);
	for (
		let b = bucketStart(parseISODate(range.from), range.granularity);
		b.getTime() <= end.getTime();
		b = nextBucket(b, range.granularity)
	) {
		out.push(isoDate(b));
		if (out.length > 400) break;
	}
	return out;
}

/** 0-100 rate, 0 (not NaN) on an empty denominator. */
export function safeRate(numerator: number, denominator: number): number {
	if (denominator <= 0) return 0;
	return (numerator / denominator) * 100;
}

/** Compact figure for axes/tiles: 12.4K, 1.2M. */
export function fmtCompact(value: number): string {
	if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
	if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
	return `${Math.round(value)}`;
}

/** Short x-axis tick for a bucket date, by granularity: "5 Jul" / "13 Jul" / "Jul". */
export function bucketTickLabel(date: string, granularity: SeriesGranularity): string {
	const d = new Date(`${date}T00:00:00Z`);
	const month = d.toLocaleString("en", { month: "short", timeZone: "UTC" });
	if (granularity === "month") return month;
	return `${d.getUTCDate()} ${month}`;
}

/** Fuller tooltip label: "Mon 13 Jul" / "Week of 13 Jul" / "July 2026". */
export function bucketTooltipLabel(date: string, granularity: SeriesGranularity): string {
	const d = new Date(`${date}T00:00:00Z`);
	if (granularity === "month") {
		return d.toLocaleString("en", { month: "long", year: "numeric", timeZone: "UTC" });
	}
	const short = `${d.getUTCDate()} ${d.toLocaleString("en", { month: "short", timeZone: "UTC" })}`;
	if (granularity === "week") return `Week of ${short}`;
	return `${d.toLocaleString("en", { weekday: "short", timeZone: "UTC" })} ${short}`;
}
