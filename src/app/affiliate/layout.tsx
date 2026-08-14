import type { ReactNode } from "react";

import { AppShell, type NavigationItem } from "@/components/shell";

type AffiliateLayoutProps = {
	children: ReactNode;
};

// Primary nav — four destinations, matching the mobile tab bar 1:1.
// Products & Links and Settings live in the user menu dropdown.
const navItems: NavigationItem[] = [
	{ href: "/affiliate/dashboard", label: "Dashboard" },
	{ href: "/affiliate/assets", label: "Promo Kit" },
	{ href: "/affiliate/earnings", label: "Earnings" },
	{ href: "/affiliate/analytics", label: "Analytics" },
];

export default function AffiliateLayout({ children }: AffiliateLayoutProps) {
	return <AppShell navigationItems={navItems}>{children}</AppShell>;
}
