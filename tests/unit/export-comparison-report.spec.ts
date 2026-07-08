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
import { getExportPalette } from "../../src/features/reporting/export/export-palette";
import { comparisonRecords } from "../fixtures/export-comparison";

const palette = getExportPalette();
const scope = { line: "All Projects, All Places, All Auditors, Last 6 months", auditCount: comparisonRecords.length, placeCount: 2 };

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
