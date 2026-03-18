import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReportsPage() {
	return (
		<div className="grid gap-6 lg:grid-cols-2">
			<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
				<CardHeader>
					<CardTitle>Report snapshots</CardTitle>
					<CardDescription>Manager-facing score summaries and comparison tools will live here.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4 text-sm leading-6 text-slate-600">
					<div className="rounded-2xl bg-slate-50 p-4">
						<p className="font-medium text-slate-900">Healthy Streets</p>
						<p className="mt-1">Average audit score: 82/100</p>
					</div>
					<div className="rounded-2xl bg-slate-50 p-4">
						<p className="font-medium text-slate-900">Urban Futures</p>
						<p className="mt-1">Average audit score: 79/100</p>
					</div>
				</CardContent>
			</Card>

			<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
				<CardHeader>
					<CardTitle>Comparison status</CardTitle>
					<CardDescription>Placeholder for project-level comparisons and export actions.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					<Badge className="rounded-full bg-sky-100 px-3 py-1 text-sky-700 hover:bg-sky-100">
						Export tools coming next
					</Badge>
					<p className="text-sm leading-6 text-slate-600">
						Use this page later for charts, period comparisons, subsection score breakdowns, and CSV exports.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
