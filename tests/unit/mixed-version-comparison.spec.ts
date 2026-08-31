/**
 * Mixed-instrument-version place comparison (Plan 3, step 5.5).
 *
 * Audits stamped with different instrument versions can be scored out of
 * different maxima. Every average must be computed against each audit's own
 * maximum, and no figure on screen may be labelled with a denominator borrowed
 * from one arbitrary audit in the selection.
 */
import { expect, test } from "@playwright/test";

import { getComparisonAverages, domainOrder } from "../../src/features/reporting/reporting";
import { comparisonRecords } from "../fixtures/export-comparison";
import type { PlaceComparisonAuditRecord } from "../../src/features/workspaces/api/live-api";

const [baseline] = comparisonRecords;

/** The same audit re-scored out of double the maximum, as a later version might. */
function doubledMaximums(record: PlaceComparisonAuditRecord, auditId: string): PlaceComparisonAuditRecord {
	return {
		...record,
		audit_id: auditId,
		total_raw_maximum: record.total_raw_maximum * 2,
		raw_domain_maximums: Object.fromEntries(
			domainOrder.map(domain => [domain, record.raw_domain_maximums[domain] * 2])
		) as PlaceComparisonAuditRecord["raw_domain_maximums"]
	};
}

test("one shared version still reports a labelled maximum", () => {
	const averages = getComparisonAverages([baseline, { ...baseline, audit_id: "audit-same-version" }]);

	expect(averages?.hasSharedMaximums).toBe(true);
	expect(averages?.totalRawMaximum).toBe(baseline.total_raw_maximum);
	for (const domain of domainOrder) {
		expect(averages?.sharedRawDomainMaximums[domain]).toBe(baseline.raw_domain_maximums[domain]);
	}
});

test("mixed versions expose no shared maximum to label an average with", () => {
	const averages = getComparisonAverages([baseline, doubledMaximums(baseline, "audit-v2")]);

	expect(averages?.hasSharedMaximums).toBe(false);
	expect(averages?.totalRawMaximum).toBeNull();
	for (const domain of domainOrder) {
		expect(averages?.sharedRawDomainMaximums[domain]).toBeNull();
	}
});

test("each audit's percentage is measured against its own maximum", () => {
	const doubled = doubledMaximums(baseline, "audit-v2");
	const averages = getComparisonAverages([baseline, doubled]);

	for (const domain of domainOrder) {
		const own =
			(100 * baseline.raw_domain_scores[domain]) / baseline.raw_domain_maximums[domain] / 2 +
			(100 * doubled.raw_domain_scores[domain]) / doubled.raw_domain_maximums[domain] / 2;
		expect(averages?.avgRawPercentByDomain[domain]).toBeCloseTo(Number(own.toFixed(1)), 5);
	}

	const totalOwn =
		(100 * baseline.total_raw_score) / baseline.total_raw_maximum / 2 +
		(100 * doubled.total_raw_score) / doubled.total_raw_maximum / 2;
	expect(averages?.totalRawPercentAverage).toBeCloseTo(Number(totalOwn.toFixed(1)), 5);
});

test("borrowing the first audit's maximum would misreport the average", () => {
	const doubled = doubledMaximums(baseline, "audit-v2");
	const averages = getComparisonAverages([baseline, doubled]);
	const domain = domainOrder[0];

	// What the old panel showed: mean raw points over audit[0]'s maximum. The
	// correct figure is lower, because half the audits are scored out of twice
	// as much. Guarding the gap keeps the two from being confused again.
	const borrowed = (100 * (averages?.avgRawByDomain[domain] ?? 0)) / baseline.raw_domain_maximums[domain];
	expect(averages?.avgRawPercentByDomain[domain]).toBeLessThan(borrowed);
});

test("a zero maximum contributes zero rather than a division by zero", () => {
	const zeroed: PlaceComparisonAuditRecord = {
		...baseline,
		audit_id: "audit-zero",
		total_raw_maximum: 0,
		raw_domain_maximums: Object.fromEntries(
			domainOrder.map(domain => [domain, 0])
		) as PlaceComparisonAuditRecord["raw_domain_maximums"]
	};
	const averages = getComparisonAverages([zeroed]);

	expect(averages?.totalRawPercentAverage).toBe(0);
	for (const domain of domainOrder) {
		expect(averages?.avgRawPercentByDomain[domain]).toBe(0);
	}
});
