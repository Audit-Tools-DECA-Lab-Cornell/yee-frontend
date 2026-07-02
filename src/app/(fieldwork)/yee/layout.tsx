import type { ReactNode } from "react";
import Link from "next/link";

import { BrandLogo } from "@/components/brand/brand-logo";

/**
 * Wraps all /yee/* routes with a compact brand header.
 * The audit wizard, introduction screen, and submission pages are
 * standalone flows outside the dashboard shell, so this layout
 * gives them a visual anchor without a full sidebar.
 */
export default function YeeAuditLayout({ children }: { children: ReactNode }) {
	return (
		<div className="min-h-dvh bg-background">
			<header
				className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur"
				aria-label="YEE audit navigation">
				<div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
					<BrandLogo variant="horizontal" tone="light" className="h-8" priority />
					<Link
						href="/auditor"
						className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
						Back to dashboard
					</Link>
				</div>
			</header>

			{children}
		</div>
	);
}
