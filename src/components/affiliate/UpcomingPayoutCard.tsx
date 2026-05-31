import Link from "next/link";
import { ArrowRight, Wallet } from "lucide-react";

import type { EarningsSummary } from "@/lib/types/affiliate";
import { formatCurrency } from "@/lib/utils/format";
import { MIN_PAYOUT_KOBO } from "@/lib/constants/payouts";

export function UpcomingPayoutCard({ data }: { data: EarningsSummary }) {
	const currency = data.currency;
	const available = data.available_for_payout;
	const meetsMin = available >= MIN_PAYOUT_KOBO;
	const remainingToMin = Math.max(0, MIN_PAYOUT_KOBO - available);

	return (
		<div className="flex h-full flex-col justify-between rounded-xl border border-slate-800/70 bg-slate-900/60 p-5">
			<div className="space-y-3">
				<div className="flex items-center gap-2">
					<span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-300">
						<Wallet className="h-4 w-4" aria-hidden="true" />
					</span>
					<p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
						Next payout
					</p>
				</div>

				<div>
					<p className="text-2xl font-semibold text-slate-50">
						{formatCurrency(available, currency)}
					</p>
					<p className="mt-1 text-xs text-slate-400">
						{meetsMin
							? "Ready to withdraw whenever you are."
							: `${formatCurrency(remainingToMin, currency)} more until you can cash out (₦5,000 minimum).`}
					</p>
				</div>
			</div>

			<Link
				href="/affiliate/payouts"
				className={`mt-4 inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
					meetsMin
						? "bg-amber-500 text-slate-950 hover:bg-amber-400"
						: "border border-slate-700 bg-slate-900/60 text-slate-200 hover:border-slate-600 hover:bg-slate-900"
				}`}
			>
				{meetsMin ? "Request payout" : "See payout history"}
				<ArrowRight className="h-3.5 w-3.5" />
			</Link>
		</div>
	);
}
