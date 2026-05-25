"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { TopNav, type NavigationItem } from "./TopNav";
import { BottomTabBar } from "./BottomTabBar";
import { UserMenu } from "@/components/user-menu";

export type { NavigationItem } from "./TopNav";

export type AppShellProps = {
	children: ReactNode;
	navigationItems: NavigationItem[];
};

/**
 * Authed surface wrapper for the affiliate dashboard.
 *
 * Shape mirrors wasbot-frontend's AppShell (flat variant): sticky top bar
 * with logo + primary nav + user menu on desktop, fixed bottom tab bar on
 * mobile, content frame with max-width and bottom padding for the tab bar.
 */
export function AppShell({ children, navigationItems }: AppShellProps) {
	return (
		<div className="min-h-screen overflow-x-hidden bg-slate-950 font-sans text-slate-50">
			<header className="sticky top-0 z-40 border-b border-slate-800/70 bg-slate-950/95 backdrop-blur-sm">
				<div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
					{/* Logo */}
					<Link
						href="/affiliate/dashboard"
						className="group flex items-center gap-2"
					>
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							src="/wasbot-icon.svg"
							alt=""
							width={28}
							height={28}
							className="h-7 w-7 rounded-md transition-shadow duration-300 group-hover:shadow-[0_0_12px_rgba(45,212,191,0.5)]"
						/>
						<span className="text-sm font-semibold tracking-tight text-slate-100">
							Affiliate
						</span>
					</Link>

					{/* Desktop nav */}
					<TopNav items={navigationItems} />

					{/* User menu */}
					<div className="flex items-center gap-3">
						<UserMenu />
					</div>
				</div>
			</header>

			<main
				id="main-content"
				className="mx-auto w-full max-w-7xl px-4 pb-24 pt-6 sm:px-6 md:pb-10 lg:px-8"
			>
				{children}
			</main>

			<BottomTabBar />
		</div>
	);
}
