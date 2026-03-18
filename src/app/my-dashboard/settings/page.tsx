import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function MyDashboardSettingsPage() {
	return (
		<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
			<CardHeader>
				<CardTitle>My Settings</CardTitle>
				<CardDescription>Profile and personal preferences for the current auditor.</CardDescription>
			</CardHeader>
			<CardContent className="text-sm leading-6 text-slate-600">
				This page is reserved for personal profile updates and should not include manager or admin actions.
			</CardContent>
		</Card>
	);
}
