"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Copy, Link2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { getReferralLinks } from "@/lib/api/affiliate";
import type { ReferralLinksListResponse } from "@/lib/types/affiliate";

/** Compact "your link" side card — eyebrow, link box, two small actions. */
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
		<div className="rounded-xl border border-slate-800/70 bg-slate-900/60 p-4">
			<p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
				Your link
			</p>

			{isLoading ? (
				<div className="mt-2.5 h-8 animate-pulse rounded-lg bg-slate-800/70" />
			) : isError ? (
				<p className="mt-2.5 text-xs text-amber-300/80">
					We couldn&apos;t load your link right now — refresh to try again.
				</p>
			) : firstLink ? (
				<div className="mt-2.5 flex min-w-0 items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2">
					<Link2 className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden="true" />
					<p className="min-w-0 flex-1 truncate font-mono text-xs text-teal-300">
						{firstLink.link_url}
					</p>
				</div>
			) : (
				<p className="mt-2.5 text-xs text-slate-500">
					Enroll in a product first — your link shows up here.
				</p>
			)}

			<div className="mt-3 flex flex-wrap items-center gap-2">
				{firstLink ? (
					<button
						type="button"
						onClick={handleCopy}
						className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
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
					className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-600 hover:text-slate-100"
				>
					{firstLink ? "Manage links" : "Enroll in a product"}
				</Link>
			</div>
		</div>
	);
}
