import type { ReactNode } from "react";

import { DashboardHeader } from "@/components/layouts/dashboard/dashboard-header";
import { DashboardSidebar } from "@/components/layouts/dashboard/dashboard-sidebar";
import { SiteCopyProvider } from "@/components/layouts/dashboard/site-copy-provider";
import type { WorkspaceVariant } from "@/components/layouts/dashboard/workspace-config";
import { cn } from "@/lib/utils";

const CONTENT_WIDTH = {
	default: "max-w-7xl",
	wide: "max-w-[110rem]",
	full: "max-w-none"
} as const;

export function DashboardShell({
	children,
	variant,
	contentWidth = "default"
}: {
	children: ReactNode;
	variant: WorkspaceVariant;
	/** `full` drops the content max-width (used by full-bleed report pages). */
	contentWidth?: keyof typeof CONTENT_WIDTH;
}) {
	return (
		<SiteCopyProvider>
			<div className="min-h-dvh bg-background text-foreground">
				<div className="relative min-h-dvh lg:grid lg:grid-cols-[292px_minmax(0,1fr)]">
					<aside className="hidden border-r border-border lg:sticky lg:top-0 lg:block lg:h-screen">
						<DashboardSidebar variant={variant} />
					</aside>

					<div className="min-w-0">
						<DashboardHeader variant={variant} />
						<main id="main-content" className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
							<div className={cn("mx-auto", CONTENT_WIDTH[contentWidth])}>{children}</div>
						</main>
					</div>
				</div>
			</div>
		</SiteCopyProvider>
	);
}
