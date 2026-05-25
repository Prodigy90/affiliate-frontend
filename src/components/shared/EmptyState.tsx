"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export type AccentKey = "teal" | "violet" | "amber" | "sky";

type Palette = {
	iconBg: string;
	iconText: string;
	ring: string;
	bar: string;
};

const PALETTE: Record<AccentKey, Palette> = {
	teal: {
		iconBg: "bg-teal-500/10",
		iconText: "text-teal-300",
		ring: "ring-teal-500/30",
		bar: "bg-teal-500 hover:bg-teal-400",
	},
	violet: {
		iconBg: "bg-violet-500/10",
		iconText: "text-violet-300",
		ring: "ring-violet-500/30",
		bar: "bg-violet-500 hover:bg-violet-400",
	},
	amber: {
		iconBg: "bg-amber-500/10",
		iconText: "text-amber-300",
		ring: "ring-amber-500/30",
		bar: "bg-amber-500 hover:bg-amber-400",
	},
	sky: {
		iconBg: "bg-sky-500/10",
		iconText: "text-sky-300",
		ring: "ring-sky-500/30",
		bar: "bg-sky-500 hover:bg-sky-400",
	},
};

type Cta = {
	label: string;
	onClick?: () => void;
	href?: string;
	icon?: LucideIcon;
};

export type EmptyStateProps = {
	icon: LucideIcon;
	accent: AccentKey;
	title: string;
	body: string;
	primaryCta?: Cta;
	secondaryCta?: Cta;
	className?: string;
};

export function EmptyState({
	icon: Icon,
	accent,
	title,
	body,
	primaryCta,
	secondaryCta,
	className,
}: EmptyStateProps) {
	const palette = PALETTE[accent];

	return (
		<div
			role="status"
			className={`rounded-2xl border border-slate-800/70 bg-slate-900/50 p-6 text-center sm:p-8 ${
				className ?? ""
			}`}
		>
			<div
				className={`mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl ring-1 ${palette.iconBg} ${palette.iconText} ${palette.ring}`}
			>
				<Icon className="h-6 w-6" aria-hidden="true" />
			</div>

			<h3 className="mt-4 text-lg font-semibold tracking-tight text-slate-50">
				{title}
			</h3>
			<p className="mx-auto mt-1.5 max-w-prose text-sm text-slate-400">{body}</p>

			{(primaryCta || secondaryCta) && (
				<div className="mt-5 flex flex-wrap items-center justify-center gap-2">
					{primaryCta && <PrimaryCta cta={primaryCta} barClass={palette.bar} />}
					{secondaryCta && <SecondaryCta cta={secondaryCta} />}
				</div>
			)}
		</div>
	);
}

function PrimaryCta({ cta, barClass }: { cta: Cta; barClass: string }) {
	const Icon = cta.icon;
	const content = (
		<>
			{cta.label}
			{Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
		</>
	);
	const classes = `inline-flex items-center gap-1.5 rounded-lg ${barClass} px-4 py-2 text-sm font-semibold text-slate-950 transition`;

	if (cta.href) {
		return (
			<Link href={cta.href} className={classes}>
				{content}
			</Link>
		);
	}
	return (
		<button type="button" onClick={cta.onClick} className={classes}>
			{content}
		</button>
	);
}

function SecondaryCta({ cta }: { cta: Cta }) {
	const Icon = cta.icon;
	const content = (
		<>
			{cta.label}
			{Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
		</>
	);
	const classes =
		"inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-900";

	if (cta.href) {
		return (
			<Link href={cta.href} className={classes}>
				{content}
			</Link>
		);
	}
	return (
		<button type="button" onClick={cta.onClick} className={classes}>
			{content}
		</button>
	);
}
