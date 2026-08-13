"use client";

import { useState } from "react";
import {
	Check,
	Clock,
	Copy,
	Download,
	HardDrive,
	MessageCircle,
	Play,
	Star,
	X,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { signIn } from "@/lib/auth-client";
import { PageSkeleton } from "@/components/page-skeleton";
import { ShareLinkCard } from "@/components/affiliate/ShareLinkCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAffiliate } from "@/lib/hooks/use-affiliate";
import { getReferralLinks } from "@/lib/api/affiliate";
import type { ReferralLinksListResponse } from "@/lib/types/affiliate";
import { cn } from "@/lib/utils";

const VIDEO_BASE = "https://wasbot.app/videos/promo-kit";

type Category = "pitch" | "status" | "groups" | "autoreply" | "contacts" | "teasers";

type PromoVideo = {
	file: string;
	title: string;
	bestFor: string;
	duration: string;
	size: string;
	category: Category;
	isNew?: boolean;
	winner?: boolean;
	winnerReason?: string;
};

const CATEGORY_LABEL: Record<Category, string> = {
	pitch: "Quick pitch",
	status: "Status",
	groups: "Groups",
	autoreply: "Auto-reply",
	contacts: "Contacts",
	teasers: "Teasers",
};

const VIDEOS: PromoVideo[] = [
	{
		file: "wasbot-overview",
		title: "WASBOT in 33 seconds",
		bestFor: "The all-rounder. Works for any audience.",
		duration: "0:33",
		size: "5.5MB",
		category: "pitch",
		winner: true,
		winnerReason: "Cheapest signups of any ad we've run.",
	},
	{
		file: "phone-free-hook-1",
		title: "Post without your phone (hook 1)",
		bestFor: "People tired of posting status by hand.",
		duration: "0:27",
		size: "7.7MB",
		category: "status",
		winner: true,
		winnerReason: "Held attention longest of anything we've tested.",
	},
	{
		file: "phone-free-hook-2",
		title: "Post without your phone (hook 2)",
		bestFor: "Same ad, different opening line.",
		duration: "0:36",
		size: "9.8MB",
		category: "status",
	},
	{
		file: "phone-free-hook-3",
		title: "Post without your phone (hook 3)",
		bestFor: "Same ad, third opening line.",
		duration: "0:35",
		size: "9.2MB",
		category: "status",
	},
	{
		file: "phone-free-full",
		title: "Post without your phone (full cut)",
		bestFor: "The longer version with the full walkthrough.",
		duration: "0:52",
		size: "12.3MB",
		category: "status",
	},
	{
		file: "contacts-wedge",
		title: "Contacts & audience building",
		bestFor: "Audiences that sell to saved and unsaved contacts.",
		duration: "1:23",
		size: "10.1MB",
		category: "contacts",
	},
	{
		file: "groups-wedge",
		title: "Group posting on autopilot",
		bestFor: "Vendors who advertise in plenty groups daily.",
		duration: "1:22",
		size: "8.8MB",
		category: "groups",
	},
	{
		file: "autoresponder-wedge",
		title: "Auto-replies that close sales",
		bestFor: "Anyone drowning in repeated DM questions.",
		duration: "1:01",
		size: "9.6MB",
		category: "autoreply",
	},
	{
		file: "status-stats-teaser",
		title: "Status stats teaser",
		bestFor: "Teasing who-viewed-your-status analytics.",
		duration: "0:18",
		size: "2.5MB",
		category: "teasers",
	},
	{
		file: "status-views-teaser",
		title: "Know your real audience",
		bestFor: "The status views hook, short and sharp.",
		duration: "0:22",
		size: "1.7MB",
		category: "teasers",
	},
	{
		file: "groups-stats-teaser",
		title: "Feature map teaser",
		bestFor: "Showing the breadth of WASBOT in 15 seconds.",
		duration: "0:15",
		size: "1.5MB",
		category: "teasers",
	},
	{
		file: "status-wedge-hook-1",
		title: "Status wedge (hook 1)",
		bestFor: "The hidden-status mechanism, opening one.",
		duration: "0:33",
		size: "9.2MB",
		category: "status",
		isNew: true,
	},
	{
		file: "status-wedge-hook-2",
		title: "Status wedge (hook 2)",
		bestFor: "Same ad, second opening.",
		duration: "0:32",
		size: "9.1MB",
		category: "status",
		isNew: true,
		winner: true,
		winnerReason: "Our cheapest paid signups after the overview — best watch-through at scale.",
	},
	{
		file: "status-wedge-hook-3",
		title: "Status wedge (hook 3)",
		bestFor: "Same ad, third opening.",
		duration: "0:33",
		size: "9.3MB",
		category: "status",
		isNew: true,
	},
	{
		file: "wasbot-v3",
		title: "WASBOT motion ad",
		bestFor: "The polished brand ad. Good for pages and paid boosts.",
		duration: "0:56",
		size: "9.6MB",
		category: "pitch",
		isNew: true,
	},
	{
		file: "phone-free-hook-4",
		title: "Post without your phone (hook 4)",
		bestFor: "A fourth opening line for the same ad.",
		duration: "0:32",
		size: "9.2MB",
		category: "status",
		isNew: true,
	},
	{
		file: "groups-wedge-b",
		title: "Group posting on autopilot (hook B)",
		bestFor: "Alternate opening for the groups deep-dive.",
		duration: "1:19",
		size: "12.5MB",
		category: "groups",
		isNew: true,
	},
	{
		file: "groups-wedge-c",
		title: "Group posting on autopilot (hook C)",
		bestFor: "Third opening for the groups deep-dive.",
		duration: "1:24",
		size: "12.3MB",
		category: "groups",
		isNew: true,
	},
	{
		file: "autoresponder-wedge-b",
		title: "Auto-replies that close sales (hook B)",
		bestFor: "Alternate opening for the auto-reply deep-dive.",
		duration: "1:05",
		size: "10.2MB",
		category: "autoreply",
		isNew: true,
	},
	{
		file: "autoresponder-wedge-c",
		title: "Auto-replies that close sales (hook C)",
		bestFor: "Third opening for the auto-reply deep-dive.",
		duration: "1:00",
		size: "9.4MB",
		category: "autoreply",
		isNew: true,
	},
	{
		file: "contacts-wedge-b",
		title: "Contacts & audience building (hook B)",
		bestFor: "The contact-saver grind opening, female voiceover.",
		duration: "1:19",
		size: "11.8MB",
		category: "contacts",
		isNew: true,
	},
	{
		file: "contacts-wedge-c",
		title: "Contacts & audience building (hook C)",
		bestFor: "The 500-people-group opening, female voiceover.",
		duration: "1:22",
		size: "11.9MB",
		category: "contacts",
		isNew: true,
	},
];

type FilterKey = "all" | "winners" | Category | "new";

const FILTERS: { key: FilterKey; label: string; tone: "teal" | "amber" | "violet" }[] = [
	{ key: "all", label: "All", tone: "teal" },
	{ key: "winners", label: "★ Winners", tone: "amber" },
	{ key: "pitch", label: "Quick pitch", tone: "teal" },
	{ key: "status", label: "Status", tone: "teal" },
	{ key: "groups", label: "Groups", tone: "teal" },
	{ key: "autoreply", label: "Auto-reply", tone: "teal" },
	{ key: "contacts", label: "Contacts", tone: "teal" },
	{ key: "teasers", label: "Teasers", tone: "teal" },
	{ key: "new", label: "New", tone: "violet" },
];

function matchesFilter(video: PromoVideo, key: FilterKey): boolean {
	if (key === "all") return true;
	if (key === "winners") return !!video.winner;
	if (key === "new") return !!video.isNew;
	return video.category === key;
}

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

function CopyButton({ text, small }: { text: string; small?: boolean }) {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			toast.success("Copied");
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

function FilterChip({
	label,
	count,
	tone,
	active,
	onClick,
}: {
	label: string;
	count: number;
	tone: "teal" | "amber" | "violet";
	active: boolean;
	onClick: () => void;
}) {
	const activeToneClass =
		tone === "amber"
			? "bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/40"
			: tone === "violet"
				? "bg-violet-500/10 text-violet-300 ring-1 ring-violet-500/40"
				: "bg-teal-500/10 text-teal-300 ring-1 ring-teal-500/40";

	return (
		<button
			type="button"
			aria-pressed={active}
			onClick={onClick}
			className={cn(
				"shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition",
				active
					? cn("border-transparent", activeToneClass)
					: "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200",
			)}
		>
			{label} · {count}
		</button>
	);
}

function WinnerCard({
	video,
	onPreview,
}: {
	video: PromoVideo;
	onPreview: (video: PromoVideo) => void;
}) {
	const poster = `${VIDEO_BASE}/posters/${video.file}.jpg`;
	const src = `${VIDEO_BASE}/${video.file}.mp4`;

	return (
		<div className="flex flex-col overflow-hidden rounded-xl border border-amber-500/30 bg-slate-900/60">
			<div className="relative aspect-[9/16] max-h-72 w-full bg-slate-950">
				<button
					type="button"
					onClick={() => onPreview(video)}
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
				<span className="pointer-events-none absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-950">
					<Star className="h-3 w-3 fill-current" aria-hidden="true" /> Top converter
				</span>
				{video.isNew && (
					<span className="pointer-events-none absolute right-2 top-2 inline-flex items-center rounded-full bg-violet-500/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-950">
						New
					</span>
				)}
			</div>

			<div className="flex flex-1 flex-col gap-2 p-4">
				<h3 className="min-w-0 truncate text-sm font-semibold text-slate-50">{video.title}</h3>
				<p className="text-xs text-amber-300/90">{video.winnerReason}</p>
				<div className="mt-auto flex items-center justify-between gap-2 pt-2">
					<div className="flex min-w-0 items-center gap-3 font-mono text-[11px] text-slate-500">
						<span className="inline-flex shrink-0 items-center gap-1">
							<Clock className="h-3 w-3" /> {video.duration}
						</span>
						<span className="inline-flex shrink-0 items-center gap-1">
							<HardDrive className="h-3 w-3" /> {video.size}
						</span>
					</div>
					<a
						href={src}
						download={`${video.file}.mp4`}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-950/60 px-2.5 py-1.5 text-[11px] font-medium text-slate-200 transition hover:border-teal-500/50 hover:text-teal-300"
					>
						<Download className="h-3 w-3" /> Download
					</a>
				</div>
			</div>
		</div>
	);
}

function VideoRow({
	video,
	mobileOnly,
	onPreview,
}: {
	video: PromoVideo;
	mobileOnly?: boolean;
	onPreview: (video: PromoVideo) => void;
}) {
	const poster = `${VIDEO_BASE}/posters/${video.file}.jpg`;
	const src = `${VIDEO_BASE}/${video.file}.mp4`;

	return (
		<div className={cn("flex items-center gap-3 px-4 py-2.5", mobileOnly && "sm:hidden")}>
			<button
				type="button"
				onClick={() => onPreview(video)}
				className="relative h-12 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-950"
				aria-label={`Preview ${video.title}`}
			>
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img src={poster} alt="" loading="lazy" className="h-full w-full object-cover" />
				<span className="absolute inset-0 flex items-center justify-center bg-slate-950/25">
					<Play className="h-3.5 w-3.5 text-teal-300" />
				</span>
			</button>

			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-1.5">
					<p className="min-w-0 truncate text-sm font-medium text-slate-100">{video.title}</p>
					{video.isNew && (
						<span className="shrink-0 rounded-full bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-violet-300 ring-1 ring-violet-500/30">
							New
						</span>
					)}
					{video.winner && (
						<span className="inline-flex shrink-0 items-center text-amber-300">
							<Star className="h-3 w-3 fill-current" aria-hidden="true" />
						</span>
					)}
				</div>
				<p className="min-w-0 truncate font-mono text-[11px] text-slate-500">
					{CATEGORY_LABEL[video.category]} · {video.duration} · {video.size}
				</p>
			</div>

			<a
				href={src}
				download={`${video.file}.mp4`}
				target="_blank"
				rel="noopener noreferrer"
				className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-700 px-2 py-1.5 text-[11px] font-medium text-slate-300 transition hover:border-teal-500/50 hover:text-teal-300"
			>
				<Download className="h-3 w-3" />
				<span className="hidden sm:inline">Download</span>
			</a>
		</div>
	);
}

function PreviewModal({ video, onClose }: { video: PromoVideo; onClose: () => void }) {
	const src = `${VIDEO_BASE}/${video.file}.mp4`;
	const poster = `${VIDEO_BASE}/posters/${video.file}.jpg`;

	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-label={`Preview of ${video.title}`}
			className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4"
			onClick={onClose}
		>
			<div className="relative w-full max-w-xs" onClick={(e) => e.stopPropagation()}>
				<button
					type="button"
					onClick={onClose}
					aria-label="Close preview"
					className="absolute -top-10 right-0 text-slate-300 transition hover:text-white"
				>
					<X className="h-6 w-6" />
				</button>
				<video
					src={src}
					poster={poster}
					controls
					autoPlay
					playsInline
					className="w-full rounded-xl"
				/>
			</div>
		</div>
	);
}

export default function PromoKitPage() {
	const { isLoading: authLoading, isAuthenticated } = useAffiliate();
	const [filter, setFilter] = useState<FilterKey>("all");
	const [previewVideo, setPreviewVideo] = useState<PromoVideo | null>(null);

	const { data } = useQuery<ReferralLinksListResponse, Error>({
		queryKey: ["referral-links", { page: 1, limit: 1 }],
		queryFn: () => getReferralLinks({ page: 1, limit: 1 }),
		staleTime: 60_000,
		retry: 0,
		enabled: isAuthenticated,
	});

	const referralLink = data?.links?.[0]?.link_url ?? FALLBACK_LINK;
	const captions = buildCaptions(referralLink);

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

	const filtered = VIDEOS.filter((v) => matchesFilter(v, filter));
	const winners = filtered.filter((v) => v.winner);
	const nonWinners = filtered.filter((v) => !v.winner);
	const restWinners = winners.slice(1);

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
								<CopyButton text={caption.text} small />
							</div>
						</div>
					))}
				</div>
			</section>

			{/* Videos */}
			<section className="space-y-3">
				<div>
					<h2 className="text-lg font-semibold text-slate-50">Videos</h2>
					<p className="text-xs text-slate-400">
						Winners are pinned first — everything else is one tap away.
					</p>
				</div>

				<div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
					{FILTERS.map((f) => (
						<FilterChip
							key={f.key}
							label={f.label}
							count={VIDEOS.filter((v) => matchesFilter(v, f.key)).length}
							tone={f.tone}
							active={filter === f.key}
							onClick={() => setFilter(f.key)}
						/>
					))}
				</div>

				{winners.length === 0 && nonWinners.length === 0 ? (
					<EmptyState
						icon={Play}
						accent="teal"
						title="Nothing in this filter"
						body="Try a different category — every video lives under All."
					/>
				) : (
					<>
						{winners.length > 0 && (
							<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
								{winners.map((v, i) => (
									<div key={v.file} className={i === 0 ? "" : "hidden sm:block"}>
										<WinnerCard video={v} onPreview={setPreviewVideo} />
									</div>
								))}
							</div>
						)}

						{(restWinners.length > 0 || nonWinners.length > 0) && (
							<div className="divide-y divide-slate-800/50 rounded-xl border border-slate-800/70 bg-slate-900/60">
								{restWinners.map((v) => (
									<VideoRow key={v.file} video={v} mobileOnly onPreview={setPreviewVideo} />
								))}
								{nonWinners.map((v) => (
									<VideoRow key={v.file} video={v} onPreview={setPreviewVideo} />
								))}
							</div>
						)}
					</>
				)}
			</section>

			{previewVideo && (
				<PreviewModal video={previewVideo} onClose={() => setPreviewVideo(null)} />
			)}
		</div>
	);
}
