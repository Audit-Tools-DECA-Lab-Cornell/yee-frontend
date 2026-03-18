import type { ReactNode } from "react";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import type { WorkspaceVariant } from "@/lib/dashboard/workspace-config";

export function DashboardShell({ children, variant }: { children: ReactNode; variant: WorkspaceVariant }) {
	return (
		<div className="min-h-screen bg-[#f6f3ea] text-slate-900">
			<div className="relative min-h-screen lg:grid lg:grid-cols-[292px_minmax(0,1fr)]">
				<aside className="hidden border-r border-white/10 lg:sticky lg:top-0 lg:block lg:h-screen">
					<DashboardSidebar variant={variant} />
				</aside>

				<div className="min-w-0">
					<DashboardHeader variant={variant} />
					<main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
						<div className="mx-auto max-w-7xl">{children}</div>
					</main>
				</div>
			</div>
		</div>
	);
}
