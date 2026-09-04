import type { ColumnDef } from "@tanstack/react-table";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import type { PlaceComparisonAuditRecord, PlaceComparisonGroupRecord } from "@/features/workspaces/api/live-api";
import { domainLabels, domainOrder, getComparisonAverages } from "@/features/reporting/reporting";
import { DomainBadge } from "@/components/ui/domain-badge";
import { scoreBand } from "@/lib/score-band";
import { ScoreStack } from "@/components/ui/score-stack";
import { formatScoreFraction, SCORE_UNAVAILABLE, scorePercent } from "@/lib/score-format";

function clampPercentage(value: number) {
	return Math.max(0, Math.min(100, value));
}

function colorBand(percentage: number) {
	return scoreBand(percentage).fill;
}

function barHeight(value: number) {
	return `${Math.max(12, clampPercentage(value))}%`;
}

/**
 * Percent-first score display: the percentage leads (bold), the raw fraction
 * follows in parentheses (small, muted). A missing maximum renders
 * SCORE_UNAVAILABLE rather than a fabricated 0%.
 */
function ScoreLine({
	value,
	maximum,
	fractionDigits = 0
}: {
	value: number;
	maximum: number;
	fractionDigits?: number;
}) {
	return <ScoreStack value={value} max={maximum} fractionDigits={fractionDigits} size="sm" />;
}

/**
 * Percent-first average across the selected audits. The mean percentage always
 * leads; the mean fraction follows only when `sharedMaximum` is non-null, i.e.
 * every selected audit was scored out of that same maximum. Labelling a mean
 * with one audit's maximum would report a fraction no audit ever produced.
 */
function AverageScore({
	percent,
	average,
	sharedMaximum,
	fractionDigits = 0,
	percentClassName = "font-semibold text-foreground"
}: {
	percent: number | null;
	average: number | null;
	sharedMaximum: number | null;
	fractionDigits?: number;
	percentClassName?: string;
}) {
	const fraction =
		average === null || sharedMaximum === null
			? SCORE_UNAVAILABLE
			: formatScoreFraction(average, sharedMaximum, fractionDigits);
	return (
		<span className="flex flex-col gap-0.5 tabular-nums">
			<span className={`leading-none ${percentClassName}`}>
				{percent === null ? SCORE_UNAVAILABLE : `${percent}%`}
			</span>
			{fraction === SCORE_UNAVAILABLE ? null : (
				<span className="text-xs leading-tight text-muted-foreground">{fraction}</span>
			)}
		</span>
	);
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
				<ScoreLine value={row.original.total_raw_score} maximum={row.original.total_raw_maximum} />
			</span>
		)
	},
	{
		id: "weighted",
		header: "Total Youth Weighted Average",
		cell: ({ row }) => (
			<span className="text-muted-foreground tabular-nums">
				<ScoreLine
					value={row.original.total_weighted_score}
					maximum={row.original.total_weighted_maximum}
					fractionDigits={2}
				/>
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
				Raw <ScoreLine value={record.total_raw_score} maximum={record.total_raw_maximum} /> · Youth{" "}
				<ScoreLine
					value={record.total_weighted_score}
					maximum={record.total_weighted_maximum}
					fractionDigits={2}
				/>
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
			<Card className="rounded-md border-border bg-card shadow-sm">
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
				<Card className="rounded-md border-border bg-card shadow-sm">
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

			<Card className="rounded-md border-border bg-card shadow-sm">
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
							{
								label: "Lower range",
								tone: "bg-score-low-fill",
								text: "0% to 33% of the available score"
							},
							{
								label: "Middle range",
								tone: "bg-score-mid-fill",
								text: "34% to 66% of the available score"
							},
							{
								label: "Upper range",
								tone: "bg-score-high-fill",
								text: "67% to 100% of the available score"
							}
						].map(entry => (
							<div key={entry.label} className="rounded-md border border-border bg-muted/30 p-3">
								<div className="flex items-center gap-2">
									<span className={`h-3 w-3 rounded-full ${entry.tone}`} />
									<p className="text-sm font-medium text-foreground">{entry.label}</p>
								</div>
								<p className="mt-2 text-xs text-muted-foreground">{entry.text}</p>
							</div>
						))}
					</div>
					<div className="grid gap-4 lg:grid-cols-2">
						{records.map(record => {
							const rawPercent = scorePercent(record.total_raw_score, record.total_raw_maximum);
							const rawFraction = formatScoreFraction(record.total_raw_score, record.total_raw_maximum);
							const youthMax = record.total_weighted_maximum;
							const youthPercent = scorePercent(record.total_weighted_score, youthMax);
							const youthFraction = formatScoreFraction(record.total_weighted_score, youthMax, 2);
							return (
								<div key={record.audit_id} className="rounded-lg border border-border bg-card p-4">
									<div className="flex items-center justify-between gap-3">
										<div>
											<p className="text-sm font-semibold text-foreground">{record.auditor_id}</p>
											<p className="text-xs text-muted-foreground">{record.date}</p>
										</div>
										<Badge className="rounded-full bg-card px-3 py-1 text-foreground hover:bg-card">
											{record.place_name}
										</Badge>
									</div>
									<div className="mt-4 space-y-4">
										<div className="rounded-md border-4 border-border bg-card p-4">
											<p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
												Total Raw Score
											</p>
											<div className="mt-3 flex items-end gap-4">
												<div className="flex h-36 w-14 items-end rounded-full border border-border bg-muted/50 p-1">
													{rawPercent === null ? null : (
														<div
															className={`${colorBand(rawPercent)} w-full rounded-full`}
															style={{ height: barHeight(rawPercent) }}
														/>
													)}
												</div>
												<div className="space-y-1 text-muted-foreground">
													<p className="text-2xl font-semibold leading-none text-foreground">
														{rawPercent === null ? SCORE_UNAVAILABLE : `${rawPercent}%`}
													</p>
													{rawPercent === null ? null : (
														<p className="text-xs">({rawFraction})</p>
													)}
												</div>
											</div>
										</div>
										<div className="rounded-md border-4 border-score-high/40 bg-card p-4">
											<p className="text-xs font-medium uppercase tracking-[0.16em] text-score-high">
												Total Youth Weighted Average
											</p>
											<div className="mt-3 flex items-end gap-4">
												<div className="flex h-36 w-14 items-end rounded-full border border-score-high/30 bg-card p-1">
													{youthPercent === null ? null : (
														<div
															className={`${colorBand(youthPercent)} w-full rounded-full`}
															style={{ height: barHeight(youthPercent) }}
														/>
													)}
												</div>
												<div className="space-y-1 text-score-high">
													<p className="text-2xl font-semibold leading-none text-score-high">
														{youthPercent === null ? SCORE_UNAVAILABLE : `${youthPercent}%`}
													</p>
													{youthPercent === null ? null : (
														<p className="text-xs">({youthFraction})</p>
													)}
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

			<Card className="rounded-md border-border bg-card shadow-sm">
				<CardHeader>
					<CardTitle>Domain comparison</CardTitle>
					<CardDescription>
						Raw Score and Youth Weighted values for each selected audit, plus the average across the
						selected audits for each domain.
						{averages?.hasSharedMaximums === false || averages?.hasSharedWeightedMaximums === false
							? " These audits were completed with different sets of questions, so averages are shown as a percentage of each audit's own highest possible score."
							: null}
					</CardDescription>
				</CardHeader>
				<CardContent className="overflow-x-auto">
					<table className="min-w-full text-left text-sm">
						<thead className="text-muted-foreground">
							<tr className="border-b border-border">
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
								<tr key={domain} className="border-b border-border/60 last:border-0">
									<td className="py-4 pr-4">
										<DomainBadge domain={domain} label={domainLabels[domain]} />
									</td>
									{records.map(record => (
										<td
											key={`${record.audit_id}-${domain}`}
											className="py-4 pr-4 text-muted-foreground">
											<div>
												<ScoreLine
													value={record.raw_domain_scores[domain]}
													maximum={record.raw_domain_maximums[domain]}
												/>{" "}
												raw score
											</div>
											<div className="text-xs text-muted-foreground">
												<ScoreLine
													value={record.weighted_domain_scores[domain]}
													maximum={record.weighted_domain_maximums[domain]}
													fractionDigits={2}
												/>{" "}
												Youth Weighted average
											</div>
										</td>
									))}
									<td className="py-4 pr-4 text-muted-foreground">
										{averages === null ? null : (
											<AverageScore
												percent={averages.avgRawPercentByDomain[domain]}
												average={averages.avgRawByDomain[domain]}
												sharedMaximum={averages.sharedRawDomainMaximums[domain]}
											/>
										)}
									</td>
									<td className="py-4 text-muted-foreground">
										{averages === null ? null : (
											<AverageScore
												percent={averages.avgWeightedPercentByDomain[domain]}
												average={averages.avgWeightedByDomain[domain]}
												sharedMaximum={averages.sharedWeightedDomainMaximums[domain]}
												fractionDigits={2}
											/>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</CardContent>
			</Card>

			{averages ? (
				<div className="grid gap-4 md:grid-cols-2">
					<Card className="rounded-md border-border bg-card shadow-sm">
						<CardHeader>
							<CardTitle>Total score averages</CardTitle>
							<CardDescription>
								These totals are averaged across the selected audits for this place.
								{averages.totalRawMaximum === null || averages.totalWeightedMaximum === null
									? " The selected audits have different highest possible scores, so these averages are shown as percentages only."
									: null}
							</CardDescription>
						</CardHeader>
						<CardContent className="flex flex-wrap gap-3">
							<Badge className="rounded-full bg-muted px-3 py-1 text-foreground hover:bg-muted">
								Average raw:{" "}
								<AverageScore
									percent={averages.totalRawPercentAverage}
									average={averages.totalRawAverage}
									sharedMaximum={averages.totalRawMaximum}
									percentClassName="font-semibold"
								/>
							</Badge>
							<Badge className="rounded-full bg-score-high-bg px-3 py-1 text-score-high hover:bg-score-high-bg">
								Average youth weighted:{" "}
								<AverageScore
									percent={averages.totalWeightedPercentAverage}
									average={averages.totalWeightedAverage}
									sharedMaximum={averages.totalWeightedMaximum}
									fractionDigits={2}
									percentClassName="font-semibold"
								/>
							</Badge>
						</CardContent>
					</Card>
				</div>
			) : null}
		</div>
	);
}
