import { expect, test } from "@playwright/test";

import { generateAuditBatchZip } from "../../src/features/reporting/export/batch";
import { getExportPalette } from "../../src/features/reporting/export/export-palette";
import { estimateBulkExport, ENTITY_WARN_THRESHOLD } from "../../src/features/reporting/export/export-estimator";
import { sampleInstrument, sampleSubmission } from "../fixtures/export-submission";

const palette = getExportPalette();

test("bulk ZIP includes one file per audit and collects per-audit failures", async () => {
	const fetchSubmission = async (auditId: string) => {
		if (auditId === "missing") throw new Error("Audit not found");
		return { ...sampleSubmission, id: auditId };
	};

	const progress: number[] = [];
	const result = await generateAuditBatchZip({
		auditIds: ["a1", "a2", "missing"],
		fetchSubmission,
		instrument: sampleInstrument,
		palette,
		concurrency: 2,
		onProgress: p => progress.push(p.completed)
	});

	expect(result.failures).toHaveLength(1);
	expect(result.failures[0].auditId).toBe("missing");
	expect(result.fileCount).toBe(2); // PDF-only default, failed audit skipped
	const bytes = Buffer.from(await result.zipBlob.arrayBuffer());
	expect(bytes[0]).toBe(0x50);
	expect(bytes[1]).toBe(0x4b);
	expect(progress.at(-1)).toBe(3); // progress reported for every audit
});

test("bulk ZIP with includeExcel emits two files per audit", async () => {
	const fetchSubmission = async (auditId: string) => ({ ...sampleSubmission, id: auditId });
	const result = await generateAuditBatchZip({
		auditIds: ["a1", "a2"],
		fetchSubmission,
		instrument: sampleInstrument,
		palette,
		includeExcel: true
	});
	expect(result.fileCount).toBe(4);
});

test("estimator warns above the entity threshold", () => {
	expect(estimateBulkExport(ENTITY_WARN_THRESHOLD).shouldWarn).toBe(false);
	const over = estimateBulkExport(ENTITY_WARN_THRESHOLD + 1);
	expect(over.shouldWarn).toBe(true);
	expect(over.reasons.length).toBeGreaterThan(0);
});
