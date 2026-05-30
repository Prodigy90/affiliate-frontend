"use client";

import { UserPlus } from "lucide-react";

import { useSignups } from "@/lib/hooks/use-signups";
import { formatDate, formatInteger } from "@/lib/utils/format";

/**
 * Dashboard card surfacing the affiliate's referred-signup conversions — the
 * top-of-funnel counterpart to commissions. Reads GET /api/v1/signups via
 * useSignups; self-contained so the dashboard just drops it into the side stack.
 */
export function ReferredSignupsCard() {
	const { data, isLoading, isError } = useSignups(4);

	const total = data?.total ?? 0;
	const recent = data?.signups ?? [];

	return (
		<div className="flex h-full flex-col rounded-xl border border-slate-800/70 bg-slate-900/60 p-5">
			<div className="flex items-center gap-2">
				<span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-300">
					<UserPlus className="h-4 w-4" aria-hidden="true" />
				</span>
				<p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
					Referred signups
				</p>
			</div>

			{isLoading ? (
				<div className="mt-3 space-y-2">
					<div className="h-7 w-16 animate-pulse rounded bg-slate-800/70" />
					<div className="h-3 w-44 animate-pulse rounded bg-slate-800/70" />
				</div>
			) : isError ? (
				<p className="mt-3 text-xs text-slate-500">
					Couldn&apos;t load signups right now.
				</p>
			) : total === 0 ? (
				<div className="mt-3">
					<p className="text-2xl font-semibold text-slate-50">0</p>
					<p className="mt-1 text-xs text-slate-400">
						No one&apos;s signed up through your link yet. Share it to
						start tracking conversions.
					</p>
				</div>
			) : (
				<div className="mt-3">
					<p className="text-2xl font-semibold text-slate-50">
						{formatInteger(total)}
					</p>
					<p className="mt-1 text-xs text-slate-400">
						{total === 1
							? "person signed up through your link."
							: "people signed up through your link."}
					</p>
					{recent.length > 0 && (
						<ul className="mt-3 space-y-1.5 border-t border-slate-800/60 pt-3">
							{recent.map((s) => (
								<li
									key={s.id}
									className="flex items-center justify-between text-[11px] text-slate-500"
								>
									<span className="text-slate-400">New signup</span>
									<span>{formatDate(s.occurred_at, "d MMM, HH:mm")}</span>
								</li>
							))}
						</ul>
					)}
				</div>
			)}
		</div>
	);
}
