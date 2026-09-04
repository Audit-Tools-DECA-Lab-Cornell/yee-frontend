import { expect, test } from "@playwright/test";

import { generatePlaceComparisonPdf } from "../../src/features/reporting/export/pdf/place-comparison-pdf";
import { generateTrendPdf } from "../../src/features/reporting/export/pdf/trend-pdf";
import { generateAuditComparisonPdf } from "../../src/features/reporting/export/pdf/audit-comparison-pdf";
import {
	generatePlaceComparisonXlsx,
	generateTrendXlsx,
	generateAuditComparisonXlsx
} from "../../src/features/reporting/export/excel/comparison-xlsx";
import { buildPlaceComparisonSummaries } from "../../src/features/reporting/export/comparison-metrics";
import { buildTrendCsv } from "../../src/features/reporting/export/csv-builders";
import { getExportPalette } from "../../src/features/reporting/export/export-palette";
import { comparisonRecords } from "../fixtures/export-comparison";
import type { PlaceComparisonAuditRecord } from "../../src/features/workspaces/api/live-api";

const palette = getExportPalette();
const scope = {
	line: "All Projects, All Places, All Auditors, Last 6 months",
	auditCount: comparisonRecords.length,
	placeCount: 2
};

async function bytes(blob: Blob): Promise<Buffer> {
	return Buffer.from(await blob.arrayBuffer());
}
function expectPdf(buf: Buffer) {
	expect(buf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
	expect(buf.length).toBeGreaterThan(2000);
}
function expectXlsx(buf: Buffer) {
	expect(buf[0]).toBe(0x50);
	expect(buf[1]).toBe(0x4b);
}

test("R2 place comparison PDF + XLSX generate", async () => {
	const input = { summaries: buildPlaceComparisonSummaries(comparisonRecords), audits: comparisonRecords, scope };
	expectPdf(await bytes(await generatePlaceComparisonPdf(input, palette)));
	expectXlsx(await bytes(generatePlaceComparisonXlsx(input, palette)));
});

test("R3 trend PDF + XLSX generate", async () => {
	const input = {
		placeName: "Riverside Park",
		projectName: "Downtown Greening",
		records: comparisonRecords.filter(r => r.place_id === "place-a"),
		scope
	};
	expectPdf(await bytes(await generateTrendPdf(input, palette)));
	expectXlsx(await bytes(generateTrendXlsx(input, palette)));
});

test("R4 audit comparison PDF + XLSX generate with two selected audits", async () => {
	const input = { records: comparisonRecords.slice(0, 2), scope };
	expectPdf(await bytes(await generateAuditComparisonPdf(input, palette)));
	const xlsx = await bytes(generateAuditComparisonXlsx(input, palette));
	expectXlsx(xlsx);
	// The two-audit case emits an explicit delta column.
	expect(xlsx.toString("latin1")).toContain("Domain deltas");
});

test("comparison exports exclude unavailable maxima from means and emit unavailable markers", () => {
	const baseline = comparisonRecords[0];
	const unavailable: PlaceComparisonAuditRecord = {
		...baseline,
		audit_id: "audit-unavailable",
		total_raw_maximum: 0,
		total_weighted_maximum: Number.NaN,
		raw_domain_maximums: {
			...baseline.raw_domain_maximums,
			access: Number.POSITIVE_INFINITY
		}
	};
	const summaries = buildPlaceComparisonSummaries([baseline, unavailable]);
	const summary = summaries[0];

	expect(summary.avgRawPercent).toBeCloseTo((baseline.total_raw_score / baseline.total_raw_maximum) * 100, 1);
	expect(summary.rawPercentByDomain.access).toBeCloseTo(
		(baseline.raw_domain_scores.access / baseline.raw_domain_maximums.access) * 100,
		1
	);

	const csv = buildTrendCsv([unavailable]);
	expect(csv).toContain("raw_percent,youth_weighted_score,youth_weighted_percent");
	expect(csv).toContain("—");
	expect(csv).not.toContain("0.0%");
});
