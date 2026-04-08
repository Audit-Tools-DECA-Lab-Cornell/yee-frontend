import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { YeeScorePreview } from "@/lib/yee-audit-config";
import { getScoreRows } from "@/lib/yee-scoring";

export function YeeScoreSummary({
	preview,
	title,
	description
}: {
	preview: YeeScorePreview;
	title: string;
	description: string;
}) {
	const rows = getScoreRows(preview);

	return (
		<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent className="space-y-5">
				<div className="overflow-x-auto">
					<table className="min-w-full text-left text-sm">
						<thead className="text-slate-500">
							<tr className="border-b border-slate-200">
								<th className="py-3 pr-4 font-medium">Domain</th>
								<th className="py-3 pr-4 font-medium">Raw Domain Score</th>
								<th className="py-3 font-medium">Youth Weighted Domain Score</th>
							</tr>
						</thead>
						<tbody>
							{rows.map(row => (
								<tr key={row.domain} className="border-b border-slate-100 last:border-0">
									<td className="py-4 pr-4 font-medium text-slate-900">{row.label}</td>
									<td className="py-4 pr-4 text-slate-600">{row.rawScore}</td>
									<td className="py-4 text-slate-600">{row.weightedScore}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
				<div className="grid gap-4 md:grid-cols-2">
					<div className="rounded-2xl bg-slate-50 p-4">
						<p className="text-sm text-slate-500">Total Enabling Environment Raw Score</p>
						<p className="mt-2 text-2xl font-semibold text-slate-950">{preview.totalRawScore}</p>
					</div>
					<div className="rounded-2xl bg-emerald-50 p-4">
						<p className="text-sm text-emerald-700">Total Enabling Environment Youth-Weighted Score</p>
						<p className="mt-2 text-2xl font-semibold text-emerald-900">{preview.totalWeightedScore}</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
