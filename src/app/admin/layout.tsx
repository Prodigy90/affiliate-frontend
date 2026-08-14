import type { ReactNode } from "react";

import { AppShell, type NavigationItem } from "@/components/shell";

type AdminLayoutProps = {
	children: ReactNode;
};

// Admin nav — matches the admin mobile tab bar 1:1.
const navItems: NavigationItem[] = [
	{ href: "/admin", label: "Dashboard" },
	{ href: "/admin/payouts", label: "Payouts" },
	{ href: "/admin/affiliates", label: "Affiliates" },
	{ href: "/admin/products", label: "Products" },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
	return (
		<AppShell navigationItems={navItems} variant="admin">
			{children}
		</AppShell>
	);
}
