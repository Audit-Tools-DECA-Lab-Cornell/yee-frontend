import { expect, test } from "@playwright/test";

import { buildDomainLedgerModel } from "../../src/features/reporting/domain-ledger-model";
import { domainOrder } from "../../src/features/reporting/reporting";
import type { PlaceComparisonAuditRecord } from "../../src/features/workspaces/api/live-api";
import { comparisonRecords } from "../fixtures/export-comparison";

const [baseline] = comparisonRecords;

test("Given twelve audit records, when the raw ledger is built, then every audit has six ordered domain cells", () => {
	// Given
	const records = Array.from({ length: 12 }, (_, index) => ({
		...baseline,
		audit_id: `audit-${index + 1}`,
		total_raw_score: index + 1
	}));

	// When
	const model = buildDomainLedgerModel(records, "raw");

	// Then
	expect(model.rows).toHaveLength(records.length);
	expect(new Set(model.rows.map(row => row.auditId))).toEqual(new Set(records.map(record => record.audit_id)));
	for (const row of model.rows) {
		expect(row.domains).toHaveLength(6);
		expect(row.domains.map(cell => cell.domain)).toEqual(domainOrder);
	}
});

test("Given raw scores with different maxima, when the ledger is built, then each audit uses its own maximum", () => {
	// Given
	const records: PlaceComparisonAuditRecord[] = [
		{
			...baseline,
			audit_id: "raw-100",
			total_raw_score: 50,
			total_raw_maximum: 100,
			raw_domain_scores: { ...baseline.raw_domain_scores, access: 5 },
			raw_domain_maximums: { ...baseline.raw_domain_maximums, access: 10 }
		},
		{
			...baseline,
			audit_id: "raw-200",
			total_raw_score: 50,
			total_raw_maximum: 200,
			raw_domain_scores: { ...baseline.raw_domain_scores, access: 5 },
			raw_domain_maximums: { ...baseline.raw_domain_maximums, access: 20 }
		}
	];

	// When
	const model = buildDomainLedgerModel(records, "raw");

	// Then
	expect(model.rows.find(row => row.auditId === "raw-100")?.overall).toMatchObject({
		percent: 50,
		fraction: "50 / 100"
	});
	expect(model.rows.find(row => row.auditId === "raw-200")?.overall).toMatchObject({
		percent: 25,
		fraction: "50 / 200"
	});
	expect(model.rows.find(row => row.auditId === "raw-100")?.domains[0]).toEqual({
		domain: "access",
		percent: 50,
		fraction: "5 / 10"
	});
	expect(model.rows.find(row => row.auditId === "raw-200")?.domains[0]).toEqual({
		domain: "access",
		percent: 25,
		fraction: "5 / 20"
	});
});

test("Given youth-weighted scores with different maxima, when the ledger is built, then each audit uses its own maximum", () => {
	// Given
	const records: PlaceComparisonAuditRecord[] = [
		{
			...baseline,
			audit_id: "youth-100",
			total_weighted_score: 0.5,
			total_weighted_maximum: 1,
			weighted_domain_scores: { ...baseline.weighted_domain_scores, access: 0.1 },
			weighted_domain_maximums: { ...baseline.weighted_domain_maximums, access: 0.2 }
		},
		{
			...baseline,
			audit_id: "youth-200",
			total_weighted_score: 0.5,
			total_weighted_maximum: 2,
			weighted_domain_scores: { ...baseline.weighted_domain_scores, access: 0.1 },
			weighted_domain_maximums: { ...baseline.weighted_domain_maximums, access: 0.4 }
		}
	];

	// When
	const model = buildDomainLedgerModel(records, "weighted");

	// Then
	expect(model.rows.find(row => row.auditId === "youth-100")?.overall).toMatchObject({
		percent: 50,
		fraction: "0.50 / 1.00"
	});
	expect(model.rows.find(row => row.auditId === "youth-200")?.overall).toMatchObject({
		percent: 25,
		fraction: "0.50 / 2.00"
	});
	expect(model.rows.find(row => row.auditId === "youth-100")?.domains[0]).toEqual({
		domain: "access",
		percent: 50,
		fraction: "0.10 / 0.20"
	});
	expect(model.rows.find(row => row.auditId === "youth-200")?.domains[0]).toEqual({
		domain: "access",
		percent: 25,
		fraction: "0.10 / 0.40"
	});
});

test("Given invalid maxima, when the raw ledger is built, then affected scores are unavailable", () => {
	// Given
	const invalid: PlaceComparisonAuditRecord = {
		...baseline,
		audit_id: "invalid",
		total_raw_maximum: 0,
		raw_domain_maximums: {
			access: 0,
			activitySpaces: -1,
			amenities: Number.NaN,
			experienceOfSpace: Number.POSITIVE_INFINITY,
			aestheticsAndCare: Number.NEGATIVE_INFINITY,
			useAndUsability: 0
		}
	};

	// When
	const model = buildDomainLedgerModel([invalid], "raw");

	// Then
	expect(model.rows[0]?.overall).toMatchObject({ percent: null, fraction: "—" });
	expect(model.rows[0]?.domains).toHaveLength(6);
	for (const cell of model.rows[0]?.domains ?? []) {
		expect(cell.percent).toBeNull();
		expect(cell.fraction).toBe("—");
	}
});

test("Given unsorted and unavailable audits, when the raw ledger is built, then rows sort overall descending with unavailable last", () => {
	// Given
	const records: PlaceComparisonAuditRecord[] = [
		{ ...baseline, audit_id: "unavailable", total_raw_score: 99, total_raw_maximum: 0 },
		{ ...baseline, audit_id: "low", total_raw_score: 10, total_raw_maximum: 100 },
		{ ...baseline, audit_id: "high", total_raw_score: 90, total_raw_maximum: 100 }
	];

	// When
	const model = buildDomainLedgerModel(records, "raw");

	// Then
	expect(model.rows.map(row => row.auditId)).toEqual(["high", "low", "unavailable"]);
});
