import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminSettingsPage() {
	return (
		<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
			<CardHeader>
				<CardTitle>Admin Settings</CardTitle>
				<CardDescription>Placeholder for system-wide exports, database settings, and permission controls.</CardDescription>
			</CardHeader>
			<CardContent className="text-sm leading-6 text-slate-600">
				This page is intentionally reserved for admin-only controls and should stay separate from manager settings.
			</CardContent>
		</Card>
	);
}
