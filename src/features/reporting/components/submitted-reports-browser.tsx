"use client";

import * as React from "react";

import { AuditScoreChart } from "@/features/reporting/components/audit-score-chart";
import {
	createSubmittedReportColumns,
	SubmittedReportMobileCard
} from "@/features/reporting/components/submitted-report-presenters";
import { MAX_COMPARISON_REPORTS } from "@/features/reporting/report-selection";
import type { PlaceComparisonAuditRecord } from "@/features/workspaces/api/live-api";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";

const PAGE_SIZE = 10;
const VIEW_OPTIONS = [
	{ label: "Table", value: "table" },
	{ label: "Chart", value: "chart" }
];

type ReportView = "table" | "chart";

type SubmittedReportsBrowserProps = {
	records: PlaceComparisonAuditRecord[];
	selectedIds: readonly string[];
	selectionStatus: string;
	canCompare: boolean;
	onToggle: (auditId: string) => void;
	onClear: () => void;
	onCompare: () => void;
};

function isReportView(value: string): value is ReportView {
	return value === "table" || value === "chart";
}

function matchesQuery(record: PlaceComparisonAuditRecord, query: string): boolean {
	const searchable = [record.auditor_id, record.participant_id, record.date, record.audit_id]
		.filter((value): value is string => Boolean(value))
		.join(" ")
		.toLocaleLowerCase();
	return searchable.includes(query);
}

function SubmittedReportsBrowser({
	records,
	selectedIds,
	selectionStatus,
	canCompare,
	onToggle,
	onClear,
	onCompare
}: SubmittedReportsBrowserProps) {
	const [view, setView] = React.useState<ReportView>("table");
	const [query, setQuery] = React.useState("");
	const [page, setPage] = React.useState(0);
	const selected = React.useMemo(() => new Set(selectedIds), [selectedIds]);
	const normalizedQuery = query.trim().toLocaleLowerCase();
	const filteredRecords = React.useMemo(
		() => (normalizedQuery ? records.filter(record => matchesQuery(record, normalizedQuery)) : records),
		[normalizedQuery, records]
	);
	const pageCount = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
	const currentPage = Math.min(page, pageCount - 1);
	const visibleRecords = filteredRecords.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
	const selectionFull = selectedIds.length >= MAX_COMPARISON_REPORTS;
	const columns = React.useMemo(
		() => createSubmittedReportColumns({ selectedIds: selected, selectionFull, onToggle }),
		[onToggle, selected, selectionFull]
	);

	return (
		<Card className="rounded-md border-border/80 bg-white shadow-sm">
			<CardHeader>
				<CardTitle>Submitted reports</CardTitle>
				<CardDescription>
					Open a report, inspect the score chart, or select 2 to 12 reports for a domain comparison.
				</CardDescription>
				{records.length > 0 ? (
					<CardAction>
						<SegmentedControl
							value={view}
							onValueChange={value => {
								if (isReportView(value)) setView(value);
							}}
							options={VIEW_OPTIONS}
							size="sm"
							aria-label="Submitted reports view"
						/>
					</CardAction>
				) : null}
			</CardHeader>
			<CardContent className="space-y-4">
				{records.length > PAGE_SIZE ? (
					<div className="flex flex-wrap items-center gap-3">
						<Input
							type="search"
							name="submitted-report-search"
							autoComplete="off"
							aria-label="Search submitted reports"
							placeholder="Search auditor, participant, or date"
							value={query}
							onChange={event => {
								setQuery(event.currentTarget.value);
								setPage(0);
							}}
							className="max-w-sm"
						/>
						<p className="text-sm text-muted-foreground tabular-nums">
							Showing {visibleRecords.length} of {filteredRecords.length} matching reports
						</p>
					</div>
				) : null}

				{view === "chart" && visibleRecords.length > 0 ? (
					<AuditScoreChart records={visibleRecords} />
				) : (
					<DataTable
						columns={columns}
						data={visibleRecords}
						getRowId={row => row.audit_id}
						enableSorting={false}
						hideColumnMenu
						emptyState={
							<EmptyState
								title={records.length === 0 ? "No reports yet" : "No matching reports"}
								description={
									records.length === 0
										? "Submitted YEE audit reports will appear here."
										: "Try a different auditor, participant, or date."
								}
							/>
						}
						mobileCard={record => (
							<SubmittedReportMobileCard
								record={record}
								selectedIds={selected}
								selectionFull={selectionFull}
								onToggle={onToggle}
							/>
						)}
					/>
				)}

				{filteredRecords.length > PAGE_SIZE ? (
					<div className="flex items-center justify-between gap-3">
						<p className="text-sm text-muted-foreground tabular-nums">
							Page {currentPage + 1} of {pageCount}
						</p>
						<div className="flex gap-2">
							<Button
								type="button"
								variant="outline"
								className="min-h-11"
								disabled={currentPage === 0}
								onClick={() => setPage(value => Math.max(0, value - 1))}>
								Previous
							</Button>
							<Button
								type="button"
								variant="outline"
								className="min-h-11"
								disabled={currentPage >= pageCount - 1}
								onClick={() => setPage(value => Math.min(pageCount - 1, value + 1))}>
								Next
							</Button>
						</div>
					</div>
				) : null}

				{records.length > 0 ? (
					<div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
						<p
							role="status"
							aria-live="polite"
							aria-atomic="true"
							className="text-sm text-muted-foreground">
							{selectionStatus}
						</p>
						<div className="flex flex-wrap gap-2">
							{selectedIds.length > 0 ? (
								<Button type="button" variant="quiet" className="min-h-11" onClick={onClear}>
									Clear selection
								</Button>
							) : null}
							<Button type="button" className="min-h-11" disabled={!canCompare} onClick={onCompare}>
								Compare selected
							</Button>
						</div>
					</div>
				) : null}
			</CardContent>
		</Card>
	);
}

export { SubmittedReportsBrowser };
export type { SubmittedReportsBrowserProps };
