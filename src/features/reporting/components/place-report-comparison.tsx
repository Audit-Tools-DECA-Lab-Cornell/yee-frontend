"use client";

import * as React from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DomainLedger } from "@/features/reporting/components/domain-ledger";
import { SubmittedReportsBrowser } from "@/features/reporting/components/submitted-reports-browser";
import {
	MAX_COMPARISON_REPORTS,
	MIN_COMPARISON_REPORTS,
	canCompareReports,
	hasStaleAppliedSelection,
	toggleReportSelection
} from "@/features/reporting/report-selection";
import type { PlaceComparisonAuditRecord } from "@/features/workspaces/api/live-api";

function selectionStatus(selectedCount: number, stale: boolean, limitReached: boolean): string {
	if (limitReached || selectedCount >= MAX_COMPARISON_REPORTS) {
		return `Maximum ${MAX_COMPARISON_REPORTS} reports selected. Remove one to choose another.`;
	}
	if (stale) return "Selection changed. Apply the comparison again to update the domain ledger.";
	if (selectedCount === 0) return `Select ${MIN_COMPARISON_REPORTS} to ${MAX_COMPARISON_REPORTS} reports to compare.`;
	if (selectedCount < MIN_COMPARISON_REPORTS) return "1 report selected. Select one more to compare.";
	return `${selectedCount} reports selected. Ready to compare.`;
}

function PlaceReportComparison({ records }: { records: PlaceComparisonAuditRecord[] }) {
	const [selectedIds, setSelectedIds] = React.useState<readonly string[]>([]);
	const [appliedIds, setAppliedIds] = React.useState<readonly string[] | null>(null);
	const [limitReached, setLimitReached] = React.useState(false);
	const headingRef = React.useRef<HTMLHeadingElement>(null);
	const focusRequestedRef = React.useRef(false);
	const stale = appliedIds !== null && hasStaleAppliedSelection(selectedIds, appliedIds);
	const comparisonRecords = React.useMemo(
		() => (appliedIds === null || stale ? [] : records.filter(record => appliedIds.includes(record.audit_id))),
		[appliedIds, records, stale]
	);

	React.useEffect(() => {
		if (!focusRequestedRef.current || comparisonRecords.length < MIN_COMPARISON_REPORTS) return;
		focusRequestedRef.current = false;
		headingRef.current?.focus();
	}, [comparisonRecords]);

	function handleToggle(auditId: string) {
		const result = toggleReportSelection(selectedIds, auditId);
		setSelectedIds(result.selectedIds);
		setLimitReached(result.limitReached);
	}

	function handleClear() {
		focusRequestedRef.current = false;
		setSelectedIds([]);
		setAppliedIds(null);
		setLimitReached(false);
	}

	function handleCompare() {
		if (!canCompareReports(selectedIds)) return;
		focusRequestedRef.current = true;
		setAppliedIds([...selectedIds]);
		setLimitReached(false);
	}

	return (
		<div className="space-y-6">
			<SubmittedReportsBrowser
				records={records}
				selectedIds={selectedIds}
				selectionStatus={selectionStatus(selectedIds.length, stale, limitReached)}
				canCompare={canCompareReports(selectedIds)}
				onToggle={handleToggle}
				onClear={handleClear}
				onCompare={handleCompare}
			/>

			{comparisonRecords.length >= MIN_COMPARISON_REPORTS ? (
				<Card className="rounded-md border-border/80 bg-white shadow-sm">
					<CardHeader>
						<CardTitle>
							<h2
								ref={headingRef}
								tabIndex={-1}
								className="outline-none focus-visible:ring-2 focus-visible:ring-ring">
								Domain comparison
							</h2>
						</CardTitle>
						<CardDescription>
							Compare the selected audits across six fixed domains. Each percentage uses that
							audit&rsquo;s own available maximum; the supporting fraction stays visible in every score
							cell.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<DomainLedger records={comparisonRecords} />
					</CardContent>
				</Card>
			) : null}
		</div>
	);
}

export { PlaceReportComparison };
