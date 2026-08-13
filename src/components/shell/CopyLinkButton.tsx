"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Link2 } from "lucide-react";
import { toast } from "sonner";

import { getReferralLinks } from "@/lib/api/affiliate";
import type { ReferralLinksListResponse } from "@/lib/types/affiliate";
import { useAffiliate } from "@/lib/hooks/use-affiliate";

/**
 * One-tap referral-link copy that lives in the nav chrome — the affiliate
 * equivalent of wasbot-frontend's dock-nav Upgrade button. Renders nothing
 * until the user is authed and actually has a link.
 */
export function CopyLinkButton({ compact = false }: { compact?: boolean }) {
	const { isAuthenticated } = useAffiliate();
	const [copied, setCopied] = useState(false);

	const { data } = useQuery<ReferralLinksListResponse, Error>({
		queryKey: ["referral-links", { page: 1, limit: 1 }],
		queryFn: () => getReferralLinks({ page: 1, limit: 1 }),
		enabled: isAuthenticated,
		staleTime: 60_000,
		retry: 0,
	});

	const link = data?.links?.[0]?.link_url;

	useEffect(() => {
		if (!copied) return;
		const t = setTimeout(() => setCopied(false), 2000);
		return () => clearTimeout(t);
	}, [copied]);

	if (!link) return null;

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(link);
			setCopied(true);
			toast.success("Referral link copied");
		} catch {
			toast.error("Couldn't copy — grab it from your dashboard");
		}
	};

	if (compact) {
		return (
			<button
				type="button"
				onClick={handleCopy}
				aria-label="Copy your referral link"
				className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors ${
					copied
						? "border-teal-500/40 bg-teal-500/15 text-teal-200"
						: "border-slate-700/70 bg-slate-800/60 text-slate-300 hover:border-slate-600"
				}`}
			>
				{copied ? (
					<Check className="h-3 w-3" aria-hidden="true" />
				) : (
					<Link2 className="h-3 w-3" aria-hidden="true" />
				)}
				{copied ? "Copied" : "Copy link"}
			</button>
		);
	}

	return (
		<button
			type="button"
			onClick={handleCopy}
			className={`group inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition ${
				copied
					? "bg-teal-500/15 text-teal-200"
					: "bg-slate-100 text-slate-950 hover:bg-white"
			}`}
		>
			{copied ? (
				<Check className="h-3.5 w-3.5" aria-hidden="true" />
			) : (
				<Link2 className="h-3.5 w-3.5" aria-hidden="true" />
			)}
			{copied ? "Copied" : "Copy link"}
		</button>
	);
}
