import { expect, test } from "@playwright/test";

import { buildDomainLedgerModel } from "../../src/features/reporting/domain-ledger-model";
import type { PlaceComparisonAuditRecord } from "../../src/features/workspaces/api/live-api";
import { SCORE_UNAVAILABLE } from "../../src/lib/score-format";
import { comparisonRecords } from "../fixtures/export-comparison";

const [baseline] = comparisonRecords;

function rawMaximumVariant(
	maximumMultiplier: number,
	overrides: Partial<PlaceComparisonAuditRecord> = {}
): PlaceComparisonAuditRecord {
	return {
		...baseline,
		audit_id: `raw-max-${maximumMultiplier}`,
		total_raw_maximum: baseline.total_raw_maximum * maximumMultiplier,
		raw_domain_maximums: Object.fromEntries(
			Object.entries(baseline.raw_domain_maximums).map(([domain, maximum]) => [
				domain,
				maximum * maximumMultiplier
			])
		) as PlaceComparisonAuditRecord["raw_domain_maximums"],
		...overrides
	};
}

test("shared maxima keep truthful average fractions", () => {
	const records = [baseline, { ...baseline, audit_id: "same-version" }];
	const rawModel = buildDomainLedgerModel(records, "raw");
	const weightedModel = buildDomainLedgerModel(records, "weighted");

	expect(rawModel.average?.overall).toEqual({ percent: 44.8, fraction: "56 / 125" });
	expect(rawModel.average?.domains[0]).toEqual({ domain: "access", percent: 46.7, fraction: "7 / 15" });
	expect(weightedModel.average?.overall).toEqual({ percent: 56.3, fraction: "1.03 / 1.83" });
	expect(weightedModel.average?.domains[0]).toEqual({
		domain: "access",
		percent: 46.7,
		fraction: "0.14 / 0.30"
	});
});

test("mixed maxima keep the average percentage but do not invent a fraction", () => {
	const model = buildDomainLedgerModel([baseline, rawMaximumVariant(2)], "raw");

	expect(model.average?.overall).toEqual({
		percent: 33.6,
		fraction: SCORE_UNAVAILABLE,
		detail: "Mixed maximums"
	});
	expect(model.average?.domains[0]).toEqual({
		domain: "access",
		percent: 35,
		fraction: SCORE_UNAVAILABLE,
		detail: "Mixed maximums"
	});
});

test("partially unavailable scores disclose the valid count", () => {
	const model = buildDomainLedgerModel([baseline, rawMaximumVariant(0, { audit_id: "unavailable" })], "raw");

	expect(model.average?.overall).toEqual({
		percent: 44.8,
		fraction: SCORE_UNAVAILABLE,
		detail: "1 of 2 scores available"
	});
	expect(model.average?.domains[0]).toEqual({
		domain: "access",
		percent: 46.7,
		fraction: SCORE_UNAVAILABLE,
		detail: "1 of 2 scores available"
	});
});

test("all unavailable scores produce an explicitly unavailable average", () => {
	const model = buildDomainLedgerModel([rawMaximumVariant(0, { audit_id: "unavailable" })], "raw");

	expect(model.average?.overall).toEqual({
		percent: null,
		fraction: SCORE_UNAVAILABLE,
		detail: "Score unavailable"
	});
	for (const domain of model.average?.domains ?? []) {
		expect(domain).toMatchObject({
			percent: null,
			fraction: SCORE_UNAVAILABLE,
			detail: "Score unavailable"
		});
	}
});
