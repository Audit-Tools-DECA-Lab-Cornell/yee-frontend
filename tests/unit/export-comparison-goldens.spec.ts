import { readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

import {
	buildAuditComparisonCsv,
	buildPlaceComparisonCsv,
	buildTrendCsv
} from "../../src/features/reporting/export/csv-builders";
import { buildPlaceComparisonSummaries } from "../../src/features/reporting/export/comparison-metrics";
import { comparisonRecords } from "../fixtures/export-comparison";

const readGolden = (name: string) => readFileSync(join(__dirname, "../fixtures", name), "utf8");

test("R2 place-comparison CSV is byte-identical to the legacy yee-place-comparison.csv", () => {
	const csv = buildPlaceComparisonCsv(buildPlaceComparisonSummaries(comparisonRecords));
	expect(csv).toBe(readGolden("golden-place-comparison.csv"));
});

test("R3 trend CSV is byte-identical to the legacy yee-audit-trend.csv", () => {
	expect(buildTrendCsv(comparisonRecords)).toBe(readGolden("golden-trend.csv"));
});

test("R4 audit-comparison CSV shares the legacy trend row format", () => {
	// Same rows, same format as the trend CSV (legacy yee-individual-audit-comparison.csv).
	expect(buildAuditComparisonCsv(comparisonRecords)).toBe(readGolden("golden-trend.csv"));
});

test("place summaries preserve the dashboard's sort (youth-weighted descending)", () => {
	const summaries = buildPlaceComparisonSummaries(comparisonRecords);
	expect(summaries.map(summary => summary.placeName)).toEqual(["Riverside Park", "Lincoln Square"]);
});
