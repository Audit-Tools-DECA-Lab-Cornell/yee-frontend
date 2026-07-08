/**
 * Bulk audit export (D6). Fan-out N submission fetches (the comparison endpoint
 * has no item-level responses), generate each audit's R1 file with the SAME
 * generator as the single download, and pack them into one ZIP. Concurrency is
 * capped, progress is reported per file, and failed fetches are collected and
 * reported rather than aborting the whole archive.
 */
import type { InstrumentResponse } from "@/features/yee-audit/api/yee-instrument";
import type { YeeSubmissionRecord } from "@/features/yee-audit/api/yee-audit-api";

import { generateAuditXlsx } from "./excel/audit-xlsx";
import { buildExportFileName } from "./file-utils";
import { generateAuditPdf } from "./pdf/audit-pdf";
import { buildZip, type ZipEntry } from "./zip-builder";
import type { ExportPalette } from "./types";

export type BatchProgress = { completed: number; total: number; failed: number };
export type BatchFailure = { auditId: string; reason: string };
export type BatchResult = { zipBlob: Blob; failures: BatchFailure[]; fileCount: number };

/** Run `worker` over `items` with at most `limit` in flight at once. */
async function mapWithConcurrency<T>(items: T[], limit: number, worker: (item: T, index: number) => Promise<void>): Promise<void> {
	let cursor = 0;
	const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
		while (cursor < items.length) {
			const index = cursor;
			cursor += 1;
			await worker(items[index], index);
		}
	});
	await Promise.all(runners);
}

async function blobToBytes(blob: Blob): Promise<Uint8Array> {
	return new Uint8Array(await blob.arrayBuffer());
}

/**
 * Build a ZIP of per-audit R1 files. `fetchSubmission` is injected so this module
 * stays free of app fetch coupling. PDF-only by default (logistics §8 Q3);
 * `includeExcel` adds each audit's workbook too.
 */
export async function generateAuditBatchZip(options: {
	auditIds: string[];
	fetchSubmission: (auditId: string) => Promise<YeeSubmissionRecord>;
	instrument: InstrumentResponse | null;
	palette: ExportPalette;
	includeExcel?: boolean;
	concurrency?: number;
	generatedDate?: Date;
	onProgress?: (progress: BatchProgress) => void;
}): Promise<BatchResult> {
	const { auditIds, fetchSubmission, instrument, palette, includeExcel = false, concurrency = 4, generatedDate = new Date(), onProgress } = options;
	const total = auditIds.length;
	const entriesById = new Map<string, ZipEntry[]>();
	const failures: BatchFailure[] = [];
	let completed = 0;
	let failed = 0;

	await mapWithConcurrency(auditIds, concurrency, async auditId => {
		try {
			const submission = await fetchSubmission(auditId);
			const placeName = submission.place_name || submission.place_id;
			const input = { submission, instrument };
			const suffix = auditId.slice(0, 8);
			const entries: ZipEntry[] = [];
			const pdfBlob = await generateAuditPdf(input, palette, generatedDate);
			entries.push({ name: uniqueName("audit", "pdf", placeName, suffix), data: await blobToBytes(pdfBlob) });
			if (includeExcel) {
				const xlsxBlob = generateAuditXlsx(input, palette);
				entries.push({ name: uniqueName("audit", "xlsx", placeName, suffix), data: await blobToBytes(xlsxBlob) });
			}
			entriesById.set(auditId, entries);
		} catch (error) {
			failed += 1;
			failures.push({ auditId, reason: error instanceof Error ? error.message : "Could not export audit" });
		} finally {
			completed += 1;
			onProgress?.({ completed, total, failed });
		}
	});

	// Reassemble in the original audit order for a stable archive.
	const entries: ZipEntry[] = [];
	for (const auditId of auditIds) {
		const forAudit = entriesById.get(auditId);
		if (forAudit) entries.push(...forAudit);
	}

	return { zipBlob: buildZip(entries, generatedDate), failures, fileCount: entries.length };
}

function uniqueName(report: string, extension: string, placeName: string, suffix: string): string {
	const base = buildExportFileName(report, extension, { scopeSlug: placeName });
	// Insert the id suffix before the extension so same-place/date audits don't collide.
	return base.replace(new RegExp(`\\.${extension}$`), `-${suffix}.${extension}`);
}
