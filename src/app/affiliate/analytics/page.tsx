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
import { HandCoins, Percent, UserPlus, Users } from "lucide-react";
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
	getEarningsTrend,
	getProductPerformance,
	getConversionMetrics,
	getFunnel,
	getSignupTrend,
} from "@/lib/api/analytics";
import { formatInteger, formatNaira } from "@/lib/utils/format";

/**
 * Analytics — the affiliate sibling of wasbot-frontend's stats pages, on
 * the same grammar: one range control (preset chips + calendar picker)
 * scoping everything, a KPI bento row, a big trend chart owning the left
 * 2/3, and a quiet right rail (funnel + product split). One screen, no
 * long scroll.
 *
 * Chart mark colors follow the wasbot dataviz picks against #020617:
 * teal #0d9488 for money (the hero metric), indigo #6366f1 for signups.
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

/** One quiet row in the right-rail funnel: label, value, proportion bar. */
function FunnelRow({
	dot,
	label,
	value,
	rate,
	width,
}: {
	dot: string;
	label: string;
	value: string;
	/** Optional stage-to-stage caption, e.g. "38% convert". */
	rate?: string;
	/** Bar width 0–100. */
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

export default function AnalyticsPage() {
	const { isAuthenticated, isLoading: authLoading } = useAffiliate();

	// Hydration gate: the server (and the prerendered static shell) resolves
	// auth and the disabled queries as "not loading" and bakes the loaded
	// branch, while the client's first paint starts loading — so gate on
	// hydration, where both sides see the server snapshot (false) and agree
	// on the skeleton. React re-renders with the client snapshot right after.
	const mounted = useSyncExternalStore(
		emptySubscribe,
		() => true,
		() => false,
	);

	// One resolved range object scopes everything on the page. Granularity
	// auto-picks from the span — no separate granularity selector.
	const { rangeKey, customRange, range, setRange } = useActiveRange();
	const [mode, setMode] = useState<ChartMode>("earnings");

	const trendParams = {
		from_date: range.from,
		to_date: range.to,
		granularity: range.granularity,
	};
	const windowParams = { from_date: range.from, to_date: range.to };

	const {
		data: earningsTrend = [],
		isLoading: isLoadingTrend,
		isFetching: trendFetching,
		error: trendError,
	} = useQuery({
		queryKey: ["analytics", "earnings-trend", trendParams],
		queryFn: () => getEarningsTrend(trendParams),
		enabled: isAuthenticated,
		staleTime: 30_000,
	});

	const {
		data: signupTrend = [],
		isLoading: isLoadingSignups,
		isFetching: signupsFetching,
		error: signupsError,
	} = useQuery({
		queryKey: ["analytics", "signup-trend", trendParams],
		queryFn: () => getSignupTrend(trendParams),
		enabled: isAuthenticated,
		staleTime: 30_000,
	});

	const {
		data: productPerformance = [],
		isLoading: isLoadingProducts,
		error: productsError,
	} = useQuery({
		queryKey: ["analytics", "product-performance", windowParams],
		queryFn: () => getProductPerformance(windowParams),
		enabled: isAuthenticated,
		staleTime: 30_000,
	});

	const {
		data: conversionMetrics,
		isLoading: isLoadingConversions,
		error: conversionsError,
	} = useQuery({
		queryKey: ["analytics", "conversion-metrics", windowParams],
		queryFn: () => getConversionMetrics(windowParams),
		enabled: isAuthenticated,
		staleTime: 30_000,
	});

	const {
		data: funnel,
		isLoading: isLoadingFunnel,
		error: funnelError,
	} = useQuery({
		queryKey: ["analytics", "funnel", windowParams],
		queryFn: () => getFunnel(windowParams),
		enabled: isAuthenticated,
		staleTime: 30_000,
	});

	// Zero-fill both sparse trends onto the range's bucket grid so the chart
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
	const signupSpark = useMemo(() => chartData.map((d) => d.signups), [chartData]);

	const isLoading =
		!mounted ||
		authLoading ||
		isLoadingTrend ||
		isLoadingProducts ||
		isLoadingConversions ||
		isLoadingFunnel ||
		isLoadingSignups;
	const firstError =
		trendError || productsError || conversionsError || funnelError || signupsError;

	if (firstError) {
		return (
			<div className="flex min-h-[60vh] items-center justify-center">
				<div className="text-center">
					<p className="text-red-400">Failed to load analytics data</p>
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

	const currency = funnel?.currency ?? "NGN";
	const productMax = Math.max(...productPerformance.map((p) => p.total_commissions), 1);
	const topProducts = productPerformance.slice(0, 4);

	return (
		<div className="space-y-4">
			{/* Compact header — title left, the one range control right. */}
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="min-w-0">
					<p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-300/80">
						Analytics
					</p>
					<h1 className="truncate text-xl font-semibold tracking-tight text-slate-50 sm:text-2xl">
						Your referral engine.
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
					{/* KPI bentos — signups/converted/earned scope to the selected
					    range; conversion rate is the program's all-time figure. */}
					<div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
						<KpiTile
							label="Signups"
							icon={UserPlus}
							hue="violet"
							value={formatInteger(funnel?.signups ?? 0)}
							secondary="joined via your link"
							spark={signupSpark}
						/>
						<KpiTile
							label="Converted"
							icon={Users}
							hue="sky"
							value={formatInteger(funnel?.converted ?? 0)}
							secondary="became paying customers"
						/>
						<KpiTile
							label="Conversion rate"
							icon={Percent}
							hue="amber"
							value={`${(conversionMetrics?.conversion_rate ?? 0).toFixed(1)}%`}
							secondary="all-time, across referrals"
						/>
						<KpiTile
							label="Earned"
							icon={HandCoins}
							hue="teal"
							accent
							value={formatNaira(funnel?.earning ?? 0, currency)}
							secondary="commission in this period"
							spark={earnedSpark}
						/>
					</div>

					{/* Main grid — chart owns the left 2/3; funnel + product split
					    ride the right rail. On mobile the funnel comes first. */}
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
											<linearGradient id="affEarningsFill" x1="0" y1="0" x2="0" y2="1">
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
												fill="url(#affEarningsFill)"
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

						{/* Funnel — signups → paying → earned → paid, one quiet card. */}
						<div className="order-1 rounded-2xl border border-slate-800/70 bg-slate-900/40 p-4 lg:order-none lg:col-start-3 lg:row-start-1">
							<h2 className="text-sm font-medium text-slate-200">Funnel</h2>
							{!funnel || (funnel.signups === 0 && funnel.earning === 0) ? (
								<p className="mt-3 text-sm text-slate-500">
									No referral activity in this period.
								</p>
							) : (
								<div className="mt-3 space-y-3">
									<FunnelRow
										dot="#2dd4bf"
										label="Signups"
										value={formatInteger(funnel.signups)}
										width={100}
									/>
									<FunnelRow
										dot="#a78bfa"
										label="Converted"
										value={formatInteger(funnel.converted)}
										rate={`${formatInteger(Math.round(funnel.signup_to_converted_rate))}% convert`}
										width={safeRate(funnel.converted, funnel.signups)}
									/>
									<FunnelRow
										dot="#fbbf24"
										label="Earned"
										value={formatNaira(funnel.earning, currency)}
										width={100}
									/>
									<FunnelRow
										dot="#34d399"
										label="Paid out"
										value={formatNaira(funnel.paid, currency)}
										rate={`${formatInteger(Math.round(funnel.earning_to_paid_rate))}% paid out`}
										width={safeRate(funnel.paid, funnel.earning)}
									/>
								</div>
							)}
						</div>

						{/* By product — how the range's commissions split. */}
						<div className="order-3 rounded-2xl border border-slate-800/70 bg-slate-900/40 p-4 lg:order-none lg:col-start-3 lg:row-start-2">
							<h2 className="text-sm font-medium text-slate-200">By product</h2>
							{topProducts.length === 0 ? (
								<p className="mt-3 text-sm text-slate-500">
									No commissions by product in this period.
								</p>
							) : (
								<div className="mt-3 space-y-3">
									{topProducts.map((p) => (
										<div key={p.product_id}>
											<div className="flex items-baseline gap-2 text-xs">
												<span className="min-w-0 truncate text-slate-400">
													{p.product_name}
												</span>
												<span className="ml-auto shrink-0 font-semibold tabular-nums text-slate-50">
													{fmtNairaMain(p.total_commissions)}
												</span>
												<span className="w-16 shrink-0 text-right text-[11px] tabular-nums text-slate-500">
													{formatInteger(p.commission_count)} sale
													{p.commission_count === 1 ? "" : "s"}
												</span>
											</div>
											<div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-800/80">
												<div
													className="h-full rounded-full bg-teal-500/75"
													style={{
														width: `${Math.max(2, safeRate(p.total_commissions, productMax))}%`,
													}}
												/>
											</div>
										</div>
									))}
									{productPerformance.length > topProducts.length && (
										<p className="text-[11px] text-slate-500">
											+{productPerformance.length - topProducts.length} more product
											{productPerformance.length - topProducts.length === 1 ? "" : "s"}
										</p>
									)}
								</div>
							)}
						</div>
					</div>
				</>
			)}
		</div>
	);
}
