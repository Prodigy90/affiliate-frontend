"use client";

import Link from "next/link";

import { UserMenu } from "./UserMenu";

/**
 * Slim top bar for mobile breakpoints — logo + user menu. Primary navigation
 * lives in the BottomTabBar on this breakpoint, so this header carries no nav
 * links. Mirrors wasbot-frontend's MobileTopBar.
 */
export function MobileTopBar({
	homeHref = "/affiliate/dashboard",
	badge = "Affiliates",
	badgeClassName = "bg-teal-500/10 text-teal-300",
}: {
	homeHref?: string;
	badge?: string;
	badgeClassName?: string;
}) {
	return (
		<header className="sticky top-0 z-40 border-b border-slate-900/80 bg-slate-950/85 px-4 backdrop-blur-md lg:hidden">
			<div className="flex h-14 items-center gap-2">
				<Link href={homeHref} className="flex min-w-0 items-center gap-2">
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src="/wasbot-white.svg"
						alt="WASBOT logo"
						width={28}
						height={28}
						className="rounded-lg"
					/>
					<span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${badgeClassName}`}>
						{badge}
					</span>
				</Link>

				<div className="ml-auto flex shrink-0 items-center">
					<UserMenu />
				</div>
			</div>
		</header>
	);
}
