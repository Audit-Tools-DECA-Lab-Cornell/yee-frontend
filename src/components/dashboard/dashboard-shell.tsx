import type { ReactNode } from "react";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";

export function DashboardShell({ children }: { children: ReactNode }) {
	return (
		<div className="min-h-screen bg-[#f6f3ea] text-slate-900">
			<div className="relative min-h-screen lg:grid lg:grid-cols-[292px_minmax(0,1fr)]">
				<aside className="hidden border-r border-white/10 lg:sticky lg:top-0 lg:block lg:h-screen">
					<DashboardSidebar />
				</aside>

				<div className="min-w-0">
					<DashboardHeader />
					<main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
						<div className="mx-auto max-w-7xl">{children}</div>
					</main>
				</div>
			</div>
		</div>
	);
}
