"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavigationItem = {
	label: string;
	href: string;
};

export function TopNav({ items }: { items: NavigationItem[] }) {
	const pathname = usePathname();

	return (
		<nav aria-label="Primary">
			<ul className="hidden md:flex items-center gap-1">
				{items.map((item) => {
					const isActive =
						pathname === item.href || pathname?.startsWith(item.href + "/");
					return (
						<li key={item.href}>
							<Link
								href={item.href}
								className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${
									isActive
										? "bg-teal-500/10 text-teal-300"
										: "text-slate-400 hover:bg-slate-800/70 hover:text-white"
								}`}
							>
								{item.label}
							</Link>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}
