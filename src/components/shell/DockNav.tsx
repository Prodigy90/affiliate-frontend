"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

import { UserMenu } from "./UserMenu";
import type { NavigationItem } from "./TopNav";

/**
 * Floating-pill desktop nav — a direct port of wasbot-frontend's
 * DashboardDockNav so the affiliate surface reads as the same product.
 * Three pills: logo, nav links (animated active indicator), right cluster
 * (copy-link CTA + user menu). Mobile is handled by MobileTopBar +
 * BottomTabBar, not here.
 */
export function DockNav({ items }: { items: NavigationItem[] }) {
	const pathname = usePathname();

	const isActiveLink = (item: NavigationItem) => {
		if (!pathname) return false;
		if (pathname === item.href) return true;
		if (item.href !== "/" && pathname.startsWith(`${item.href}/`)) return true;
		return false;
	};

	const [scrolled, setScrolled] = useState(false);
	useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > 20);
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	const pillClass = (extra: string) =>
		`${extra} rounded-full border backdrop-blur-xl transition-all duration-300 ${
			scrolled
				? "border-slate-700/60 bg-slate-900/90 shadow-xl shadow-black/30"
				: "border-slate-800/40 bg-slate-900/80"
		}`;

	return (
		<motion.header
			initial={{ y: -60, opacity: 0 }}
			animate={{ y: 0, opacity: 1 }}
			transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
			className="fixed left-0 right-0 top-3 z-40 hidden px-4 lg:block"
		>
			<div className="mx-auto flex max-w-7xl items-center justify-center gap-2">
				{/* Pill 1 — Logo */}
				<Link
					href="/affiliate/dashboard"
					className={pillClass("flex shrink-0 items-center gap-2 px-3 py-1.5")}
				>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src="/wasbot-white.svg"
						alt="WASBOT logo"
						width={28}
						height={28}
						className="rounded-lg"
					/>
					<span className="rounded-full bg-teal-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-300">
						Affiliates
					</span>
				</Link>

				{/* Pill 2 — Nav links */}
				<nav className={pillClass("flex shrink-0 items-center gap-0.5 px-2 py-1.5")}>
					{items.map((item) => {
						const active = isActiveLink(item);
						return (
							<Link
								key={item.href}
								href={item.href}
								className={`relative rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors duration-200 ${
									active ? "text-white" : "text-slate-400 hover:text-slate-200"
								}`}
							>
								{active && (
									<>
										<motion.span
											layoutId="affiliate-nav-indicator"
											className="absolute inset-0 rounded-full bg-slate-800/80"
											style={{
												boxShadow:
													"0 0 12px 2px rgba(20, 184, 166, 0.12), inset 0 1px 0 rgba(255,255,255,0.05)",
											}}
											transition={{ type: "spring", stiffness: 380, damping: 30 }}
										/>
										<motion.span
											layoutId="affiliate-nav-glow"
											className="pointer-events-none absolute -bottom-[13px] left-1/2 h-[3px] w-5 -translate-x-1/2 rounded-full bg-white/90"
											style={{
												boxShadow:
													"0 -2px 12px 4px rgba(20, 184, 166, 0.45), 0 -4px 24px 8px rgba(20, 184, 166, 0.2)",
											}}
											transition={{ type: "spring", stiffness: 380, damping: 30 }}
										/>
									</>
								)}
								<span className="relative z-10">{item.label}</span>
							</Link>
						);
					})}
				</nav>

				{/* Pill 3 — Right cluster */}
				<div className={pillClass("flex shrink-0 items-center p-1")}>
					<UserMenu />
				</div>
			</div>
		</motion.header>
	);
}
