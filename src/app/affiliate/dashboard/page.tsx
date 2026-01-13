"use client";

import Lottie from "react-lottie-player";
import { signIn } from "@/lib/auth-client";
import { formatCurrency, formatInteger } from "@/lib/utils/format";
import { StatCard } from "@/components/stat-card";
import { useEarnings } from "@/lib/hooks/use-earnings";
import { useAffiliate } from "@/lib/hooks/use-affiliate";

import { LOTTIE_DASHBOARD_WELCOME } from "@/lib/constants/lottie";

export default function AffiliateDashboardPage() {
  const { isLoading: authLoading, isAuthenticated } = useAffiliate();
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
              callbackURL: "/affiliate/dashboard"
            })
          }
          className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-sm transition-colors hover:bg-emerald-400"
        >
          <span>Sign in</span>
        </button>
      </div>
    );
  }

	if (isLoading) {
		return (
			<div className="space-y-8">
				<section className="grid gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)] items-center">
					<div className="space-y-3">
						<div className="h-5 w-40 animate-pulse rounded bg-slate-800/70" />
						<div className="h-9 w-64 animate-pulse rounded bg-slate-800/70" />
						<div className="h-4 w-80 animate-pulse rounded bg-slate-800/60" />
					</div>
					<div className="flex justify-center">
						<div className="h-40 w-40 animate-pulse rounded-full bg-slate-800/70" />
					</div>
				</section>
				<section className="grid gap-4 md:grid-cols-3">
					{Array.from({ length: 3 }).map((_, idx) => (
						<div
							key={idx}
							className="h-28 animate-pulse rounded-xl border border-slate-800/60 bg-slate-900/60"
						/>
					))}
				</section>
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
					className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-sm hover:bg-emerald-400 transition-colors"
					onClick={() => refetch()}
				>
					Try again
				</button>
			</div>
		);
	}

	const currency = data.currency;

	return (
		<div className="space-y-8">
			<section className="grid gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)] items-center">
				<div className="space-y-3">
					<p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400/80">
						Affiliate dashboard
					</p>
					<h1 className="text-2xl font-semibold tracking-tight text-slate-50 md:text-3xl">
						Track your referrals, earnings, and payouts in one place.
					</h1>
					<p className="max-w-xl text-sm text-slate-300">
						See how much you&apos;ve earned, what&apos;s pending, what&apos;s already been paid
						out, and how much is currently available for payout after refunds.
					</p>
				</div>
				<div className="flex justify-center">
					<Lottie
						play
						loop
						path={LOTTIE_DASHBOARD_WELCOME}
						style={{ height: 180, width: 180 }}
					/>
				</div>
			</section>
			<section className="grid gap-4 md:grid-cols-3">
				<StatCard
					title="Total earned"
					value={formatCurrency(data.total_earnings, currency)}
					accent="from-emerald-500/20 to-emerald-500/5"
				/>
				<StatCard
					title="Pending balance"
					value={formatCurrency(data.pending_balance, currency)}
				/>
				<StatCard
					title="Paid out"
					value={formatCurrency(data.paid_balance, currency)}
				/>
			</section>
			<section className="grid gap-4 md:grid-cols-3">
				<StatCard
					title="Debit (refunds after payout)"
					value={formatCurrency(data.debit_balance, currency)}
				/>
				<StatCard
					title="Available for payout"
					value={formatCurrency(data.available_for_payout, currency)}
					accent="from-sky-500/25 to-sky-500/5"
				/>
				<StatCard
					title="Referral performance"
					value={`${formatInteger(data.successful_referrals)} / ${formatInteger(
						data.total_referrals,
					)}`}
					subtitle="successful / total"
				/>
			</section>
		</div>
	);
}
