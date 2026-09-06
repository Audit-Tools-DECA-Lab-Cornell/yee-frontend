"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import type { PlaceComparisonAuditRecord, PlaceComparisonGroupRecord } from "@/features/workspaces/api/live-api";
import { getComparisonAverages } from "@/features/reporting/reporting";
import { AuditScoreChart } from "@/features/reporting/components/audit-score-chart";
import { DomainLedger } from "@/features/reporting/components/domain-ledger";
import { ScoreStack } from "@/components/ui/score-stack";
import { formatScoreFraction, SCORE_UNAVAILABLE } from "@/lib/score-format";

/**
 * Percent-first score display: the percentage leads (bold), the raw fraction
 * follows beneath it (small, muted). A missing maximum renders
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
 * A headline average across the selected audits.
 *
 * The mean percentage always leads; the mean fraction follows only when
 * `sharedMaximum` is non-null, i.e. every selected audit was scored out of that
 * same maximum. Labelling a mean with one audit's maximum would report a
 * fraction no audit ever produced.
 */
function AverageStat({
	label,
	percent,
	average,
	sharedMaximum,
	validCount,
	totalCount,
	fractionDigits = 0
}: {
	label: string;
	percent: number | null;
	average: number | null;
	sharedMaximum: number | null;
	validCount: number;
	totalCount: number;
	fractionDigits?: number;
}) {
	const fraction =
		average === null || sharedMaximum === null
			? SCORE_UNAVAILABLE
			: formatScoreFraction(average, sharedMaximum, fractionDigits);
	const detail =
		validCount === 0
			? "Score unavailable"
			: validCount < totalCount
				? `${validCount} of ${totalCount} scores available`
				: fraction === SCORE_UNAVAILABLE
					? "Mixed maximums"
					: fraction;
	return (
		<div className="rounded-md border border-border bg-muted/30 px-4 py-3">
			<p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">{label}</p>
			<p className="mt-1 text-2xl leading-none font-semibold tabular-nums text-foreground">
				{percent === null ? SCORE_UNAVAILABLE : `${percent}%`}
			</p>
			<p className="mt-1 text-xs tabular-nums text-muted-foreground">{detail}</p>
		</div>
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
		cell: ({ row }) => <ScoreLine value={row.original.total_raw_score} maximum={row.original.total_raw_maximum} />
	},
	{
		id: "weighted",
		header: "Total Youth Weighted Average",
		cell: ({ row }) => (
			<ScoreLine
				value={row.original.total_weighted_score}
				maximum={row.original.total_weighted_maximum}
				fractionDigits={2}
			/>
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

export function PlaceComparisonPanel({ group }: { group: PlaceComparisonGroupRecord }) {
	const records = group.audits;
	const averages = React.useMemo(() => getComparisonAverages(records), [records]);

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

	const mixedMaximums = averages?.hasSharedMaximums === false || averages?.hasSharedWeightedMaximums === false;

	return (
		<div className="space-y-6">
			<Card className="rounded-md border-border bg-card shadow-sm">
				<CardHeader>
					<CardTitle>Place-level comparison</CardTitle>
					<CardDescription>
						Compare {records.length} selected audits for {group.place_name} using generated auditor IDs
						only. Raw and Youth Weighted totals stay separate in this view.
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

			<Card className="rounded-md border-border bg-card shadow-sm">
				<CardHeader>
					<CardTitle>Score comparison</CardTitle>
					<CardDescription>
						The {records.length} selected audits, ranked by raw score. Both bars run to 100% of each
						audit&rsquo;s own available score, so they can be read against one another.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{averages === null ? null : (
						<div className="grid gap-3 sm:grid-cols-2">
							<AverageStat
								label="Selected raw average"
								percent={averages.totalRawPercentAverage}
								average={averages.totalRawAverage}
								sharedMaximum={averages.totalRawMaximum}
								validCount={averages.totalRawValidCount}
								totalCount={records.length}
							/>
							<AverageStat
								label="Selected youth average"
								percent={averages.totalWeightedPercentAverage}
								average={averages.totalWeightedAverage}
								sharedMaximum={averages.totalWeightedMaximum}
								validCount={averages.totalWeightedValidCount}
								totalCount={records.length}
								fractionDigits={2}
							/>
						</div>
					)}
					<AuditScoreChart records={records} />
				</CardContent>
			</Card>

			<Card className="rounded-md border-border bg-card shadow-sm">
				<CardHeader>
					<CardTitle>Domain comparison</CardTitle>
					<CardDescription>
						Each selected audit is a row across the same six domains. Values are a percentage of that
						audit&rsquo;s own available score.
						{mixedMaximums
							? " Available maximums differ across some audits, so the supporting fractions remain visible."
							: null}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<DomainLedger records={records} />
				</CardContent>
			</Card>
		</div>
	);
}
