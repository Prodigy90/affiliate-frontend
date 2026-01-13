import type { ReactNode } from "react";
import Link from "next/link";

import { UserMenu } from "@/components/user-menu";

type AffiliateLayoutProps = {
	children: ReactNode;
};

const navItems = [
	{ href: "/affiliate/dashboard", label: "Dashboard" },
	{ href: "/affiliate/analytics", label: "Analytics" },
	{ href: "/affiliate/products", label: "Products" },
	{ href: "/affiliate/payouts", label: "Payouts" },
	{ href: "/affiliate/commissions", label: "Commissions" },
	{ href: "/affiliate/settings", label: "Settings" },
];

export default function AffiliateLayout({ children }: AffiliateLayoutProps) {
	return (
		<div className="min-h-screen bg-slate-950 text-slate-50">
			<header className="border-b border-slate-800/80">
					<div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
					<Link href="/affiliate/dashboard" className="flex items-center gap-2">
						<span className="rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-semibold uppercase tracking-tight text-emerald-400">
							WasBot
						</span>
						<span className="text-sm font-medium text-slate-100">
							Affiliate
						</span>
					</Link>
						<div className="flex items-center gap-4">
							<nav className="flex items-center gap-4 text-sm text-slate-300">
								{navItems.map((item) => (
									<Link
										key={item.href}
										href={item.href}
										className="rounded-full px-3 py-1 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-emerald-400 transition-colors"
									>
										{item.label}
									</Link>
								))}
							</nav>
							<UserMenu />
						</div>
				</div>
			</header>
			<main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8">
				{children}
			</main>
		</div>
	);
}
