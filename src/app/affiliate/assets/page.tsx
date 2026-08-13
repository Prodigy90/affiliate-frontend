"use client";

import { useEffect, useState } from "react";
import { Check, Clock, Copy, Download, HardDrive, MessageCircle, Play } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { signIn } from "@/lib/auth-client";
import { PageSkeleton } from "@/components/page-skeleton";
import { ShareLinkCard } from "@/components/affiliate/ShareLinkCard";
import {
	KIT_VISITED_KEY,
	POSTED_KEY,
} from "@/components/affiliate/PromoterLaunchpad";
import { useAffiliate } from "@/lib/hooks/use-affiliate";
import { getReferralLinks } from "@/lib/api/affiliate";
import type { ReferralLinksListResponse } from "@/lib/types/affiliate";

const VIDEO_BASE = "https://wasbot.app/videos/promo-kit";

type PromoVideo = {
	file: string;
	title: string;
	bestFor: string;
	duration: string;
	size: string;
};

type VideoSection = {
	heading: string;
	sub: string;
	videos: PromoVideo[];
};

const VIDEO_SECTIONS: VideoSection[] = [
	{
		heading: "The pitch",
		sub: "Short, finished ads. Post one to your status or story as-is.",
		videos: [
			{
				file: "wasbot-overview",
				title: "WASBOT in 33 seconds",
				bestFor: "The all-rounder. Works for any audience.",
				duration: "0:33",
				size: "5.5MB",
			},
			{
				file: "phone-free-hook-1",
				title: "Post without your phone (hook 1)",
				bestFor: "People tired of posting status by hand.",
				duration: "0:27",
				size: "7.7MB",
			},
			{
				file: "phone-free-hook-2",
				title: "Post without your phone (hook 2)",
				bestFor: "Same ad, different opening line.",
				duration: "0:36",
				size: "9.8MB",
			},
			{
				file: "phone-free-hook-3",
				title: "Post without your phone (hook 3)",
				bestFor: "Same ad, third opening line.",
				duration: "0:35",
				size: "9.2MB",
			},
			{
				file: "phone-free-full",
				title: "Post without your phone (full cut)",
				bestFor: "The longer version with the full walkthrough.",
				duration: "0:52",
				size: "12.3MB",
			},
		],
	},
	{
		heading: "Feature deep-dives",
		sub: "Longer cuts that sell one feature properly. Good for groups and DMs.",
		videos: [
			{
				file: "contacts-wedge",
				title: "Contacts & audience building",
				bestFor: "Audiences that sell to saved and unsaved contacts.",
				duration: "1:23",
				size: "10.1MB",
			},
			{
				file: "groups-wedge",
				title: "Group posting on autopilot",
				bestFor: "Vendors who advertise in plenty groups daily.",
				duration: "1:22",
				size: "8.8MB",
			},
			{
				file: "autoresponder-wedge",
				title: "Auto-replies that close sales",
				bestFor: "Anyone drowning in repeated DM questions.",
				duration: "1:01",
				size: "9.6MB",
			},
		],
	},
	{
		heading: "Quick teasers",
		sub: "Tiny files, quick hits. Perfect between your normal status posts.",
		videos: [
			{
				file: "status-stats-teaser",
				title: "Status stats teaser",
				bestFor: "Teasing who-viewed-your-status analytics.",
				duration: "0:18",
				size: "2.5MB",
			},
			{
				file: "status-views-teaser",
				title: "Know your real audience",
				bestFor: "The status views hook, short and sharp.",
				duration: "0:22",
				size: "1.7MB",
			},
			{
				file: "groups-stats-teaser",
				title: "Feature map teaser",
				bestFor: "Showing the breadth of WASBOT in 15 seconds.",
				duration: "0:15",
				size: "1.5MB",
			},
		],
	},
];

const FALLBACK_LINK = "https://wasbot.app";

const buildCaptions = (link: string) => [
	{
		label: "Status caption",
		hint: "Pair it with any video above.",
		text: `I no dey post status by hand again. WASBOT posts my status and group adverts for me, even when my phone is off. Free for 7 days, no card needed: ${link}`,
	},
	{
		label: "Group post",
		hint: "For seller and vendor groups.",
		text: `If you sell on WhatsApp, check this out. Schedule your status, post to all your groups at once, auto-reply your DMs, and see who actually views your status. It's called WASBOT. 7-day free trial: ${link}`,
	},
	{
		label: "DM reply",
		hint: "For when someone asks how you post like this.",
		text: `It's called WASBOT. It posts my status and group adverts automatically from the cloud, so my phone can even be off. You can try it free for 7 days: ${link}`,
	},
];

function CopyButton({
	text,
	small,
	onCopied,
}: {
	text: string;
	small?: boolean;
	onCopied?: () => void;
}) {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			toast.success("Copied");
			onCopied?.();
			setTimeout(() => setCopied(false), 2000);
		} catch {
			toast.error("Couldn't copy");
		}
	};

	return (
		<button
			type="button"
			onClick={handleCopy}
			className={`inline-flex items-center gap-1.5 rounded-lg font-semibold transition ${
				small ? "px-2.5 py-1.5 text-[11px]" : "px-3 py-2 text-xs"
			} ${
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
					<Copy className="h-3.5 w-3.5" /> Copy
				</>
			)}
		</button>
	);
}

function VideoCard({ video }: { video: PromoVideo }) {
	const [playing, setPlaying] = useState(false);
	const src = `${VIDEO_BASE}/${video.file}.mp4`;
	const poster = `${VIDEO_BASE}/posters/${video.file}.jpg`;

	return (
		<div className="flex flex-col overflow-hidden rounded-xl border border-slate-800/70 bg-slate-900/60">
			<div className="relative aspect-[9/16] max-h-72 w-full bg-slate-950">
				{playing ? (
					<video
						src={src}
						poster={poster}
						controls
						autoPlay
						playsInline
						className="h-full w-full object-contain"
					/>
				) : (
					<button
						type="button"
						onClick={() => setPlaying(true)}
						className="group h-full w-full"
						aria-label={`Preview ${video.title}`}
					>
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							src={poster}
							alt=""
							loading="lazy"
							className="h-full w-full object-cover opacity-80 transition group-hover:opacity-100"
						/>
						<span className="absolute inset-0 flex items-center justify-center">
							<span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-950/70 text-teal-300 backdrop-blur transition group-hover:scale-110">
								<Play className="h-5 w-5 translate-x-0.5" />
							</span>
						</span>
					</button>
				)}
			</div>

			<div className="flex flex-1 flex-col gap-2 p-4">
				<h3 className="text-sm font-semibold text-slate-50">{video.title}</h3>
				<p className="text-xs text-slate-400">{video.bestFor}</p>
				<div className="mt-auto flex items-center justify-between pt-2">
					<div className="flex items-center gap-3 text-[11px] text-slate-500">
						<span className="inline-flex items-center gap-1">
							<Clock className="h-3 w-3" /> {video.duration}
						</span>
						<span className="inline-flex items-center gap-1">
							<HardDrive className="h-3 w-3" /> {video.size}
						</span>
					</div>
					<a
						href={src}
						download={`${video.file}.mp4`}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-950/60 px-2.5 py-1.5 text-[11px] font-medium text-slate-200 transition hover:border-teal-500/50 hover:text-teal-300"
					>
						<Download className="h-3 w-3" /> Download
					</a>
				</div>
			</div>
		</div>
	);
}

export default function PromoKitPage() {
	const { isLoading: authLoading, isAuthenticated } = useAffiliate();

	const { data } = useQuery<ReferralLinksListResponse, Error>({
		queryKey: ["referral-links", { page: 1, limit: 1 }],
		queryFn: () => getReferralLinks({ page: 1, limit: 1 }),
		staleTime: 60_000,
		retry: 0,
		enabled: isAuthenticated,
	});

	const referralLink = data?.links?.[0]?.link_url ?? FALLBACK_LINK;
	const captions = buildCaptions(referralLink);

	// Launchpad progress: visiting the kit checks step 2; copying a caption
	// checks step 3 (see PromoterLaunchpad on the dashboard).
	useEffect(() => {
		if (!isAuthenticated) return;
		try {
			window.localStorage.setItem(KIT_VISITED_KEY, "true");
		} catch {
			// ignore
		}
	}, [isAuthenticated]);

	const markPosted = () => {
		try {
			window.localStorage.setItem(POSTED_KEY, "true");
		} catch {
			// ignore
		}
	};

	if (authLoading) {
		return <PageSkeleton />;
	}

	if (!isAuthenticated) {
		return (
			<div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
				<p className="text-sm text-slate-300">
					Sign in with Google to grab your promo kit.
				</p>
				<button
					onClick={() =>
						signIn.social({
							provider: "google",
							callbackURL: "/affiliate/assets",
						})
					}
					className="inline-flex items-center gap-2 rounded-full bg-teal-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-sm transition-colors hover:bg-teal-400"
				>
					<span>Sign in</span>
				</button>
			</div>
		);
	}

	return (
		<div className="space-y-8">
			<div className="space-y-2">
				<p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
					Promo Kit
				</p>
				<h1 className="text-2xl font-bold tracking-tight text-slate-50">
					Ready-made videos and captions. Post, then get paid.
				</h1>
				<p className="max-w-2xl text-sm text-slate-400">
					Every video here is finished and small enough to share straight to
					WhatsApp. Download one, post it with your link, and every signup is
					credited to you for 12 monthly cycles.
				</p>
			</div>

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<ShareLinkCard />
				<div className="rounded-xl border border-slate-800/70 bg-slate-900/60 p-5">
					<div className="flex items-center gap-2">
						<span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-300">
							<MessageCircle className="h-4 w-4" aria-hidden="true" />
						</span>
						<p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
							How to use this kit
						</p>
					</div>
					<ol className="mt-3 space-y-2 text-xs leading-relaxed text-slate-400">
						<li>1. Download a video below. On your phone, long-press or use the share icon to save it.</li>
						<li>2. Copy a caption. Your referral link is already inside it.</li>
						<li>3. Post to your status, groups, or story. Signups through your link are credited to you automatically.</li>
					</ol>
				</div>
			</div>

			{/* Captions */}
			<section className="space-y-3">
				<div>
					<h2 className="text-lg font-semibold text-slate-50">
						Copy-paste captions
					</h2>
					<p className="text-xs text-slate-400">
						Your referral link is already filled in. Edit the words to sound
						like you.
					</p>
				</div>
				<div className="grid grid-cols-1 gap-3 md:grid-cols-3">
					{captions.map((caption) => (
						<div
							key={caption.label}
							className="flex flex-col gap-3 rounded-xl border border-slate-800/70 bg-slate-900/60 p-4"
						>
							<div>
								<p className="text-xs font-semibold text-slate-200">
									{caption.label}
								</p>
								<p className="text-[11px] text-slate-500">{caption.hint}</p>
							</div>
							<p className="flex-1 whitespace-pre-wrap rounded-lg border border-slate-800/60 bg-slate-950/60 p-3 text-xs leading-relaxed text-slate-300">
								{caption.text}
							</p>
							<div className="flex justify-end">
								<CopyButton text={caption.text} small onCopied={markPosted} />
							</div>
						</div>
					))}
				</div>
			</section>

			{/* Videos */}
			{VIDEO_SECTIONS.map((section) => (
				<section key={section.heading} className="space-y-3">
					<div>
						<h2 className="text-lg font-semibold text-slate-50">
							{section.heading}
						</h2>
						<p className="text-xs text-slate-400">{section.sub}</p>
					</div>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{section.videos.map((video) => (
							<VideoCard key={video.file} video={video} />
						))}
					</div>
				</section>
			))}
		</div>
	);
}
