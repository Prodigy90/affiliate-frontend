import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "WASBOT Affiliate — Earn 10% on Every Renewal, Three Months Running",
	description:
		"Share what you already love about WASBOT. Get paid 10% on every renewal for the first three months — every single referral, no cap.",
	manifest: "/site.webmanifest",
	icons: {
		icon: "/wasbot-icon.svg",
		apple: "/apple-icon.png",
	},
	openGraph: {
		title: "WASBOT Affiliate — Earn 10% on Every Renewal",
		description:
			"Share what you already love about WASBOT. Get paid 10% on every renewal for the first three months — no cap on referrals.",
		type: "website",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-950 text-slate-50`}
			>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
