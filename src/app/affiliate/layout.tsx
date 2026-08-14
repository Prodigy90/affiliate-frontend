import type { ReactNode } from "react";

import { AppShell, type NavigationItem } from "@/components/shell";

type AffiliateLayoutProps = {
	children: ReactNode;
};

// Primary nav — matches the mobile tab bar 1:1. Ordered by the affiliate
// journey: join a product, watch the money, grab assets, check numbers,
// then account config last.
const navItems: NavigationItem[] = [
	{ href: "/affiliate/dashboard", label: "Dashboard" },
	{ href: "/affiliate/products", label: "Products" },
	{ href: "/affiliate/earnings", label: "Earnings" },
	{ href: "/affiliate/assets", label: "Promo Kit" },
	{ href: "/affiliate/analytics", label: "Analytics" },
	{ href: "/affiliate/settings", label: "Settings" },
];

export default function AffiliateLayout({ children }: AffiliateLayoutProps) {
	return <AppShell navigationItems={navItems}>{children}</AppShell>;
}
