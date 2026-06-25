import type { Metadata } from "next";

import { UserRound } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Settings" };

export default function MyDashboardSettingsPage() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Personal Settings</CardTitle>
			</CardHeader>
			<CardContent>
				<EmptyState
					icon={UserRound}
					title="Profile settings coming soon"
					description="This section will let you update your personal profile, notification preferences, and auditor account details."
				/>
			</CardContent>
		</Card>
	);
}
