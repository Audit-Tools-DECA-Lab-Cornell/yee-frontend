import { expect, test } from "@playwright/test";

import {
	MAX_COMPARISON_REPORTS,
	MIN_COMPARISON_REPORTS,
	canCompareReports,
	hasStaleAppliedSelection,
	toggleReportSelection
} from "../../src/features/reporting/report-selection";

test("Given an unselected report, when it is toggled, then it is added without mutating the current selection", () => {
	// Given
	const current = ["audit-a"];

	// When
	const result = toggleReportSelection(current, "audit-b");

	// Then
	expect(result).toEqual({ selectedIds: ["audit-a", "audit-b"], limitReached: false });
	expect(current).toEqual(["audit-a"]);
});

test("Given a selected report, when it is toggled, then it is removed", () => {
	// Given
	const current = ["audit-a", "audit-b"];

	// When
	const result = toggleReportSelection(current, "audit-a");

	// Then
	expect(result).toEqual({ selectedIds: ["audit-b"], limitReached: false });
});

test("Given twelve selected reports, when another report is toggled, then the cap blocks only the addition", () => {
	// Given
	const current = Array.from({ length: MAX_COMPARISON_REPORTS }, (_, index) => `audit-${index + 1}`);

	// When
	const result = toggleReportSelection(current, "audit-13");

	// Then
	expect(MAX_COMPARISON_REPORTS).toBe(12);
	expect(result).toEqual({ selectedIds: current, limitReached: true });
});

test("Given twelve selected reports, when a selected report is toggled, then removal remains available", () => {
	// Given
	const current = Array.from({ length: MAX_COMPARISON_REPORTS }, (_, index) => `audit-${index + 1}`);

	// When
	const result = toggleReportSelection(current, "audit-6");

	// Then
	expect(result.limitReached).toBe(false);
	expect(result.selectedIds).toHaveLength(11);
	expect(result.selectedIds).not.toContain("audit-6");
});

test("Given fewer than two reports, when readiness is checked, then comparison is not ready", () => {
	// Given
	const selectedIds = ["audit-a"];

	// When
	const ready = canCompareReports(selectedIds);

	// Then
	expect(MIN_COMPARISON_REPORTS).toBe(2);
	expect(ready).toBe(false);
});

test("Given at least two reports, when readiness is checked, then comparison is ready", () => {
	// Given
	const selectedIds = ["audit-a", "audit-b", "audit-c"];

	// When
	const ready = canCompareReports(selectedIds);

	// Then
	expect(ready).toBe(true);
});

test("Given an applied comparison, when pending selection changes, then the applied selection is stale", () => {
	// Given
	const appliedIds = ["audit-a", "audit-b"];
	const pendingIds = ["audit-a", "audit-b", "audit-c"];

	// When
	const stale = hasStaleAppliedSelection(pendingIds, appliedIds);

	// Then
	expect(stale).toBe(true);
});

test("Given the same reports in a different order, when staleness is checked, then the applied selection stays current", () => {
	// Given
	const appliedIds = ["audit-a", "audit-b"];
	const pendingIds = ["audit-b", "audit-a"];

	// When
	const stale = hasStaleAppliedSelection(pendingIds, appliedIds);

	// Then
	expect(stale).toBe(false);
});
