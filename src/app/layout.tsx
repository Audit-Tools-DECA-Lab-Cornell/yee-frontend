import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { AppProviders } from "@/components/providers/app-providers";

import "./globals.css";

const inter = Inter({
	subsets: ["latin"],
	display: "swap",
	variable: "--font-sans"
});

const siteUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";

export const metadata: Metadata = {
	metadataBase: new URL(siteUrl),
	title: {
		template: "%s | YEE Audit Tools",
		default: "YEE Audit Tools"
	},
	description: "Youth Enabling Environment audit management platform for researchers and field auditors.",
	icons: {
		icon: [
			{ url: "/favicon.ico", sizes: "any" },
			{ url: "/favicon-192x192.png", sizes: "192x192", type: "image/png" },
			{ url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
			{ url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" }
		],
		shortcut: "/favicon-192x192.png",
		apple: "/apple-touch-icon-180x180.png"
	},
	openGraph: {
		title: "YEE Audit Tools",
		description: "Youth Enabling Environment audit management platform for researchers and field auditors.",
		images: [{ url: "/brand/banner-light.png", width: 1600, height: 480, alt: "YEE Audit Tools" }],
		type: "website"
	},
	twitter: {
		card: "summary_large_image",
		title: "YEE Audit Tools",
		description: "Youth Enabling Environment audit management platform for researchers and field auditors.",
		images: ["/brand/banner-light.png"]
	}
};

export default function RootLayout({
	children
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className={inter.variable} suppressHydrationWarning>
			<body className="antialiased">
				<AppProviders>{children}</AppProviders>
			</body>
		</html>
	);
}
