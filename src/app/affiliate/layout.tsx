import type { ReactNode } from "react";

import { AppShell, type NavigationItem } from "@/components/shell";

type AffiliateLayoutProps = {
	children: ReactNode;
};

const navItems: NavigationItem[] = [
	{ href: "/affiliate/dashboard", label: "Dashboard" },
	{ href: "/affiliate/commissions", label: "Commissions" },
	{ href: "/affiliate/products", label: "Products" },
	{ href: "/affiliate/payouts", label: "Payouts" },
	{ href: "/affiliate/analytics", label: "Analytics" },
	{ href: "/affiliate/settings", label: "Settings" },
];

export default function AffiliateLayout({ children }: AffiliateLayoutProps) {
	return <AppShell navigationItems={navItems}>{children}</AppShell>;
}
