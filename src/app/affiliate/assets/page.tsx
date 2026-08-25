"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
	ArrowRight,
	Check,
	ChevronDown,
	Clock,
	Copy,
	Download,
	Folder,
	FolderOpen,
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
import { useAffiliate } from "@/lib/hooks/use-affiliate";
import { getReferralLinks } from "@/lib/api/affiliate";
import type { ReferralLinksListResponse } from "@/lib/types/affiliate";
import { cn } from "@/lib/utils";

const VIDEO_BASE = "https://wasbot.app/videos/promo-kit";

type Category = "pitch" | "status" | "groups" | "contacts" | "sequences";

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
	contacts: "Contacts",
	sequences: "Sequences",
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
		file: "groups-hook-a",
		title: "Group posting on autopilot (hook A)",
		bestFor: "The 8PM class grind opening. Founder-voiced.",
		duration: "1:21",
		size: "9.6MB",
		category: "groups",
		isNew: true,
	},
	{
		file: "groups-hook-b",
		title: "Group posting on autopilot (hook B)",
		bestFor: "The goldmine-groups opening. Founder-voiced.",
		duration: "1:19",
		size: "9.3MB",
		category: "groups",
		isNew: true,
	},
	{
		file: "groups-hook-c",
		title: "Group posting on autopilot (hook C)",
		bestFor: "The do-the-math opening. Founder-voiced.",
		duration: "1:24",
		size: "10.3MB",
		category: "groups",
		isNew: true,
	},
	{
		file: "contacts-hook-a",
		title: "Contacts & audience building (hook A)",
		bestFor: "The invisible-customers opening for anyone running ads.",
		duration: "1:23",
		size: "8.9MB",
		category: "contacts",
		isNew: true,
	},
	{
		file: "contacts-hook-b",
		title: "Contacts & audience building (hook B)",
		bestFor: "The glorified contact-saver opening.",
		duration: "1:19",
		size: "8.4MB",
		category: "contacts",
		isNew: true,
	},
	{
		file: "sequences-hook-a",
		title: "Follow-ups that close sales (hook A)",
		bestFor: "The 'how much' price-list flood opening. Founder-voiced.",
		duration: "0:42",
		size: "12.9MB",
		category: "sequences",
		isNew: true,
	},
	{
		file: "sequences-hook-b",
		title: "Follow-ups that close sales (hook B)",
		bestFor: "The ghost customer opening — 'ok let me get back to you'. Founder-voiced.",
		duration: "0:45",
		size: "13.0MB",
		category: "sequences",
		isNew: true,
	},
	{
		file: "sequences-hook-c",
		title: "Follow-ups that close sales (hook C)",
		bestFor: "The blunt call-out opening. Founder-voiced.",
		duration: "0:43",
		size: "11.2MB",
		category: "sequences",
		isNew: true,
	},
];

// Folder display order for the Videos tab.
// The pitch category has no folder — its only video is the pinned winner up top.
const CATEGORY_ORDER: Category[] = ["status", "groups", "contacts", "sequences"];

const FALLBACK_LINK = "https://wasbot.app";

const SITE_BASE = "https://www.wasbot.app";

type EntryPoint = {
	key: "main" | "start";
	title: string;
	badge: string;
	description: string;
	path: string;
};

// Two doors into WASBOT. Both carry the same ref code — attribution is
// identical, only the funnel differs.
const ENTRY_POINTS: EntryPoint[] = [
	{
		key: "main",
		title: "Main site",
		badge: "Free trial",
		description:
			"The full WASBOT site. People sign up and get a 7-day free trial, no card needed. Best for cold audiences who are hearing about WASBOT for the first time.",
		path: "/",
	},
	{
		key: "start",
		title: "Sales page",
		badge: "Straight to paid",
		description:
			"A direct sales page with no free trial — it sells the subscription on the spot. Best for warm audiences who already trust you and are ready to buy.",
		path: "/start",
	},
];

// Pull the ref code out of the stored referral link so both entry-point
// links can carry it. Returns null when the link has no ref (fallback state).
function extractRefCode(link: string): string | null {
	try {
		return new URL(link).searchParams.get("ref");
	} catch {
		return null;
	}
}

function buildEntryUrl(path: string, refCode: string | null): string {
	const base = path === "/" ? SITE_BASE : `${SITE_BASE}${path}`;
	return refCode ? `${base}?ref=${refCode}` : base;
}

const buildCaptions = (link: string) => [
	{
		label: "Status caption",
		hint: "Pair it with any video from the Videos tab.",
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

	// Escape closes; page scroll is locked while the lightbox is open.
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", onKey);
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.removeEventListener("keydown", onKey);
			document.body.style.overflow = previousOverflow;
		};
	}, [onClose]);

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
	const [section, setSection] = useState<"videos" | "captions">("videos");
	const [openFolders, setOpenFolders] = useState<Set<Category>>(new Set());
	const [previewVideo, setPreviewVideo] = useState<PromoVideo | null>(null);

	const toggleFolder = (cat: Category) => {
		setOpenFolders((prev) => {
			const next = new Set(prev);
			if (next.has(cat)) {
				next.delete(cat);
			} else {
				next.add(cat);
			}
			return next;
		});
	};

	const { data } = useQuery<ReferralLinksListResponse, Error>({
		queryKey: ["referral-links", { page: 1, limit: 1 }],
		queryFn: () => getReferralLinks({ page: 1, limit: 1 }),
		staleTime: 60_000,
		retry: 0,
		enabled: isAuthenticated,
	});

	const referralLink = data?.links?.[0]?.link_url ?? FALLBACK_LINK;
	const refCode = extractRefCode(referralLink);
	const captions = buildCaptions(buildEntryUrl("/", refCode));

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

	const winners = VIDEOS.filter((v) => v.winner);
	const restWinners = winners.slice(1);

	return (
		<div className="space-y-6">
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

			{/* Product scope — the kit opens on WASBOT; more products join later. */}
			<div className="flex flex-wrap items-center gap-3">
				<span className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/10 px-3 py-1.5 text-xs font-semibold text-teal-300 ring-1 ring-teal-500/40">
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img src="/wasbot-white.svg" alt="" width={16} height={16} className="rounded" />
					WASBOT
				</span>
				<Link
					href="/affiliate/products"
					className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 transition hover:text-teal-300"
				>
					All products <ArrowRight className="h-3 w-3" aria-hidden="true" />
				</Link>
			</div>

			{/* Two entry points — same ref code, different funnel */}
			<div className="rounded-xl border border-slate-800/70 bg-slate-900/60 p-4">
				<p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
					Your links — two ways in
				</p>
				<p className="mt-1 text-xs text-slate-400">
					Both links credit you the same way. Pick the one that fits the
					audience you&apos;re posting to.
				</p>
				<div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
					{ENTRY_POINTS.map((entry) => {
						const url = buildEntryUrl(entry.path, refCode);
						return (
							<div
								key={entry.key}
								className="flex flex-col gap-2.5 rounded-lg border border-slate-800/60 bg-slate-950/50 p-3.5"
							>
								<div className="flex items-center gap-2">
									<p className="text-sm font-semibold text-slate-100">
										{entry.title}
									</p>
									<span
										className={cn(
											"rounded-full px-2 py-0.5 text-[10px] font-semibold",
											entry.key === "main"
												? "bg-teal-500/10 text-teal-300 ring-1 ring-teal-500/30"
												: "bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/30",
										)}
									>
										{entry.badge}
									</span>
								</div>
								<p className="flex-1 text-xs leading-relaxed text-slate-400">
									{entry.description}
								</p>
								<div className="flex items-center justify-between gap-2">
									<code className="min-w-0 flex-1 truncate rounded-lg border border-slate-800/60 bg-slate-950/60 px-2.5 py-2 font-mono text-[11px] text-teal-200">
										{url}
									</code>
									<CopyButton text={url} small />
								</div>
							</div>
						);
					})}
				</div>
			</div>

			{/* How to use this kit — compact three-step strip */}
			<div className="rounded-xl border border-slate-800/70 bg-slate-900/60 p-4">
				<div className="flex items-center gap-2">
					<span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/10 text-teal-300">
						<MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
					</span>
					<p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
						How to use this kit
					</p>
				</div>
				<ol className="mt-3 grid gap-2.5 text-xs leading-relaxed text-slate-400 md:grid-cols-3">
					<li className="flex gap-2">
						<span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-500/10 font-mono text-[10px] font-semibold text-teal-300">
							1
						</span>
						Download a video. On your phone, long-press or use the share icon to save it.
					</li>
					<li className="flex gap-2">
						<span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-500/10 font-mono text-[10px] font-semibold text-teal-300">
							2
						</span>
						Copy a caption. Your referral link is already inside it.
					</li>
					<li className="flex gap-2">
						<span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-500/10 font-mono text-[10px] font-semibold text-teal-300">
							3
						</span>
						Post to your status, groups, or story. Signups through your link are credited automatically.
					</li>
				</ol>
			</div>

			{/* Section tabs — videos / captions */}
			<div className="flex items-center gap-1.5" role="tablist" aria-label="Kit sections">
				{(["videos", "captions"] as const).map((s) => {
					const active = section === s;
					const count = s === "videos" ? VIDEOS.length : captions.length;
					return (
						<button
							key={s}
							role="tab"
							aria-selected={active}
							onClick={() => setSection(s)}
							className={cn(
								"rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors",
								active
									? "bg-teal-500/15 text-teal-200 ring-1 ring-teal-500/40"
									: "text-slate-400 ring-1 ring-slate-800 hover:text-slate-200",
							)}
						>
							{s} · {count}
						</button>
					);
				})}
			</div>

			{section === "captions" ? (
				<section className="space-y-3">
					<p className="text-xs text-slate-400">
						Your referral link is already filled in. Edit the words to sound
						like you.
					</p>
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
			) : (
				<section className="space-y-3">
					<p className="text-xs text-slate-400">
						Winners are pinned first — the rest is filed by category below.
					</p>

					{/* Pinned winners */}
					<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
						{winners.map((v, i) => (
							<div key={v.file} className={i === 0 ? "" : "hidden sm:block"}>
								<WinnerCard video={v} onPreview={setPreviewVideo} />
							</div>
						))}
					</div>
					{restWinners.length > 0 && (
						<div className="divide-y divide-slate-800/50 rounded-xl border border-slate-800/70 bg-slate-900/60 sm:hidden">
							{restWinners.map((v) => (
								<VideoRow key={v.file} video={v} mobileOnly onPreview={setPreviewVideo} />
							))}
						</div>
					)}

					{/* Category folders */}
					<div className="divide-y divide-slate-800/50 rounded-xl border border-slate-800/70 bg-slate-900/60">
						{CATEGORY_ORDER.map((cat) => {
							const vids = VIDEOS.filter((v) => v.category === cat);
							const open = openFolders.has(cat);
							const hasNew = vids.some((v) => v.isNew);
							const FolderIcon = open ? FolderOpen : Folder;
							return (
								<div key={cat}>
									<button
										type="button"
										aria-expanded={open}
										onClick={() => toggleFolder(cat)}
										className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-900/80"
									>
										<span className="flex min-w-0 items-center gap-2.5">
											<FolderIcon
												className={cn("h-4 w-4 shrink-0", open ? "text-teal-300" : "text-slate-500")}
												aria-hidden="true"
											/>
											<span className="truncate text-sm font-medium text-slate-100">
												{CATEGORY_LABEL[cat]}
											</span>
											<span className="font-mono text-[11px] text-slate-500">
												{vids.length}
											</span>
											{hasNew && (
												<span className="shrink-0 rounded-full bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-violet-300 ring-1 ring-violet-500/30">
													New
												</span>
											)}
										</span>
										<ChevronDown
											className={cn(
												"h-4 w-4 shrink-0 text-slate-500 transition-transform",
												open && "rotate-180",
											)}
											aria-hidden="true"
										/>
									</button>
									{open && (
										<div className="divide-y divide-slate-800/50 border-t border-slate-800/50 bg-slate-950/30">
											{vids.map((v) => (
												<VideoRow key={v.file} video={v} onPreview={setPreviewVideo} />
											))}
										</div>
									)}
								</div>
							);
						})}
					</div>
				</section>
			)}

			{previewVideo && (
				<PreviewModal video={previewVideo} onClose={() => setPreviewVideo(null)} />
			)}
		</div>
	);
}
