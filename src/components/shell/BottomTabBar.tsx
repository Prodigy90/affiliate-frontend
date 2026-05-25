"use client";

import type { ReactElement } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface IconProps {
	size?: number;
	w?: number;
}

const svgProps = (p: IconProps) => ({
	viewBox: "0 0 24 24",
	width: p.size ?? 24,
	height: p.size ?? 24,
	fill: "none" as const,
	stroke: "currentColor",
	strokeWidth: p.w ?? 1.75,
	strokeLinecap: "round" as const,
	strokeLinejoin: "round" as const,
});

// ─── Icons (lineDuo set, mirroring wasbot-frontend's BottomTabBar) ────────

function HomeIcon(p: IconProps) {
	return (
		<svg {...svgProps(p)} aria-hidden="true">
			<path d="M4 12 12 4l8 8" />
			<path d="M6 11v8a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-8" />
		</svg>
	);
}

function CommissionsIcon(p: IconProps) {
	return (
		<svg {...svgProps(p)} aria-hidden="true">
			<circle cx="12" cy="12" r="8" />
			<path d="M15 9.5c-.6-.9-1.7-1.5-3-1.5-1.7 0-3 1-3 2.2 0 2.6 6 1.5 6 4 0 1.3-1.3 2.3-3 2.3-1.5 0-2.7-.7-3.2-1.7" />
			<path d="M12 6v2M12 16v2" />
		</svg>
	);
}

function ProductsIcon(p: IconProps) {
	return (
		<svg {...svgProps(p)} aria-hidden="true">
			<path d="M4 7 12 3l8 4-8 4-8-4Z" />
			<path d="M4 11 12 15l8-4" />
			<path d="M4 15 12 19l8-4" />
		</svg>
	);
}

function PayoutsIcon(p: IconProps) {
	return (
		<svg {...svgProps(p)} aria-hidden="true">
			<rect x="3" y="6" width="18" height="13" rx="2" />
			<path d="M3 10h18" />
			<circle cx="16.5" cy="14.5" r="1.25" />
		</svg>
	);
}

function MoreIcon(p: IconProps) {
	return (
		<svg {...svgProps(p)} aria-hidden="true">
			<circle cx="6" cy="12" r="1.5" />
			<circle cx="12" cy="12" r="1.5" />
			<circle cx="18" cy="12" r="1.5" />
		</svg>
	);
}

interface Tab {
	label: string;
	href: string;
	Icon: (p: IconProps) => ReactElement;
}

const TABS: Tab[] = [
	{ label: "Home", href: "/affiliate/dashboard", Icon: HomeIcon },
	{ label: "Commissions", href: "/affiliate/commissions", Icon: CommissionsIcon },
	{ label: "Products", href: "/affiliate/products", Icon: ProductsIcon },
	{ label: "Payouts", href: "/affiliate/payouts", Icon: PayoutsIcon },
	{ label: "More", href: "/affiliate/settings", Icon: MoreIcon },
];

export function BottomTabBar() {
	const pathname = usePathname();

	// Match against most-specific href first so /affiliate/settings doesn't
	// claim active for /affiliate/settings/sub-route ambiguity.
	const sorted = [...TABS].sort((a, b) => b.href.length - a.href.length);
	const activeHref = sorted.find(
		(t) => pathname === t.href || pathname?.startsWith(t.href + "/")
	)?.href;

	return (
		<nav
			aria-label="Primary mobile"
			className="md:hidden fixed inset-x-0 bottom-0 z-50 border-t border-slate-800/80 bg-[rgba(2,6,23,0.97)] backdrop-blur-xl"
		>
			<ul
				className="flex items-stretch justify-around px-1 pt-1.5"
				style={{ paddingBottom: "max(0.375rem, env(safe-area-inset-bottom))" }}
			>
				{TABS.map((tab) => {
					const active = activeHref === tab.href;
					const { Icon } = tab;
					return (
						<li key={tab.href} className="flex-1">
							<Link
								href={tab.href}
								aria-current={active ? "page" : undefined}
								className={`relative flex h-full w-full flex-col items-center gap-0.5 rounded-md px-0.5 pt-1 pb-0.5 transition-colors ${
									active ? "text-teal-300" : "text-slate-500 hover:text-slate-300"
								}`}
							>
								<Icon size={22} w={active ? 2.2 : 1.6} />
								<span
									className={`text-[10px] leading-none tracking-tight transition-opacity ${
										active ? "font-semibold opacity-100" : "font-medium opacity-70"
									}`}
								>
									{tab.label}
								</span>
								<span
									aria-hidden="true"
									className="mt-0.5 h-[2px] rounded"
									style={{
										width: active ? 20 : 0,
										background: "#2dd4bf",
										boxShadow: active ? "0 0 6px rgba(45,212,191,0.55)" : "none",
										transition: "width 260ms cubic-bezier(.34,1.15,.42,1)",
									}}
								/>
							</Link>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}
