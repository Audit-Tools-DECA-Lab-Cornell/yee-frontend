import { expect, test } from "@playwright/test";

import { generateAuditPdf } from "../../src/features/reporting/export/pdf/audit-pdf";
import { generateAuditXlsx } from "../../src/features/reporting/export/excel/audit-xlsx";
import { getExportPalette } from "../../src/features/reporting/export/export-palette";
import { sampleInstrument, sampleSubmission } from "../fixtures/export-submission";

const input = { submission: sampleSubmission, instrument: sampleInstrument };
const palette = getExportPalette();

async function blobBytes(blob: Blob): Promise<Buffer> {
	return Buffer.from(await blob.arrayBuffer());
}

// jsPDF and xlsx-js-style run in Node; the chart rasterizer needs a browser
// canvas and is skipped gracefully here, so these assert the document assembly
// (headers, size). The browser e2e asserts the chart-bearing variant.

test("R1 PDF generates a valid, non-trivial %PDF document", async () => {
	const blob = await generateAuditPdf(input, palette, new Date("2026-07-07T00:00:00Z"));
	const bytes = await blobBytes(blob);
	expect(bytes.subarray(0, 5).toString("latin1")).toBe("%PDF-");
	expect(bytes.length).toBeGreaterThan(3000);
});

test("R1 Excel generates a valid PK-headered .xlsx with the four sheets", async () => {
	const blob = generateAuditXlsx(input, palette);
	const bytes = await blobBytes(blob);
	expect(bytes[0]).toBe(0x50);
	expect(bytes[1]).toBe(0x4b);
	// The four sheet names appear in the (uncompressed) workbook.xml parts.
	const text = bytes.toString("latin1");
	for (const sheet of ["Overview", "Scores", "Responses", "Comments"]) {
		expect(text).toContain(sheet);
	}
});

test("R1 PDF still generates when the instrument is unavailable", async () => {
	const blob = await generateAuditPdf({ submission: sampleSubmission, instrument: null }, palette);
	const bytes = await blobBytes(blob);
	expect(bytes.subarray(0, 5).toString("latin1")).toBe("%PDF-");
});
