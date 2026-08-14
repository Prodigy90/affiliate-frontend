import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { EarningsSummary } from "@/lib/types/affiliate";
import { formatNaira } from "@/lib/utils/format";
import { MIN_PAYOUT_KOBO } from "@/lib/constants/payouts";

/** Compact next-payout side card — eyebrow, amount, one-line hint, text CTA. */
export function UpcomingPayoutCard({ data }: { data: EarningsSummary }) {
	const currency = data.currency;
	const available = data.available_for_payout;
	const meetsMin = available >= MIN_PAYOUT_KOBO;
	const remainingToMin = Math.max(0, MIN_PAYOUT_KOBO - available);

	return (
		<div className="rounded-xl border border-slate-800/70 bg-slate-900/60 p-4">
			<div className="flex items-baseline justify-between gap-3">
				<p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
					Next payout
				</p>
				<p className="font-mono text-base font-semibold tabular-nums text-slate-50">
					{formatNaira(available, currency)}
				</p>
			</div>
			<p className="mt-1.5 text-[11px] text-slate-500">
				{meetsMin
					? "Ready to withdraw whenever you are."
					: `${formatNaira(remainingToMin, currency)} more until you can cash out (₦5,000 minimum).`}
			</p>
			<Link
				href="/affiliate/earnings"
				className={`mt-2.5 inline-flex items-center gap-1 text-xs font-semibold transition ${
					meetsMin
						? "text-teal-300 hover:text-teal-200"
						: "text-slate-400 hover:text-slate-200"
				}`}
			>
				{meetsMin ? "Request payout" : "See payout history"}
				<ArrowRight className="h-3 w-3" aria-hidden="true" />
			</Link>
		</div>
	);
}
