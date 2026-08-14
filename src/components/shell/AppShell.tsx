"use client";

import type { ReactNode } from "react";

import { DockNav } from "./DockNav";
import { MobileTopBar } from "./MobileTopBar";
import { BottomTabBar, type ShellVariant } from "./BottomTabBar";
import type { NavigationItem } from "./TopNav";

export type { NavigationItem } from "./TopNav";

export type AppShellProps = {
	children: ReactNode;
	navigationItems: NavigationItem[];
	/**
	 * "affiliate" (default) or "admin". Picks the mobile tab set, the logo
	 * link target and the area badge — admin wears amber so you always know
	 * which side of the product you're standing on.
	 */
	variant?: ShellVariant;
};

const VARIANT_CHROME: Record<
	ShellVariant,
	{ homeHref: string; badge: string; badgeClassName: string }
> = {
	affiliate: {
		homeHref: "/affiliate/dashboard",
		badge: "Affiliates",
		badgeClassName: "bg-teal-500/10 text-teal-300",
	},
	admin: {
		homeHref: "/admin",
		badge: "Admin",
		badgeClassName: "bg-amber-500/10 text-amber-300",
	},
};

/**
 * Authed surface wrapper for the affiliate dashboard — the floating chrome
 * variant from wasbot-frontend: fixed dock-pill nav on lg+, slim sticky top
 * bar + fixed bottom tab bar below lg. Content frame reserves space for
 * both (pt for the dock, pb for the tab bar).
 */
export function AppShell({
	children,
	navigationItems,
	variant = "affiliate",
}: AppShellProps) {
	const chrome = VARIANT_CHROME[variant];

	return (
		<div className="min-h-screen overflow-x-hidden bg-slate-950 font-sans text-slate-50">
			<DockNav
				items={navigationItems}
				homeHref={chrome.homeHref}
				badge={chrome.badge}
				badgeClassName={chrome.badgeClassName}
			/>
			<MobileTopBar
				homeHref={chrome.homeHref}
				badge={chrome.badge}
				badgeClassName={chrome.badgeClassName}
			/>

			<main
				id="main-content"
				className="mx-auto w-full max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-10 lg:pt-24"
			>
				{children}
			</main>

			<BottomTabBar variant={variant} />
		</div>
	);
}
