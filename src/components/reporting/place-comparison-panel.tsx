import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PlaceComparisonGroupRecord } from "@/lib/dashboard/live-api";
import { domainLabels, domainOrder, getComparisonAverages } from "@/lib/dashboard/reporting";

export function PlaceComparisonPanel({ group }: { group: PlaceComparisonGroupRecord }) {
	const records = group.audits;
	const averages = getComparisonAverages(records);
	const maxRaw = Math.max(...records.map(record => record.total_raw_score), 1);
	const maxWeighted = Math.max(...records.map(record => record.total_weighted_score), 1);

	if (records.length === 0) {
		return (
			<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
				<CardHeader>
					<CardTitle>Place comparison</CardTitle>
					<CardDescription>No comparison audits are available for this place yet.</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
				<CardHeader>
					<CardTitle>Place-level comparison</CardTitle>
					<CardDescription>
						Compare audits for {group.place_name} using generated auditor IDs only. Raw and youth-weighted totals stay separate in this view.
					</CardDescription>
				</CardHeader>
				<CardContent className="overflow-x-auto">
					<table className="min-w-full text-left text-sm">
						<thead className="text-slate-500">
							<tr className="border-b border-slate-200">
								<th className="py-3 pr-4 font-medium">Auditor ID</th>
								<th className="py-3 pr-4 font-medium">Date</th>
								<th className="py-3 pr-4 font-medium">Total Raw</th>
								<th className="py-3 font-medium">Total Weighted</th>
							</tr>
						</thead>
						<tbody>
							{records.map(record => (
								<tr key={record.audit_id} className="border-b border-slate-100 last:border-0">
									<td className="py-4 pr-4 font-medium text-slate-900">{record.auditor_id}</td>
									<td className="py-4 pr-4 text-slate-600">{record.date}</td>
									<td className="py-4 pr-4 text-slate-600">{record.total_raw_score}</td>
									<td className="py-4 text-slate-600">{record.total_weighted_score}</td>
								</tr>
							))}
						</tbody>
					</table>
				</CardContent>
			</Card>

			<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
				<CardHeader>
					<CardTitle>Score bars</CardTitle>
					<CardDescription>
						These bars show score distribution across audits for this place. Final cap-score percentages can be layered in once the cap logic is finalized.
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-6 lg:grid-cols-2">
					<div className="space-y-4 rounded-2xl border border-slate-200 bg-[#f8fbf9] p-4">
						<p className="text-sm font-medium text-slate-900">Total Raw Score</p>
						{records.map(record => (
							<div key={`${record.audit_id}-raw`} className="space-y-1">
								<div className="flex items-center justify-between text-xs text-slate-600">
									<span>{record.auditor_id}</span>
									<span>{record.total_raw_score}</span>
								</div>
								<div className="h-2 rounded-full bg-slate-200">
									<div className="h-2 rounded-full bg-slate-900" style={{ width: `${(record.total_raw_score / maxRaw) * 100}%` }} />
								</div>
							</div>
						))}
					</div>
					<div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
						<p className="text-sm font-medium text-emerald-900">Total Youth-Weighted Score</p>
						{records.map(record => (
							<div key={`${record.audit_id}-weighted`} className="space-y-1">
								<div className="flex items-center justify-between text-xs text-emerald-800">
									<span>{record.auditor_id}</span>
									<span>{record.total_weighted_score}</span>
								</div>
								<div className="h-2 rounded-full bg-emerald-100">
									<div
										className="h-2 rounded-full bg-emerald-700"
										style={{ width: `${(record.total_weighted_score / maxWeighted) * 100}%` }}
									/>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
				<CardHeader>
					<CardTitle>Domain comparison</CardTitle>
					<CardDescription>Raw and weighted domain scores across audits plus averages.</CardDescription>
				</CardHeader>
				<CardContent className="overflow-x-auto">
					<table className="min-w-full text-left text-sm">
						<thead className="text-slate-500">
							<tr className="border-b border-slate-200">
								<th className="py-3 pr-4 font-medium">Domain</th>
								{records.map(record => (
									<th key={record.audit_id} className="py-3 pr-4 font-medium">
										{record.auditor_id}
									</th>
								))}
								<th className="py-3 pr-4 font-medium">Average Raw</th>
								<th className="py-3 font-medium">Average Weighted</th>
							</tr>
						</thead>
						<tbody>
							{domainOrder.map(domain => (
								<tr key={domain} className="border-b border-slate-100 last:border-0">
									<td className="py-4 pr-4 font-medium text-slate-900">{domainLabels[domain]}</td>
									{records.map(record => (
										<td key={`${record.audit_id}-${domain}`} className="py-4 pr-4 text-slate-600">
											<div>{record.raw_domain_scores[domain]} raw</div>
											<div className="text-xs text-slate-500">{record.weighted_domain_scores[domain]} weighted</div>
										</td>
									))}
									<td className="py-4 pr-4 text-slate-600">{averages?.avgRawByDomain[domain]}</td>
									<td className="py-4 text-slate-600">{averages?.avgWeightedByDomain[domain]}</td>
								</tr>
							))}
						</tbody>
					</table>
				</CardContent>
			</Card>

			{averages ? (
				<div className="grid gap-4 md:grid-cols-2">
					<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
						<CardHeader>
							<CardTitle>Total score averages</CardTitle>
							<CardDescription>Average total scores across selected audits for this place.</CardDescription>
						</CardHeader>
						<CardContent className="flex flex-wrap gap-3">
							<Badge className="rounded-full bg-slate-100 px-3 py-1 text-slate-700 hover:bg-slate-100">
								Average raw: {averages.totalRawAverage}
							</Badge>
							<Badge className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700 hover:bg-emerald-100">
								Average weighted: {averages.totalWeightedAverage}
							</Badge>
						</CardContent>
					</Card>
				</div>
			) : null}
		</div>
	);
}
