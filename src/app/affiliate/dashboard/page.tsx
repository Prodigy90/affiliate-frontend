"use client";

import { signIn } from "@/lib/auth-client";
import { ActivityFeed } from "@/components/activity-feed/ActivityFeed";
import { StatTiles } from "@/components/affiliate/StatTiles";
import { ShareLinkCard } from "@/components/affiliate/ShareLinkCard";
import { UpcomingPayoutCard } from "@/components/affiliate/UpcomingPayoutCard";
import { TopEarnersPanel } from "@/components/affiliate/TopEarnersPanel";
import { useEarnings } from "@/lib/hooks/use-earnings";
import { useAffiliate } from "@/lib/hooks/use-affiliate";

export default function AffiliateDashboardPage() {
	const { isLoading: authLoading, isAuthenticated, affiliate } = useAffiliate();
	const { data, isLoading, isError, error, refetch } = useEarnings();

	if (authLoading) {
		return (
			<div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
				<p className="text-sm text-slate-300">Checking your session...</p>
			</div>
		);
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
				<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<div
							key={i}
							className="h-28 animate-pulse rounded-xl border border-slate-800/60 bg-slate-900/60"
						/>
					))}
				</div>
				<div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
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

	return (
		<div className="space-y-6">
			{/* Greeting strip */}
			<header className="space-y-1.5">
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

			{/* Stat tiles row */}
			<StatTiles data={data} />

			{/* Activity feed (2/3) + side stack (1/3) */}
			<div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
				<ActivityFeed />
				<div className="grid gap-3">
					<ShareLinkCard />
					<UpcomingPayoutCard data={data} />
				</div>
			</div>

			{/* Leaderboard */}
			<TopEarnersPanel />
		</div>
	);
}
