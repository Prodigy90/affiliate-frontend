"use client";

import { formatDistanceToNow } from "date-fns";
import { UserPlus } from "lucide-react";

import { useReferralEvents } from "@/lib/hooks/use-referral-events";

import type { ReferralEvent, ReferralEventType } from "./types";

/** Small colored marker per event type — compact stand-in for icon chips. */
const TYPE_DOT: Record<ReferralEventType, string> = {
	signup: "bg-teal-400",
	activation: "bg-violet-400",
	commission: "bg-amber-400",
};

function formatAmountNaira(amountKobo: number): string {
	const naira = amountKobo / 100;
	return `₦${naira.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}

/** Row title WITHOUT the amount — amounts render right-aligned in the row. */
function eventTitle(event: ReferralEvent): string {
	switch (event.type) {
		case "signup":
			return "New signup via your link";
		case "activation":
			return event.product_name
				? `Referral activated ${event.product_name}`
				: "Referral activated";
		case "commission":
			return event.product_name
				? `Commission from ${event.product_name}`
				: "Commission earned";
	}
}

function relativeTime(iso: string): string {
	try {
		return `${formatDistanceToNow(new Date(iso))} ago`;
	} catch {
		return "";
	}
}

function FeedShell({ children }: { children: React.ReactNode }) {
	return (
		<section className="rounded-xl border border-slate-800/70 bg-slate-900/60">
			<header className="flex items-baseline justify-between gap-3 border-b border-slate-800/50 px-4 py-3">
				<h2 className="text-sm font-semibold tracking-tight text-slate-50">
					Recent activity
				</h2>
				<span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
					Live
				</span>
			</header>
			{children}
		</section>
	);
}

function LoadingRows() {
	return (
		<ul className="divide-y divide-slate-800/50">
			{Array.from({ length: 3 }).map((_, idx) => (
				<li key={idx} className="flex items-center gap-3 px-4 py-2.5">
					<div className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-700" />
					<div className="h-3 flex-1 animate-pulse rounded bg-slate-800/70" />
					<div className="h-3 w-14 animate-pulse rounded bg-slate-800/60" />
				</li>
			))}
		</ul>
	);
}

function EmptyState() {
	return (
		<div className="flex flex-col items-center justify-center gap-2.5 px-4 py-7 text-center">
			<div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/10 text-teal-300 ring-1 ring-teal-500/30">
				<UserPlus className="h-4 w-4" aria-hidden="true" />
			</div>
			<p className="max-w-sm text-xs text-slate-400">
				No referral activity yet. Once someone signs up via your link,
				you&apos;ll see it here.
			</p>
		</div>
	);
}

function ErrorState() {
	return (
		<div className="px-4 py-3 text-center text-xs text-rose-200">
			Couldn&apos;t load activity. Refresh to try again.
		</div>
	);
}

function EventRow({ event }: { event: ReferralEvent }) {
	const amount =
		event.type === "commission" && event.amount_kobo != null
			? `+${formatAmountNaira(event.amount_kobo)}`
			: null;

	return (
		<li className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-slate-900/80">
			<span
				className={`h-1.5 w-1.5 shrink-0 rounded-full ${TYPE_DOT[event.type]}`}
				aria-hidden="true"
			/>
			<p className="min-w-0 flex-1 truncate text-sm text-slate-200">
				{eventTitle(event)}
			</p>
			{amount ? (
				<span className="shrink-0 font-mono text-xs font-semibold tabular-nums text-teal-300">
					{amount}
				</span>
			) : (
				<span className="shrink-0 text-[11px] text-slate-500">
					{relativeTime(event.occurred_at)}
				</span>
			)}
		</li>
	);
}

export function ActivityFeed() {
	const { data, isLoading, isError } = useReferralEvents();

	if (isLoading) {
		return (
			<FeedShell>
				<LoadingRows />
			</FeedShell>
		);
	}

	if (isError) {
		return (
			<FeedShell>
				<ErrorState />
			</FeedShell>
		);
	}

	const events = data?.events ?? [];
	if (events.length === 0) {
		return (
			<FeedShell>
				<EmptyState />
			</FeedShell>
		);
	}

	return (
		<FeedShell>
			<ul className="divide-y divide-slate-800/50">
				{events.map((event) => (
					<EventRow key={event.id} event={event} />
				))}
			</ul>
		</FeedShell>
	);
}
