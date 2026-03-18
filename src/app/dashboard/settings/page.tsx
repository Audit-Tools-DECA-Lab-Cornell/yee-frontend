import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
	return (
		<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
			<CardHeader>
				<CardTitle className="text-2xl">Settings</CardTitle>
				<CardDescription className="max-w-2xl leading-6">
					This placeholder keeps navigation complete for now. It is ready for profile controls, role handling, and app
					preferences when those backend pieces are available.
				</CardDescription>
			</CardHeader>
			<CardContent className="text-sm leading-6 text-slate-600">
				Use this space later for account details, notification preferences, and admin-level controls.
			</CardContent>
		</Card>
	);
}
