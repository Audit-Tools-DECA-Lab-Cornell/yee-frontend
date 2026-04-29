import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PlaceComparisonGroupRecord } from "@/lib/dashboard/live-api";
import { domainLabels, domainOrder, getComparisonAverages } from "@/lib/dashboard/reporting";
import { totalRawScoreMaximum, totalYouthWeightedScoreMaximum } from "@/lib/yee-score-limits";

function clampPercentage(value: number) {
	return Math.max(0, Math.min(100, value));
}

function colorBand(percentage: number) {
	if (percentage < 34) return "bg-rose-400";
	if (percentage < 67) return "bg-amber-400";
	return "bg-emerald-500";
}

function barHeight(value: number) {
	return `${Math.max(12, clampPercentage(value))}%`;
}

export function PlaceComparisonPanel({ group }: { group: PlaceComparisonGroupRecord }) {
	const records = group.audits;
	const averages = getComparisonAverages(records);

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
						Compare audits for {group.place_name} using generated auditor IDs only. Raw and Youth Weighted totals stay separate in this view.
					</CardDescription>
				</CardHeader>
				<CardContent className="overflow-x-auto">
					<table className="min-w-full text-left text-sm">
						<thead className="text-slate-500">
							<tr className="border-b border-slate-200">
								<th className="py-3 pr-4 font-medium">Auditor ID</th>
								<th className="py-3 pr-4 font-medium">Date</th>
								<th className="py-3 pr-4 font-medium">Total Raw</th>
								<th className="py-3 font-medium">Total Youth Weighted</th>
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
						Each audit shows percentage bars for both Total Raw and Total Youth Weighted scores. The full column is 100% of the available score, and the colored fill shows how much of that available score was achieved.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="grid gap-3 md:grid-cols-3">
						{[
							{ label: "Lower range", tone: "bg-rose-400", text: "0% to 33% of the available score" },
							{ label: "Middle range", tone: "bg-amber-400", text: "34% to 66% of the available score" },
							{ label: "Upper range", tone: "bg-emerald-500", text: "67% to 100% of the available score" }
						].map(entry => (
							<div key={entry.label} className="rounded-2xl border border-slate-200 bg-[#f8fbf9] p-3">
								<div className="flex items-center gap-2">
									<span className={`h-3 w-3 rounded-full ${entry.tone}`} />
									<p className="text-sm font-medium text-slate-900">{entry.label}</p>
								</div>
								<p className="mt-2 text-xs text-slate-600">{entry.text}</p>
							</div>
						))}
					</div>
					<div className="grid gap-4 lg:grid-cols-2">
						{records.map(record => {
							const rawPercent = totalRawScoreMaximum ? (record.total_raw_score / totalRawScoreMaximum) * 100 : 0;
							const youthPercent = totalYouthWeightedScoreMaximum ? (record.total_weighted_score / totalYouthWeightedScoreMaximum) * 100 : 0;
							return (
								<div key={record.audit_id} className="rounded-[1.5rem] border border-slate-200 bg-[#f8fbf9] p-4">
									<div className="flex items-center justify-between gap-3">
										<div>
											<p className="text-sm font-semibold text-slate-900">{record.auditor_id}</p>
											<p className="text-xs text-slate-600">{record.date}</p>
										</div>
										<Badge className="rounded-full bg-white px-3 py-1 text-slate-700 hover:bg-white">{record.place_name}</Badge>
									</div>
									<div className="mt-4 grid gap-4 sm:grid-cols-2">
										<div className="rounded-[1.25rem] border border-slate-200 bg-white p-4">
											<p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Total Raw</p>
											<div className="mt-3 flex items-end gap-4">
												<div className="flex h-36 w-14 items-end rounded-full border border-slate-200 bg-slate-50 p-1">
													<div className={`${colorBand(rawPercent)} w-full rounded-full`} style={{ height: barHeight(rawPercent) }} />
												</div>
												<div className="space-y-1 text-xs text-slate-600">
													<p className="font-medium text-slate-900">{record.total_raw_score} / {totalRawScoreMaximum}</p>
													<p>{rawPercent.toFixed(0)}%</p>
												</div>
											</div>
										</div>
										<div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50/80 p-4">
											<p className="text-xs font-medium uppercase tracking-[0.16em] text-emerald-700">Total Youth Weighted</p>
											<div className="mt-3 flex items-end gap-4">
												<div className="flex h-36 w-14 items-end rounded-full border border-emerald-200 bg-white/90 p-1">
													<div className={`${colorBand(youthPercent)} w-full rounded-full`} style={{ height: barHeight(youthPercent) }} />
												</div>
												<div className="space-y-1 text-xs text-emerald-800">
													<p className="font-medium text-emerald-900">{record.total_weighted_score} / {totalYouthWeightedScoreMaximum}</p>
													<p>{youthPercent.toFixed(0)}%</p>
												</div>
											</div>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				</CardContent>
			</Card>

			<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
				<CardHeader>
					<CardTitle>Domain comparison</CardTitle>
					<CardDescription>Raw and Youth Weighted domain scores across audits plus averages.</CardDescription>
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
								<th className="py-3 font-medium">Average Youth Weighted</th>
							</tr>
						</thead>
						<tbody>
							{domainOrder.map(domain => (
								<tr key={domain} className="border-b border-slate-100 last:border-0">
									<td className="py-4 pr-4 font-medium text-slate-900">{domainLabels[domain]}</td>
									{records.map(record => (
										<td key={`${record.audit_id}-${domain}`} className="py-4 pr-4 text-slate-600">
											<div>{record.raw_domain_scores[domain]} raw</div>
											<div className="text-xs text-slate-500">{record.weighted_domain_scores[domain]} youth weighted</div>
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
								Average youth weighted: {averages.totalWeightedAverage}
							</Badge>
						</CardContent>
					</Card>
				</div>
			) : null}
		</div>
	);
}
