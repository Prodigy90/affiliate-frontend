"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
	ArrowRight,
	Banknote,
	CheckCircle2,
	Clapperboard,
	Link2,
	Send,
	UserPlus,
	X,
	type LucideIcon,
} from "lucide-react";

import { getReferralLinks } from "@/lib/api/affiliate";
import { getProfile } from "@/lib/api/settings";
import type { ReferralLinksListResponse } from "@/lib/types/affiliate";
import type { AffiliateProfile } from "@/lib/types/settings";
import { useSignups } from "@/lib/hooks/use-signups";
import { useAffiliate } from "@/lib/hooks/use-affiliate";

const DISMISSED_KEY = "affiliate:launchpad:dismissed";
/** Set by the Promo Kit page when the affiliate copies a caption. */
export const POSTED_KEY = "affiliate:launchpad:posted";
/** Set by the Promo Kit page on first visit. */
export const KIT_VISITED_KEY = "affiliate:launchpad:kit-visited";

interface Step {
	id: string;
	title: string;
	detail: string;
	href: string;
	cta: string;
	icon: LucideIcon;
	done: boolean;
}

/**
 * Onboarding launchpad for new affiliates — the affiliate counterpart of
 * wasbot-frontend's ActivationChecklist. Steps are derived from server truth
 * where possible (link exists, bank saved, first signup) and localStorage
 * markers set by the Promo Kit page for the parts we can't observe.
 */
export function PromoterLaunchpad() {
	const { isAuthenticated } = useAffiliate();

	// Lazy initializers read localStorage on the first client render — same
	// convention as wasbot-frontend's ActivationChecklist. Server renders with
	// dismissed=true so there's no SSR flash of the card.
	const readFlag = (key: string, serverDefault = false) => {
		if (typeof window === "undefined") return serverDefault;
		try {
			return window.localStorage.getItem(key) === "true";
		} catch {
			return serverDefault;
		}
	};
	const [dismissed, setDismissed] = useState<boolean>(() =>
		readFlag(DISMISSED_KEY, true),
	);
	const [kitVisited] = useState(() => readFlag(KIT_VISITED_KEY));
	const [posted] = useState(() => readFlag(POSTED_KEY));

	const { data: linksData } = useQuery<ReferralLinksListResponse, Error>({
		queryKey: ["referral-links", { page: 1, limit: 1 }],
		queryFn: () => getReferralLinks({ page: 1, limit: 1 }),
		enabled: isAuthenticated,
		staleTime: 60_000,
		retry: 0,
	});
	const { data: profile } = useQuery<AffiliateProfile, Error>({
		queryKey: ["settings-profile"],
		queryFn: () => getProfile(),
		enabled: isAuthenticated,
		staleTime: 60_000,
		retry: 0,
	});
	const { data: signupsData } = useSignups(1);

	const hasLink = (linksData?.links?.length ?? 0) > 0;
	const hasBank = Boolean(profile?.account_number && profile?.bank_code);
	const hasSignup = (signupsData?.total ?? 0) > 0;

	const steps: Step[] = useMemo(
		() => [
			{
				id: "link",
				title: "Get your referral link",
				detail: "One link, every signup credited to you.",
				href: "/affiliate/products",
				cta: "Get my link",
				icon: Link2,
				done: hasLink,
			},
			{
				id: "kit",
				title: "Pick a video from your Promo Kit",
				detail: "Finished ads, small enough for WhatsApp status.",
				href: "/affiliate/assets",
				cta: "Open Promo Kit",
				icon: Clapperboard,
				done: kitVisited || posted,
			},
			{
				id: "post",
				title: "Post it with your caption",
				detail: "Copy a caption — your link is already inside.",
				href: "/affiliate/assets",
				cta: "Grab a caption",
				icon: Send,
				done: posted,
			},
			{
				id: "bank",
				title: "Add your bank account",
				detail: "So payouts have somewhere to land.",
				href: "/affiliate/settings",
				cta: "Add account",
				icon: Banknote,
				done: hasBank,
			},
			{
				id: "signup",
				title: "First signup lands",
				detail: "From here every payment they make pays you.",
				href: "/affiliate/analytics",
				cta: "Watch analytics",
				icon: UserPlus,
				done: hasSignup,
			},
		],
		[hasLink, kitVisited, posted, hasBank, hasSignup],
	);

	const doneCount = steps.filter((s) => s.done).length;
	const allDone = doneCount === steps.length;
	const next = steps.find((s) => !s.done);

	// Wait for auth + at least the links query before rendering, so the card
	// doesn't flash mis-checked rows.
	if (!isAuthenticated || linksData === undefined) return null;
	if (dismissed) return null;

	if (allDone) {
		return (
			<motion.section
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.25 }}
				aria-label="Promoting — setup complete"
				className="relative overflow-hidden rounded-2xl border border-teal-500/25 bg-slate-900/60 p-4 sm:p-5"
			>
				<div className="absolute inset-x-0 top-0 h-px bg-teal-500/50" />
				<div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-teal-500/[0.06] blur-3xl" />
				<button
					type="button"
					onClick={() => {
						try {
							window.localStorage.setItem(DISMISSED_KEY, "true");
						} catch {
							// ignore
						}
						setDismissed(true);
					}}
					aria-label="Hide setup strip"
					className="absolute right-3 top-3 z-20 rounded-md p-1 text-slate-500 transition hover:bg-slate-800 hover:text-slate-200"
				>
					<X className="h-4 w-4" />
				</button>
				<div className="flex flex-wrap items-center gap-3 pr-10">
					<div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-300 ring-1 ring-teal-500/25">
						<CheckCircle2 className="h-5 w-5" aria-hidden="true" />
					</div>
					<div className="min-w-0">
						<div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-300">
							You&apos;re promoting
						</div>
						<div className="mt-0.5 text-sm font-semibold text-slate-50">
							First signup in. Every payment they make for 12 months pays you 10%.
						</div>
					</div>
				</div>
			</motion.section>
		);
	}

	return (
		<motion.section
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.25 }}
			aria-labelledby="launchpad-title"
			className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 sm:p-6"
		>
			<div className="absolute inset-x-0 top-0 h-px bg-teal-400 opacity-60" />
			<div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-teal-500/10 blur-2xl" />

			<div className="relative flex flex-col gap-6 lg:flex-row lg:items-start">
				{/* Pitch + next action */}
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-300">
						<span className="inline-block h-1.5 w-1.5 rounded-full bg-teal-400" />
						Start earning
					</div>
					<h2
						id="launchpad-title"
						className="mt-2 text-xl font-semibold tracking-tight text-slate-50 sm:text-2xl"
					>
						Get paid 10% of every payment your referrals make — for 12 months.
					</h2>
					<p className="mt-2 max-w-prose text-sm text-slate-400">
						One Premium referral is worth up to ₦24,000 over their first year.
						The videos and captions are already made — posting takes 2 minutes.
					</p>

					{next && (
						<Link
							href={next.href}
							className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-teal-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-teal-400"
						>
							{next.cta}
							<ArrowRight className="h-4 w-4" aria-hidden="true" />
						</Link>
					)}

					<div className="mt-5 flex items-center gap-3">
						<div className="flex gap-1" aria-label={`${doneCount} of ${steps.length} steps complete`}>
							{steps.map((s) => (
								<span
									key={s.id}
									className={`h-1.5 w-4 rounded-sm ${s.done ? "bg-teal-400" : "bg-slate-800"}`}
								/>
							))}
						</div>
						<span className="font-mono text-[11px] tabular-nums text-slate-400">
							{doneCount}
							<span className="text-slate-600">/{steps.length}</span>
						</span>
					</div>
				</div>

				{/* Step list */}
				<ol className="w-full space-y-1.5 lg:max-w-sm">
					{steps.map((step, idx) => {
						const isNext = next?.id === step.id;
						const Icon = step.icon;
						return (
							<li key={step.id}>
								<Link
									href={step.href}
									className={`group flex items-center gap-3 rounded-lg border px-3 py-2.5 transition ${
										step.done
											? "border-slate-800/60 bg-slate-950/40"
											: isNext
												? "border-teal-500/30 bg-slate-950/60 hover:border-teal-500/50"
												: "border-slate-800/80 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/80"
									}`}
								>
									<span
										className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition ${
											step.done
												? "bg-teal-400 text-slate-950"
												: "border border-slate-700 bg-slate-900 text-slate-500 group-hover:border-slate-500"
										}`}
										aria-hidden="true"
									>
										{step.done ? (
											<CheckCircle2 className="h-3.5 w-3.5" />
										) : (
											<Icon className="h-3.5 w-3.5" />
										)}
									</span>
									<span className="min-w-0 flex-1">
										<span
											className={`block truncate text-sm ${
												step.done
													? "text-slate-500 line-through decoration-slate-700"
													: "text-slate-200"
											}`}
										>
											{step.title}
										</span>
										{!step.done && (
											<span className="block truncate text-[11px] text-slate-500">
												{step.detail}
											</span>
										)}
									</span>
									<span className="font-mono text-[10px] tabular-nums text-slate-600">
										0{idx + 1}
									</span>
								</Link>
							</li>
						);
					})}
				</ol>
			</div>
		</motion.section>
	);
}
