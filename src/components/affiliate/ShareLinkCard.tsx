"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Copy, Link2, Share2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { getReferralLinks } from "@/lib/api/affiliate";
import type { ReferralLinksListResponse } from "@/lib/types/affiliate";

export function ShareLinkCard() {
	const [copied, setCopied] = useState(false);

	const { data, isLoading, isError } = useQuery<ReferralLinksListResponse, Error>({
		queryKey: ["referral-links", { page: 1, limit: 1 }],
		queryFn: () => getReferralLinks({ page: 1, limit: 1 }),
		staleTime: 60_000,
		retry: 0,
	});

	const firstLink = data?.links?.[0];

	useEffect(() => {
		if (!copied) return;
		const t = setTimeout(() => setCopied(false), 2000);
		return () => clearTimeout(t);
	}, [copied]);

	const handleCopy = async () => {
		if (!firstLink) return;
		try {
			await navigator.clipboard.writeText(firstLink.link_url);
			setCopied(true);
			toast.success("Link copied");
		} catch {
			toast.error("Couldn't copy — try the Products page");
		}
	};

	return (
		<div className="flex h-full flex-col justify-between rounded-xl border border-slate-800/70 bg-gradient-to-br from-teal-500/5 via-slate-900/60 to-slate-900/60 p-5">
			<div className="space-y-3">
				<div className="flex items-center gap-2">
					<span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-300">
						<Share2 className="h-4 w-4" aria-hidden="true" />
					</span>
					<p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
						Share your link
					</p>
				</div>

				<div>
					<h3 className="text-base font-semibold text-slate-50">
						One link. Every signup credited to you.
					</h3>
					<p className="mt-1 text-xs text-slate-400">
						Drop it in your status, your group, your bio. Every signup that
						lands here pays out for 12 monthly cycles.
					</p>
				</div>

				{isLoading ? (
					<div className="h-9 animate-pulse rounded-lg bg-slate-800/70" />
				) : isError ? (
					<p className="text-xs text-amber-300/80">
						We couldn&apos;t load your link right now — refresh to try again.
					</p>
				) : firstLink ? (
					<div className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2">
						<Link2 className="h-3.5 w-3.5 shrink-0 text-slate-500" />
						<p className="min-w-0 flex-1 truncate font-mono text-xs text-teal-300">
							{firstLink.link_url}
						</p>
					</div>
				) : (
					<p className="text-xs text-slate-500">
						Enroll in a product first — your link shows up here.
					</p>
				)}
			</div>

			<div className="mt-4 flex flex-wrap items-center gap-2">
				{firstLink ? (
					<button
						type="button"
						onClick={handleCopy}
						className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
							copied
								? "bg-teal-500/15 text-teal-200"
								: "bg-teal-500 text-slate-950 hover:bg-teal-400"
						}`}
					>
						{copied ? (
							<>
								<Check className="h-3.5 w-3.5" /> Copied
							</>
						) : (
							<>
								<Copy className="h-3.5 w-3.5" /> Copy link
							</>
						)}
					</button>
				) : null}
				<Link
					href="/affiliate/products"
					className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-900"
				>
					{firstLink ? "Manage links" : "Enroll in a product"}
				</Link>
			</div>
		</div>
	);
}
