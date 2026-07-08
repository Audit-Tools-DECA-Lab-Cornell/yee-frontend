import type { ColumnDef } from "@tanstack/react-table";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import type { PlaceComparisonAuditRecord, PlaceComparisonGroupRecord } from "@/features/workspaces/api/live-api";
import { domainLabels, domainOrder, getComparisonAverages } from "@/features/reporting/reporting";
import { yeeDomainThemes } from "@/features/yee-audit/config/yee-domain-theme";
import { scoreBand } from "@/lib/score-band";

function clampPercentage(value: number) {
	return Math.max(0, Math.min(100, value));
}

function colorBand(percentage: number) {
	return scoreBand(percentage).fill;
}

function barHeight(value: number) {
	return `${Math.max(12, clampPercentage(value))}%`;
}

const auditComparisonColumns: ColumnDef<PlaceComparisonAuditRecord>[] = [
	{
		accessorKey: "auditor_id",
		header: "Auditor ID",
		cell: ({ getValue }) => <span className="font-medium text-foreground">{String(getValue())}</span>
	},
	{
		accessorKey: "date",
		header: "Date",
		cell: ({ getValue }) => <span className="text-muted-foreground">{String(getValue())}</span>
	},
	{
		id: "raw",
		header: "Total Raw Score",
		cell: ({ row }) => (
			<span className="text-muted-foreground tabular-nums">
				{row.original.total_raw_score} / {row.original.total_raw_maximum}
			</span>
		)
	},
	{
		id: "weighted",
		header: "Total Youth Weighted Average",
		cell: ({ row }) => (
			<span className="text-muted-foreground tabular-nums">
				{row.original.total_weighted_score.toFixed(2)} / {row.original.total_weighted_maximum.toFixed(2)}
			</span>
		)
	}
];

function AuditComparisonMobileCard({ record }: { record: PlaceComparisonAuditRecord }) {
	return (
		<div className="space-y-1.5 rounded-md border border-border bg-card p-4">
			<div className="flex items-center justify-between gap-3">
				<p className="font-medium text-foreground">{record.auditor_id}</p>
				<span className="text-xs text-muted-foreground">{record.date}</span>
			</div>
			<p className="text-sm tabular-nums text-muted-foreground">
				Raw {record.total_raw_score} / {record.total_raw_maximum} · Youth{" "}
				{record.total_weighted_score.toFixed(2)} / {record.total_weighted_maximum.toFixed(2)}
			</p>
		</div>
	);
}

export function PlaceComparisonPanel({
	group,
	hideAuditTable = false
}: {
	group: PlaceComparisonGroupRecord;
	/** Skip the leading audit table (used on the place detail page, where the
	 * "Submitted reports" card already lists the same audits). */
	hideAuditTable?: boolean;
}) {
	const records = group.audits;
	const averages = getComparisonAverages(records);

	if (records.length === 0) {
		return (
			<Card className="rounded-md border-slate-200/80 bg-white shadow-sm">
				<CardHeader>
					<CardTitle>Place comparison</CardTitle>
					<CardDescription>No comparison audits are available for this place yet.</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			{hideAuditTable ? null : (
				<Card className="rounded-md border-slate-200/80 bg-white shadow-sm">
					<CardHeader>
						<CardTitle>Place-level comparison</CardTitle>
						<CardDescription>
							Compare audits for {group.place_name} using generated auditor IDs only. Raw and Youth
							Weighted totals stay separate in this view.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<DataTable
							columns={auditComparisonColumns}
							data={records}
							getRowId={row => row.audit_id}
							hideColumnMenu
							emptyState={
								<EmptyState
									title="No audits"
									description="No comparison audits are available for this place yet."
								/>
							}
							mobileCard={record => <AuditComparisonMobileCard record={record} />}
						/>
					</CardContent>
				</Card>
			)}

			<Card className="rounded-md border-slate-200/80 bg-white shadow-sm">
				<CardHeader>
					<CardTitle>Score bar graphs</CardTitle>
					<CardDescription>
						Each audit shows percentage bars for both Total Raw scores and Total Youth Weighted averages.
						The full column is 100% of the available score or average cap, and the colored fill shows how
						much of that available amount was reached.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="grid gap-3 md:grid-cols-3">
						{[
							{ label: "Lower range", tone: "bg-score-low", text: "0% to 33% of the available score" },
							{ label: "Middle range", tone: "bg-score-mid", text: "34% to 66% of the available score" },
							{ label: "Upper range", tone: "bg-score-high", text: "67% to 100% of the available score" }
						].map(entry => (
							<div key={entry.label} className="rounded-md border border-border bg-muted/30 p-3">
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
							const rawPercent = record.total_raw_maximum
								? (record.total_raw_score / record.total_raw_maximum) * 100
								: 0;
							const youthMax = record.total_weighted_maximum;
							const youthPercent = youthMax ? (record.total_weighted_score / youthMax) * 100 : 0;
							return (
								<div key={record.audit_id} className="rounded-lg border border-slate-200 bg-white p-4">
									<div className="flex items-center justify-between gap-3">
										<div>
											<p className="text-sm font-semibold text-slate-900">{record.auditor_id}</p>
											<p className="text-xs text-slate-600">{record.date}</p>
										</div>
										<Badge className="rounded-full bg-white px-3 py-1 text-slate-700 hover:bg-white">
											{record.place_name}
										</Badge>
									</div>
									<div className="mt-4 space-y-4">
										<div className="rounded-md border-4 border-slate-300 bg-white p-4">
											<p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
												Total Raw Score
											</p>
											<div className="mt-3 flex items-end gap-4">
												<div className="flex h-36 w-14 items-end rounded-full border border-slate-200 bg-slate-50 p-1">
													<div
														className={`${colorBand(rawPercent)} w-full rounded-full`}
														style={{ height: barHeight(rawPercent) }}
													/>
												</div>
												<div className="space-y-1 text-xs text-slate-600">
													<p className="font-medium text-slate-900">
														{record.total_raw_score} / {record.total_raw_maximum}
													</p>
													<p>
														{rawPercent.toFixed(0)}% ({record.total_raw_score}/
														{record.total_raw_maximum})
													</p>
												</div>
											</div>
										</div>
										<div className="rounded-md border-4 border-emerald-300 bg-white p-4">
											<p className="text-xs font-medium uppercase tracking-[0.16em] text-emerald-700">
												Total Youth Weighted Average
											</p>
											<div className="mt-3 flex items-end gap-4">
												<div className="flex h-36 w-14 items-end rounded-full border border-emerald-200 bg-white/90 p-1">
													<div
														className={`${colorBand(youthPercent)} w-full rounded-full`}
														style={{ height: barHeight(youthPercent) }}
													/>
												</div>
												<div className="space-y-1 text-xs text-emerald-800">
													<p className="font-medium text-emerald-900">
														{record.total_weighted_score.toFixed(2)} / {youthMax.toFixed(2)}
													</p>
													<p>
														{youthPercent.toFixed(0)}% (
														{record.total_weighted_score.toFixed(2)}/{youthMax.toFixed(2)})
													</p>
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

			<Card className="rounded-md border-slate-200/80 bg-white shadow-sm">
				<CardHeader>
					<CardTitle>Domain comparison</CardTitle>
					<CardDescription>
						Raw Score and Youth Weighted values for each selected audit, plus the average across the
						selected audits for each domain.
					</CardDescription>
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
								<th className="py-3 pr-4 font-medium">Average Raw Score Across Selected Audits</th>
								<th className="py-3 font-medium">
									Average Youth Weighted Average Across Selected Audits
								</th>
							</tr>
						</thead>
						<tbody>
							{domainOrder.map(domain => (
								<tr key={domain} className="border-b border-slate-100 last:border-0">
									<td className="py-4 pr-4">
										<span
											className="inline-flex rounded-full border px-3 py-1 text-sm font-medium"
											style={{
												borderColor: yeeDomainThemes[domain].strongFillHex,
												backgroundColor: yeeDomainThemes[domain].lightHex,
												color: yeeDomainThemes[domain].strongHex
											}}>
											{domainLabels[domain]}
										</span>
									</td>
									{records.map(record => (
										<td key={`${record.audit_id}-${domain}`} className="py-4 pr-4 text-slate-600">
											<div>
												{record.raw_domain_scores[domain]} /{" "}
												{record.raw_domain_maximums[domain]} raw score
											</div>
											<div className="text-xs text-slate-500">
												{record.weighted_domain_scores[domain].toFixed(2)} /{" "}
												{record.weighted_domain_maximums[domain].toFixed(2)} Youth Weighted
												average
											</div>
										</td>
									))}
									<td className="py-4 pr-4 text-slate-600">
										{averages?.avgRawByDomain[domain]} / {records[0].raw_domain_maximums[domain]}
									</td>
									<td className="py-4 text-slate-600">
										{averages?.avgWeightedByDomain[domain].toFixed(2)} average
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</CardContent>
			</Card>

			{averages ? (
				<div className="grid gap-4 md:grid-cols-2">
					<Card className="rounded-md border-slate-200/80 bg-white shadow-sm">
						<CardHeader>
							<CardTitle>Total score averages</CardTitle>
							<CardDescription>
								These totals are averaged across the selected audits for this place.
							</CardDescription>
						</CardHeader>
						<CardContent className="flex flex-wrap gap-3">
							<Badge className="rounded-full bg-slate-100 px-3 py-1 text-slate-700 hover:bg-slate-100">
								Average raw: {averages.totalRawAverage}
							</Badge>
							<Badge className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700 hover:bg-emerald-100">
								Average youth weighted: {averages.totalWeightedAverage.toFixed(2)}
							</Badge>
						</CardContent>
					</Card>
				</div>
			) : null}
		</div>
	);
}
