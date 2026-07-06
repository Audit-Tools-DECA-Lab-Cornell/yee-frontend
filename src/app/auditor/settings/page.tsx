import type { Metadata } from "next";

import { UserRound } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { DashboardHero } from "@/components/ui/dashboard-hero";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Settings" };

export default function MyDashboardSettingsPage() {
	return (
		<div className="space-y-6">
			<DashboardHero
				size="compact"
				badge="Account"
				title="Personal Settings"
				subtitle="Update your personal profile, notification preferences, and auditor account details."
			/>
			<Card>
				<CardContent className="pt-6">
					<EmptyState
						icon={UserRound}
						title="Profile settings coming soon"
						description="This section will let you update your personal profile, notification preferences, and auditor account details."
					/>
				</CardContent>
			</Card>
		</div>
	);
}
