import type { Metadata } from "next";

import { Settings2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { DashboardHero } from "@/components/ui/dashboard-hero";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Admin Settings" };

export default function AdminSettingsPage() {
	return (
		<div className="space-y-6">
			<DashboardHero
				size="compact"
				badge="Admin"
				title="Admin Settings"
				subtitle="Platform-wide configuration: exports, database settings, permission controls, and admin tooling."
			/>
			<Card>
				<CardContent className="pt-6">
					<EmptyState
						icon={Settings2}
						title="System settings coming soon"
						description="This section will provide platform-wide configuration: exports, database settings, permission controls, and admin tooling. It is kept separate from manager-level settings by design."
					/>
				</CardContent>
			</Card>
		</div>
	);
}
