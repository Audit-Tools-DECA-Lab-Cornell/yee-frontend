import Link from "next/link";

import { BrandLogo } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
	return (
		<div className="flex min-h-dvh flex-col bg-background">
			<header className="flex h-14 shrink-0 items-center border-b border-border px-6">
				<BrandLogo variant="horizontal" tone="light" className="h-7" priority />
			</header>

			<main className="flex flex-1 items-center justify-center px-4 py-16">
				<div className="w-full max-w-sm space-y-6 text-center">
					<p
						className="text-8xl font-bold tracking-tighter"
						style={{ color: "var(--yee-green-200)" }}
						aria-hidden="true">
						404
					</p>
					<div className="space-y-2">
						<h1 className="text-xl font-semibold tracking-tight text-foreground">Page not found</h1>
						<p className="text-sm leading-relaxed text-muted-foreground">
							The page you&apos;re looking for doesn&apos;t exist or has been moved.
						</p>
					</div>
					<Button asChild>
						<Link href="/login">Back to sign in</Link>
					</Button>
				</div>
			</main>
		</div>
	);
}
