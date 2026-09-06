export const MIN_COMPARISON_REPORTS = 2;
export const MAX_COMPARISON_REPORTS = 12;

export type ReportSelectionResult = {
	readonly selectedIds: readonly string[];
	readonly limitReached: boolean;
};

export function toggleReportSelection(selectedIds: readonly string[], reportId: string): ReportSelectionResult {
	const currentIds = [...new Set(selectedIds)];

	if (currentIds.includes(reportId)) {
		return {
			selectedIds: currentIds.filter(selectedId => selectedId !== reportId),
			limitReached: false
		};
	}

	if (currentIds.length >= MAX_COMPARISON_REPORTS) {
		return { selectedIds: currentIds, limitReached: true };
	}

	return { selectedIds: [...currentIds, reportId], limitReached: false };
}

export function canCompareReports(selectedIds: readonly string[]): boolean {
	const selectionCount = new Set(selectedIds).size;
	return selectionCount >= MIN_COMPARISON_REPORTS && selectionCount <= MAX_COMPARISON_REPORTS;
}

export function hasStaleAppliedSelection(pendingIds: readonly string[], appliedIds: readonly string[]): boolean {
	const pendingIdSet = new Set(pendingIds);
	const appliedIdSet = new Set(appliedIds);
	if (pendingIdSet.size !== appliedIdSet.size) return true;
	return [...pendingIdSet].some(pendingId => !appliedIdSet.has(pendingId));
}
