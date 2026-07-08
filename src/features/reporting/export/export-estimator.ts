/**
 * Bulk-export size estimator — ported thresholds from COPA (implementation-plan
 * D5/D6). Client-side generation is honest only below a certain size; above it,
 * the UI warns before a heavy export and points at where a future server-side
 * batch path would go (logistics §7, plan risk table).
 */

/** Warn above this many audits in one bulk request. */
export const ENTITY_WARN_THRESHOLD = 25;
/** Warn above this many files in the archive (e.g. PDF + Excel per audit). */
export const FILE_WARN_THRESHOLD = 60;
/** Warn above this estimated total size, in bytes (~100 MB). */
export const SIZE_WARN_THRESHOLD = 100 * 1024 * 1024;

/** Rough per-file size assumptions used before the files are actually built. */
const APPROX_PDF_BYTES = 320 * 1024;
const APPROX_XLSX_BYTES = 48 * 1024;

export type BulkExportEstimate = {
	auditCount: number;
	fileCount: number;
	estimatedBytes: number;
	/** True if any threshold is exceeded. */
	shouldWarn: boolean;
	/** Human-readable reasons, empty when under all thresholds. */
	reasons: string[];
};

/**
 * Estimate the cost of a bulk audit export.
 *
 * @param auditCount number of audits selected/filtered
 * @param filesPerAudit 1 for PDF-only, 2 for PDF + Excel (logistics §8 Q3)
 */
export function estimateBulkExport(auditCount: number, filesPerAudit: 1 | 2 = 1): BulkExportEstimate {
	const fileCount = auditCount * filesPerAudit;
	const perAuditBytes = APPROX_PDF_BYTES + (filesPerAudit === 2 ? APPROX_XLSX_BYTES : 0);
	const estimatedBytes = auditCount * perAuditBytes;

	const reasons: string[] = [];
	if (auditCount > ENTITY_WARN_THRESHOLD) {
		reasons.push(`${auditCount} audits exceeds the recommended ${ENTITY_WARN_THRESHOLD} per export`);
	}
	if (fileCount > FILE_WARN_THRESHOLD) {
		reasons.push(`${fileCount} files exceeds the recommended ${FILE_WARN_THRESHOLD}`);
	}
	if (estimatedBytes > SIZE_WARN_THRESHOLD) {
		reasons.push(`~${formatBytes(estimatedBytes)} may be slow to generate in the browser`);
	}

	return { auditCount, fileCount, estimatedBytes, shouldWarn: reasons.length > 0, reasons };
}

/** Compact human-readable byte size (e.g. "1.2 MB"). */
export function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	const units = ["KB", "MB", "GB"];
	let value = bytes / 1024;
	let unitIndex = 0;
	while (value >= 1024 && unitIndex < units.length - 1) {
		value /= 1024;
		unitIndex += 1;
	}
	return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}
