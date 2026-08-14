"use client";

import { useQuery } from "@tanstack/react-query";
import { Banknote, Clock, HandCoins, UserPlus } from "lucide-react";

import { signIn } from "@/lib/auth-client";
import { PageSkeleton } from "@/components/page-skeleton";
import { ActivityFeed } from "@/components/activity-feed/ActivityFeed";
import { KpiTile } from "@/components/affiliate/KpiTile";
import { UpcomingPayoutCard } from "@/components/affiliate/UpcomingPayoutCard";
import { TopEarnersPanel } from "@/components/affiliate/TopEarnersPanel";
import { useEarnings } from "@/lib/hooks/use-earnings";
import { useFunnel } from "@/lib/hooks/use-funnel";
import { useAffiliate } from "@/lib/hooks/use-affiliate";
import { getSignupTrend } from "@/lib/api/analytics";
import { formatInteger, formatNaira } from "@/lib/utils/format";

/**
 * Percent change of current vs previous. null when there is no meaningful
 * base (previous 0 or missing) — the tile renders "new" instead of Infinity%.
 */
function pctDelta(current: number, previous: number): number | null {
	if (previous <= 0) return null;
	return ((current - previous) / previous) * 100;
}

/** Last 14 daily buckets — the current 7-day window and the 7 before it. */
function useSignupSpark(enabled: boolean) {
	const today = new Date();
	const from = new Date(today);
	from.setDate(today.getDate() - 13);

	return useQuery({
		queryKey: ["analytics", "signup-trend", "dashboard-spark"],
		queryFn: () =>
			getSignupTrend({
				from_date: from.toISOString().split("T")[0],
				to_date: today.toISOString().split("T")[0],
				granularity: "day",
			}),
		enabled,
		staleTime: 30_000,
	});
}

export default function AffiliateDashboardPage() {
	const { isLoading: authLoading, isAuthenticated, affiliate } = useAffiliate();
	const { data, isLoading, isError, error, refetch } = useEarnings();
	const { data: funnel } = useFunnel();
	const { data: signupTrend } = useSignupSpark(isAuthenticated);

	if (authLoading) {
		return <PageSkeleton />;
	}

	if (!isAuthenticated) {
		return (
			<div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
				<p className="text-sm text-slate-300">
					Sign in with Google to see your affiliate dashboard.
				</p>
				<button
					onClick={() =>
						signIn.social({
							provider: "google",
							callbackURL: "/affiliate/dashboard",
						})
					}
					className="inline-flex items-center gap-2 rounded-full bg-teal-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-sm transition-colors hover:bg-teal-400"
				>
					<span>Sign in</span>
				</button>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="space-y-6">
				<div className="space-y-2">
					<div className="h-4 w-32 animate-pulse rounded bg-slate-800/70" />
					<div className="h-7 w-64 animate-pulse rounded bg-slate-800/70" />
				</div>
				<div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<div
							key={i}
							className="h-28 animate-pulse rounded-xl border border-slate-800/60 bg-slate-900/60"
						/>
					))}
				</div>
				<div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
					<div className="h-72 animate-pulse rounded-xl border border-slate-800/60 bg-slate-900/60" />
					<div className="space-y-3">
						<div className="h-40 animate-pulse rounded-xl border border-slate-800/60 bg-slate-900/60" />
						<div className="h-40 animate-pulse rounded-xl border border-slate-800/60 bg-slate-900/60" />
					</div>
				</div>
			</div>
		);
	}

	if (isError || !data) {
		const message = (error as Error | null)?.message ?? "";
		return (
			<div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
				<p className="text-sm text-slate-300">
					We couldn&apos;t load your earnings right now.
				</p>
				{message && (
					<p className="max-w-md break-words text-[11px] text-slate-500">
						{message}
					</p>
				)}
				<button
					className="rounded-full bg-teal-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-sm hover:bg-teal-400 transition-colors"
					onClick={() => refetch()}
				>
					Try again
				</button>
			</div>
		);
	}

	const firstName = affiliate?.name?.split(" ")[0] ?? null;
	const currency = data.currency;

	// Signups tile: value from the funnel (default 30-day window); spark +
	// delta from the last two 7-day buckets of the daily signup trend, when
	// that series has loaded. Degrades to no chip / no sparkline otherwise.
	const funnelSignups = funnel?.signups ?? 0;
	const funnelConverted = funnel?.converted ?? 0;
	const spark = signupTrend?.map((p) => p.signup_count);
	let signupsDelta: number | null | undefined;
	if (signupTrend && signupTrend.length >= 14) {
		const previous7 = signupTrend.slice(0, 7).reduce((sum, p) => sum + p.signup_count, 0);
		const current7 = signupTrend.slice(7, 14).reduce((sum, p) => sum + p.signup_count, 0);
		signupsDelta = pctDelta(current7, previous7);
	}

	const conversionSecondary =
		funnel && funnelSignups > 0
			? `${formatInteger(Math.round(funnel.signup_to_converted_rate))}% of signups convert`
			: undefined;

	return (
		// On lg+ the page is sized to the viewport (minus the shell's dock/frame
		// padding) so the whole dashboard fits one screen — the activity feed
		// absorbs the leftover height and scrolls internally.
		<div className="flex flex-col gap-5 lg:h-[calc(100vh-8.5rem)] lg:min-h-[540px]">
			<header className="shrink-0 space-y-1.5">
				<p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-300/80">
					Affiliate dashboard
				</p>
				<h1 className="text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">
					{firstName ? `Welcome back, ${firstName}.` : "Welcome back."}
				</h1>
				<p className="max-w-xl text-sm text-slate-400">
					Here&apos;s what your referrals earned you, what&apos;s still
					clearing, and what&apos;s ready to cash out.
				</p>
			</header>

			{/* KPI grid */}
			<div className="grid shrink-0 grid-cols-2 gap-3 xl:grid-cols-4">
				<KpiTile
					label="Signups"
					icon={UserPlus}
					hue="sky"
					value={formatInteger(funnelSignups)}
					secondary="joined via your link"
					spark={spark}
					delta={signupsDelta}
					compareLabel="vs the previous 7 days"
				/>
				<KpiTile
					label="Paying"
					icon={HandCoins}
					hue="violet"
					value={formatInteger(funnelConverted)}
					secondary={conversionSecondary}
				/>
				<KpiTile
					label="Pending"
					icon={Clock}
					hue="amber"
					value={formatNaira(data.pending_balance, currency)}
					secondary="clears when the refund window closes"
				/>
				<KpiTile
					label="Ready to withdraw"
					icon={Banknote}
					hue="teal"
					accent
					value={formatNaira(data.available_for_payout, currency)}
					secondary="min ₦5,000 · tap to withdraw"
					href="/affiliate/earnings"
				/>
			</div>

			<div className="flex shrink-0 flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
				<p>
					Earned to date{" "}
					<b className="font-mono font-semibold tabular-nums text-slate-300">
						{formatNaira(data.total_earnings, currency)}
					</b>
				</p>
				<p>
					Paid out{" "}
					<b className="font-mono font-semibold tabular-nums text-slate-300">
						{formatNaira(data.paid_balance, currency)}
					</b>
				</p>
			</div>

			{/* Activity feed (2/3) + side stack (1/3) */}
			<div className="grid min-h-0 grid-cols-1 gap-3 lg:flex-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
				<div className="min-h-0 min-w-0">
					<ActivityFeed />
				</div>
				<div className="flex min-w-0 flex-col gap-3">
					<UpcomingPayoutCard data={data} />
					<TopEarnersPanel />
				</div>
			</div>
		</div>
	);
}
