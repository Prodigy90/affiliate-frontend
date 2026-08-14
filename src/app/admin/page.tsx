"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import {
	Area,
	Bar,
	CartesianGrid,
	ComposedChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { Banknote, HandCoins, Hourglass, Users } from "lucide-react";
import { KpiTile } from "@/components/affiliate/KpiTile";
import { StatsRangeControl } from "@/components/shared/StatsRangeControl";
import {
	CHART_GRID_STROKE,
	CHART_TICK_FILL,
	StatsChartShell,
	StatsChartTooltip,
	type ChartSeriesDef,
} from "@/components/shared/stats-chart";
import { useActiveRange } from "@/lib/hooks/use-active-range";
import { bucketPeriods, bucketTickLabel, fmtCompact, safeRate } from "@/lib/stats/series";
import { useAffiliate } from "@/lib/hooks/use-affiliate";
import {
	getAdminEarningsTrend,
	getAdminLeaderboard,
	getAdminOverview,
	getAdminSignupTrend,
} from "@/lib/api/admin-analytics";
import { formatInteger, formatNaira } from "@/lib/utils/format";

/**
 * Admin dashboard — the program-wide sibling of the affiliate Analytics
 * page, on the same stats grammar: one range control, a KPI bento row
 * (all-time program totals), the trend chart owning the left 2/3, and a
 * right rail with the top affiliates and the selected period's funnel.
 * One screen, no long scroll.
 */

const emptySubscribe = () => () => {};

const COLOR_EARNINGS = "#0d9488";
const COLOR_SIGNUPS = "#6366f1";

/** Trend amounts arrive in naira main units (the Go layer divides by 100). */
const fmtNairaMain = (v: number) => `₦${Math.round(v).toLocaleString("en-NG")}`;

type ChartMode = "earnings" | "signups";

const MODES: { key: ChartMode; label: string }[] = [
	{ key: "earnings", label: "Earnings" },
	{ key: "signups", label: "Signups" },
];

const SERIES_BY_MODE: Record<ChartMode, ChartSeriesDef[]> = {
	earnings: [
		{ key: "earnings", name: "Earned", color: COLOR_EARNINGS, formatValue: fmtNairaMain },
	],
	signups: [{ key: "signups", name: "Signups", color: COLOR_SIGNUPS }],
};

/** One quiet stat row in the right-rail period card: label, value, bar. */
function PeriodRow({
	dot,
	label,
	value,
	rate,
	width,
}: {
	dot: string;
	label: string;
	value: string;
	rate?: string;
	width: number;
}) {
	return (
		<div>
			<div className="flex items-baseline gap-2 text-xs">
				<span
					aria-hidden="true"
					className="h-2 w-2 shrink-0 self-center rounded-full"
					style={{ backgroundColor: dot }}
				/>
				<span className="text-slate-400">{label}</span>
				<span className="ml-auto font-semibold tabular-nums text-slate-50">{value}</span>
				{rate && (
					<span className="w-16 shrink-0 text-right text-[11px] tabular-nums text-slate-500">
						{rate}
					</span>
				)}
			</div>
			<div className="ml-4 mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-800/80">
				<div
					className="h-full rounded-full"
					style={{
						width: `${Math.max(2, Math.min(100, width))}%`,
						backgroundColor: dot,
						opacity: 0.75,
					}}
				/>
			</div>
		</div>
	);
}

export default function AdminDashboardPage() {
	const { isAuthenticated, isLoading: authLoading } = useAffiliate();

	// Hydration gate — same reasoning as the affiliate Analytics page: server
	// and client must agree on the skeleton for the first paint.
	const mounted = useSyncExternalStore(
		emptySubscribe,
		() => true,
		() => false,
	);

	const { rangeKey, customRange, range, setRange } = useActiveRange();
	const [mode, setMode] = useState<ChartMode>("earnings");

	const trendParams = {
		from_date: range.from,
		to_date: range.to,
		granularity: range.granularity,
	};
	const windowParams = { from_date: range.from, to_date: range.to };

	const {
		data: overview,
		isLoading: isLoadingOverview,
		error: overviewError,
	} = useQuery({
		queryKey: ["admin", "analytics", "overview", windowParams],
		queryFn: () => getAdminOverview(windowParams),
		enabled: isAuthenticated,
		staleTime: 30_000,
	});

	const {
		data: earningsTrend = [],
		isLoading: isLoadingTrend,
		isFetching: trendFetching,
		error: trendError,
	} = useQuery({
		queryKey: ["admin", "analytics", "earnings-trend", trendParams],
		queryFn: () => getAdminEarningsTrend(trendParams),
		enabled: isAuthenticated,
		staleTime: 30_000,
	});

	const {
		data: signupTrend = [],
		isLoading: isLoadingSignups,
		isFetching: signupsFetching,
		error: signupsError,
	} = useQuery({
		queryKey: ["admin", "analytics", "signup-trend", trendParams],
		queryFn: () => getAdminSignupTrend(trendParams),
		enabled: isAuthenticated,
		staleTime: 30_000,
	});

	const {
		data: leaderboard,
		isLoading: isLoadingLeaderboard,
		error: leaderboardError,
	} = useQuery({
		queryKey: ["admin", "leaderboard", { limit: 5 }],
		queryFn: () => getAdminLeaderboard({ limit: 5 }),
		enabled: isAuthenticated,
		staleTime: 30_000,
	});

	// Zero-fill the sparse trends onto the range's bucket grid so the chart
	// keeps a continuous axis (the API skips empty buckets).
	const chartData = useMemo(() => {
		const earningsByPeriod = new Map(earningsTrend.map((p) => [p.period, p.total_earnings]));
		const signupsByPeriod = new Map(signupTrend.map((p) => [p.period, p.signup_count]));
		return bucketPeriods(range).map((period) => ({
			period,
			earnings: earningsByPeriod.get(period) ?? 0,
			signups: signupsByPeriod.get(period) ?? 0,
		}));
	}, [earningsTrend, signupTrend, range]);

	const earnedSpark = useMemo(() => chartData.map((d) => d.earnings), [chartData]);

	const isLoading =
		!mounted ||
		authLoading ||
		isLoadingOverview ||
		isLoadingTrend ||
		isLoadingSignups ||
		isLoadingLeaderboard;
	const firstError = overviewError || trendError || signupsError || leaderboardError;

	if (firstError) {
		return (
			<div className="flex min-h-[60vh] items-center justify-center">
				<div className="text-center">
					<p className="text-red-400">Failed to load the admin dashboard</p>
					<p className="mt-2 text-sm text-slate-400">{firstError.message}</p>
				</div>
			</div>
		);
	}

	const chartLoading = isLoadingTrend || isLoadingSignups;
	const chartFetching = trendFetching || signupsFetching;
	const defs = SERIES_BY_MODE[mode];
	const chartEmpty =
		!chartLoading &&
		(mode === "earnings"
			? chartData.every((d) => d.earnings === 0)
			: chartData.every((d) => d.signups === 0));

	const currency = overview?.currency ?? "NGN";
	const allTime = overview?.all_time;
	const period = overview?.window;
	const entries = leaderboard?.entries ?? [];
	const topEarnings = Math.max(...entries.map((e) => e.total_earnings), 1);

	return (
		<div className="space-y-4">
			{/* Compact header — title left, the one range control right. */}
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="min-w-0">
					<p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-300/80">
						Admin
					</p>
					<h1 className="truncate text-xl font-semibold tracking-tight text-slate-50 sm:text-2xl">
						The program at a glance.
					</h1>
				</div>
				<StatsRangeControl
					rangeKey={rangeKey}
					customRange={customRange}
					activeLabel={range.label}
					onChange={setRange}
				/>
			</div>

			{isLoading ? (
				<div className="space-y-4" aria-busy="true">
					<div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
						{Array.from({ length: 4 }).map((_, i) => (
							<div
								key={i}
								className="h-28 animate-pulse rounded-xl border border-slate-800/60 bg-slate-900/60"
							/>
						))}
					</div>
					<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
						<div className="h-[420px] animate-pulse rounded-2xl border border-slate-800/60 bg-slate-900/60 lg:col-span-2" />
						<div className="space-y-4">
							<div className="h-[200px] animate-pulse rounded-2xl border border-slate-800/60 bg-slate-900/60" />
							<div className="h-[200px] animate-pulse rounded-2xl border border-slate-800/60 bg-slate-900/60" />
						</div>
					</div>
				</div>
			) : (
				<>
					{/* KPI bentos — program lifetime totals; the chart and the
					    period card below scope to the selected range. */}
					<div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
						<KpiTile
							label="Total earned"
							icon={HandCoins}
							hue="teal"
							accent
							value={formatNaira(allTime?.total_earned ?? 0, currency)}
							secondary="affiliate commissions, all-time"
							spark={earnedSpark}
						/>
						<KpiTile
							label="Total paid out"
							icon={Banknote}
							hue="sky"
							value={formatNaira(allTime?.total_paid ?? 0, currency)}
							secondary="completed payouts, all-time"
						/>
						<KpiTile
							label="Pending payouts"
							icon={Hourglass}
							hue="amber"
							value={formatNaira(allTime?.pending_payouts_amount ?? 0, currency)}
							secondary={`${formatInteger(allTime?.pending_payouts_count ?? 0)} request${(allTime?.pending_payouts_count ?? 0) === 1 ? "" : "s"} waiting`}
							href="/admin/payouts"
						/>
						<KpiTile
							label="Affiliates"
							icon={Users}
							hue="violet"
							value={formatInteger(allTime?.affiliates_total ?? 0)}
							secondary={`${formatInteger(allTime?.affiliates_earning ?? 0)} earning · ${formatInteger(allTime?.signups_total ?? 0)} signups referred`}
							href="/admin/affiliates"
						/>
					</div>

					{/* Main grid — chart owns the left 2/3; top affiliates + the
					    period funnel ride the right rail. */}
					<div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:grid-rows-[auto_1fr]">
						<div className="order-2 lg:order-none lg:col-span-2 lg:col-start-1 lg:row-span-2 lg:row-start-1">
							<StatsChartShell
								title="Trends"
								modes={MODES}
								mode={mode}
								onModeChange={setMode}
								isEmpty={chartEmpty}
								emptyText={
									mode === "earnings"
										? "No commissions credited in this period."
										: "No referred signups in this period."
								}
								isLoading={chartLoading || chartFetching}
								legendDefs={defs}
							>
								<ResponsiveContainer width="100%" height="100%">
									{/* key={mode} remounts the chart per view — recharts v3
									    carries a stale scale across children swaps. */}
									<ComposedChart
										key={mode}
										data={chartData}
										margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
									>
										<defs>
											<linearGradient id="adminEarningsFill" x1="0" y1="0" x2="0" y2="1">
												<stop offset="5%" stopColor={COLOR_EARNINGS} stopOpacity={0.25} />
												<stop offset="95%" stopColor={COLOR_EARNINGS} stopOpacity={0} />
											</linearGradient>
										</defs>
										<CartesianGrid stroke={CHART_GRID_STROKE} strokeWidth={1} vertical={false} />
										<XAxis
											dataKey="period"
											tickFormatter={(d: string) => bucketTickLabel(d, range.granularity)}
											tick={{ fill: CHART_TICK_FILL, fontSize: 11 }}
											axisLine={false}
											tickLine={false}
											minTickGap={24}
											interval="preserveStartEnd"
										/>
										<YAxis
											width={48}
											tick={{ fill: CHART_TICK_FILL, fontSize: 11 }}
											axisLine={false}
											tickLine={false}
											domain={[0, "auto"]}
											tickFormatter={(v: number) =>
												mode === "earnings" ? `₦${fmtCompact(v)}` : fmtCompact(v)
											}
											allowDecimals={false}
										/>
										<Tooltip
											cursor={
												mode === "earnings"
													? { stroke: "#475569", strokeWidth: 1 }
													: { fill: "#1e293b", opacity: 0.4 }
											}
											content={
												<StatsChartTooltip granularity={range.granularity} defs={defs} />
											}
										/>

										{/* No animation on any mark — recharts v3 animation
										    freezes mid-flight under StrictMode remounts. */}
										{mode === "earnings" && (
											<Area
												type="monotone"
												dataKey="earnings"
												stroke={COLOR_EARNINGS}
												strokeWidth={2}
												fill="url(#adminEarningsFill)"
												isAnimationActive={false}
											/>
										)}
										{mode === "signups" && (
											<Bar
												dataKey="signups"
												fill={COLOR_SIGNUPS}
												stroke="#020617"
												strokeWidth={2}
												maxBarSize={24}
												radius={[4, 4, 0, 0]}
												isAnimationActive={false}
											/>
										)}
									</ComposedChart>
								</ResponsiveContainer>
							</StatsChartShell>
						</div>

						{/* Top affiliates — all-time leaderboard, real identities. */}
						<div className="order-1 rounded-2xl border border-slate-800/70 bg-slate-900/40 p-4 lg:order-none lg:col-start-3 lg:row-start-1">
							<div className="flex items-baseline justify-between">
								<h2 className="text-sm font-medium text-slate-200">Top affiliates</h2>
								<span className="text-[11px] text-slate-500">all-time</span>
							</div>
							{entries.length === 0 ? (
								<p className="mt-3 text-sm text-slate-500">Nobody has earned yet.</p>
							) : (
								<div className="mt-3 space-y-3">
									{entries.map((e) => (
										<div key={e.affiliate_id}>
											<div className="flex items-center gap-2 text-xs">
												<span
													className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-semibold tabular-nums ${
														e.rank === 1
															? "bg-amber-500/15 text-amber-300"
															: "bg-slate-800/80 text-slate-400"
													}`}
												>
													{e.rank}
												</span>
												<span className="min-w-0 truncate font-medium text-slate-200">
													{e.name || e.email}
												</span>
												<span className="ml-auto shrink-0 font-semibold tabular-nums text-slate-50">
													{formatNaira(e.total_earnings, e.currency)}
												</span>
											</div>
											<div className="ml-7 mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-800/80">
												<div
													className="h-full rounded-full bg-teal-500/75"
													style={{
														width: `${Math.max(2, safeRate(e.total_earnings, topEarnings))}%`,
													}}
												/>
											</div>
										</div>
									))}
									{(leaderboard?.total_affiliates ?? 0) > entries.length && (
										<p className="text-[11px] text-slate-500">
											of {formatInteger(leaderboard?.total_affiliates ?? 0)} earning affiliates
										</p>
									)}
								</div>
							)}
						</div>

						{/* This period — the selected range's program funnel. */}
						<div className="order-3 rounded-2xl border border-slate-800/70 bg-slate-900/40 p-4 lg:order-none lg:col-start-3 lg:row-start-2">
							<h2 className="text-sm font-medium text-slate-200">This period</h2>
							{!period || (period.signups === 0 && period.earned === 0 && period.paid === 0) ? (
								<p className="mt-3 text-sm text-slate-500">
									No referral activity in this period.
								</p>
							) : (
								<div className="mt-3 space-y-3">
									<PeriodRow
										dot="#2dd4bf"
										label="Signups"
										value={formatInteger(period.signups)}
										width={100}
									/>
									<PeriodRow
										dot="#a78bfa"
										label="Converted"
										value={formatInteger(period.converted)}
										rate={`${formatInteger(Math.round(safeRate(period.converted, period.signups)))}% convert`}
										width={safeRate(period.converted, period.signups)}
									/>
									<PeriodRow
										dot="#fbbf24"
										label="Earned"
										value={formatNaira(period.earned, currency)}
										width={100}
									/>
									<PeriodRow
										dot="#34d399"
										label="Paid out"
										value={formatNaira(period.paid, currency)}
										rate={`${formatInteger(Math.round(safeRate(period.paid, period.earned)))}% paid out`}
										width={safeRate(period.paid, period.earned)}
									/>
								</div>
							)}
						</div>
					</div>
				</>
			)}
		</div>
	);
}
