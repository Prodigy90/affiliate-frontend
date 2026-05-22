import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
	variable: "--font-inter",
	subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
	variable: "--font-space-grotesk",
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
		<html lang="en" className="dark" suppressHydrationWarning>
			<body
				className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased bg-background text-foreground`}
				suppressHydrationWarning
			>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
