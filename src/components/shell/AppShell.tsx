"use client";

import type { ReactNode } from "react";

import { DockNav } from "./DockNav";
import { MobileTopBar } from "./MobileTopBar";
import { BottomTabBar } from "./BottomTabBar";
import type { NavigationItem } from "./TopNav";

export type { NavigationItem } from "./TopNav";

export type AppShellProps = {
	children: ReactNode;
	navigationItems: NavigationItem[];
};

/**
 * Authed surface wrapper for the affiliate dashboard — the floating chrome
 * variant from wasbot-frontend: fixed dock-pill nav on lg+, slim sticky top
 * bar + fixed bottom tab bar below lg. Content frame reserves space for
 * both (pt for the dock, pb for the tab bar).
 */
export function AppShell({ children, navigationItems }: AppShellProps) {
	return (
		<div className="min-h-screen overflow-x-hidden bg-slate-950 font-sans text-slate-50">
			<DockNav items={navigationItems} />
			<MobileTopBar />

			<main
				id="main-content"
				className="mx-auto w-full max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-10 lg:pt-24"
			>
				{children}
			</main>

			<BottomTabBar />
		</div>
	);
}
