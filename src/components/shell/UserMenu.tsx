"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	ChevronDown,
	Clapperboard,
	Link2,
	LogIn,
	LogOut,
	Settings,
	Shield,
} from "lucide-react";

import { signIn, signOut, useSession } from "@/lib/auth-client";

/**
 * Avatar dropdown, ported from wasbot-frontend's shell/UserMenu. Carries the
 * secondary destinations (Products & Links, Settings, Admin) so the primary
 * nav and mobile tab bar stay tight.
 */
export function UserMenu() {
	const [open, setOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);
	const pathname = usePathname();
	const { data: session, isPending } = useSession();

	// Close on outside click
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// Close on navigation — state-during-render adjustment (React's endorsed
	// pattern for reacting to prop/route changes without an effect).
	const [lastPath, setLastPath] = useState(pathname);
	if (lastPath !== pathname) {
		setLastPath(pathname);
		setOpen(false);
	}

	if (isPending) {
		return <div className="h-8 w-8 animate-pulse rounded-full bg-slate-800/70" />;
	}

	const user = session?.user;
	if (!user) {
		return (
			<button
				onClick={() =>
					signIn.social({
						provider: "google",
						callbackURL: pathname ?? "/affiliate/dashboard",
					})
				}
				className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/40 bg-teal-500/10 px-3 py-1.5 text-xs font-semibold text-teal-200 transition-colors hover:bg-teal-500/20"
			>
				<LogIn className="h-3.5 w-3.5" aria-hidden="true" />
				Sign in
			</button>
		);
	}

	const name = user.name ?? user.email ?? "Signed in";
	const firstName = name.split(" ")[0] || name;
	const isAdmin = (user as { role?: string }).role === "admin";
	const initials = name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);

	return (
		<div className="relative" ref={menuRef}>
			<button
				onClick={() => setOpen(!open)}
				className="flex items-center gap-2 rounded-full px-1.5 py-1 text-sm transition-colors hover:bg-slate-800/70"
				aria-expanded={open}
				aria-haspopup="menu"
				aria-label={`User menu for ${name}`}
			>
				{user.image ? (
					// eslint-disable-next-line @next/next/no-img-element
					<img
						src={user.image}
						alt={name}
						width={30}
						height={30}
						className="h-[30px] w-[30px] rounded-full object-cover"
					/>
				) : (
					<div className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-teal-500/10 text-xs font-medium text-teal-400">
						{initials}
					</div>
				)}
				<span className="hidden max-w-[110px] truncate text-slate-300 sm:block">
					{firstName}
				</span>
				<ChevronDown
					className={`h-4 w-4 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
					aria-hidden="true"
				/>
			</button>

			{open && (
				<div className="absolute right-0 z-50 mt-2 w-64 origin-top-right rounded-xl border border-slate-800/70 bg-slate-900 py-1 shadow-lg shadow-black/40">
					<div className="border-b border-slate-800/70 px-4 py-3">
						<p className="truncate text-sm font-medium text-white">{name}</p>
						{user.email && (
							<p className="mt-0.5 truncate text-xs text-slate-500">{user.email}</p>
						)}
						<div className="mt-2 flex items-center gap-2">
							<span className="rounded-full bg-teal-500/10 px-2 py-0.5 text-xs font-medium text-teal-400">
								Affiliate
							</span>
							<span className="text-xs text-slate-500">10% · 12 months</span>
						</div>
					</div>

					<div className="border-b border-slate-800/70 py-1">
						<Link
							href="/affiliate/assets"
							className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-400 hover:bg-slate-800/70 hover:text-slate-200"
						>
							<Clapperboard className="h-4 w-4" aria-hidden="true" />
							Promo Kit
						</Link>
						<Link
							href="/affiliate/products"
							className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-400 hover:bg-slate-800/70 hover:text-slate-200"
						>
							<Link2 className="h-4 w-4" aria-hidden="true" />
							Products &amp; Links
						</Link>
						<Link
							href="/affiliate/settings"
							className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-400 hover:bg-slate-800/70 hover:text-slate-200"
						>
							<Settings className="h-4 w-4" aria-hidden="true" />
							Settings
						</Link>
					</div>

					{isAdmin && (
						<div className="border-b border-slate-800/70 py-1">
							<Link
								href="/admin"
								className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-amber-400 hover:bg-slate-800/70"
								onClick={() => setOpen(false)}
							>
								<Shield className="h-4 w-4" aria-hidden="true" />
								Admin Dashboard
							</Link>
						</div>
					)}

					<div className="py-1">
						<button
							onClick={() => {
								setOpen(false);
								signOut();
							}}
							className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-400 hover:bg-slate-800/70 hover:text-slate-200"
						>
							<LogOut className="h-4 w-4" aria-hidden="true" />
							Logout
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
