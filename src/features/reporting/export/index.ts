/**
 * The ONLY public surface of the export layer (implementation-plan D5). UI code
 * imports from here — and only here — via dynamic `import()` from click handlers,
 * so jsPDF / xlsx-js-style never enter the initial dashboard bundle (D2).
 *
 * `types.ts` and the pure chart geometry (`charts/geometry.ts`) are the two
 * exceptions the dashboard may import statically: they carry no heavy deps and
 * back the on-screen charts' shared math.
 */
import { generateAuditPdf } from "./pdf/audit-pdf";
import { generatePlaceComparisonPdf } from "./pdf/place-comparison-pdf";
import { generateTrendPdf } from "./pdf/trend-pdf";
import { generateAuditComparisonPdf } from "./pdf/audit-comparison-pdf";
import { generateAuditXlsx } from "./excel/audit-xlsx";
import { generatePlaceComparisonXlsx, generateTrendXlsx, generateAuditComparisonXlsx } from "./excel/comparison-xlsx";
import { buildAuditComparisonCsv, buildPlaceComparisonCsv, buildSingleSubmissionCsv, buildTrendCsv } from "./csv-builders";
import { getExportPalette } from "./export-palette";
import { buildExportFileName, isoDateStamp, triggerBrowserDownload } from "./file-utils";
import type {
	AuditComparisonReportInput,
	AuditReportInput,
	PlaceComparisonReportInput,
	ReportDocumentFormat,
	TrendReportInput
} from "./types";

const MIME = {
	pdf: "application/pdf",
	xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	csv: "text/csv;charset=utf-8;"
} as const;

/** yyyy-mm-dd from an ISO timestamp, falling back to today. */
function stampFrom(iso: string | null | undefined): string {
	if (iso) {
		const date = new Date(iso);
		if (!Number.isNaN(date.getTime())) return isoDateStamp(date);
	}
	return isoDateStamp();
}

/**
 * R1 — generate and download an individual audit report in the chosen format.
 * The caller supplies the already-fetched submission + instrument; this resolves
 * the palette, renders, names the file (`yee-audit-<place>-<date>.<ext>`), and
 * triggers the download.
 */
export async function exportAudit(input: AuditReportInput, format: ReportDocumentFormat): Promise<void> {
	const palette = getExportPalette();
	const placeName = input.submission.place_name || input.submission.place_id;
	const audstamp = stampFrom(
		(typeof input.submission.participant_info?.audit_date === "string"
			? input.submission.participant_info.audit_date
			: null) ?? input.submission.submitted_at
	);
	const fileName = buildExportFileName("audit", format, { scopeSlug: placeName, date: new Date(`${audstamp}T00:00:00`) });

	if (format === "csv") {
		triggerBrowserDownload(fileName, buildSingleSubmissionCsv(input.submission, input.instrument), MIME.csv);
		return;
	}
	if (format === "xlsx") {
		triggerBrowserDownload(fileName, generateAuditXlsx(input, palette), MIME.xlsx);
		return;
	}
	const blob = await generateAuditPdf(input, palette);
	triggerBrowserDownload(fileName, blob, MIME.pdf);
}

/** R2 — Compare Places export in the chosen format. */
export async function exportPlaceComparison(input: PlaceComparisonReportInput, format: ReportDocumentFormat): Promise<void> {
	const palette = getExportPalette();
	const fileName = buildExportFileName("place-comparison", format);
	if (format === "csv") return triggerBrowserDownload(fileName, buildPlaceComparisonCsv(input.summaries), MIME.csv);
	if (format === "xlsx") return triggerBrowserDownload(fileName, generatePlaceComparisonXlsx(input, palette), MIME.xlsx);
	triggerBrowserDownload(fileName, await generatePlaceComparisonPdf(input, palette), MIME.pdf);
}

/** R3 — Compare Over Time (trend) export in the chosen format. */
export async function exportTrend(input: TrendReportInput, format: ReportDocumentFormat): Promise<void> {
	const palette = getExportPalette();
	const fileName = buildExportFileName("trend", format, { scopeSlug: input.placeName });
	if (format === "csv") return triggerBrowserDownload(fileName, buildTrendCsv(input.records), MIME.csv);
	if (format === "xlsx") return triggerBrowserDownload(fileName, generateTrendXlsx(input, palette), MIME.xlsx);
	triggerBrowserDownload(fileName, await generateTrendPdf(input, palette), MIME.pdf);
}

/** R4 — Compare Individual Audits export in the chosen format. */
export async function exportAuditComparison(input: AuditComparisonReportInput, format: ReportDocumentFormat): Promise<void> {
	const palette = getExportPalette();
	const fileName = buildExportFileName("audit-comparison", format);
	if (format === "csv") return triggerBrowserDownload(fileName, buildAuditComparisonCsv(input.records), MIME.csv);
	if (format === "xlsx") return triggerBrowserDownload(fileName, generateAuditComparisonXlsx(input, palette), MIME.xlsx);
	triggerBrowserDownload(fileName, await generateAuditComparisonPdf(input, palette), MIME.pdf);
}

// Re-exports for callers that need lower-level pieces (per-chart download, ZIP).
export { downloadChart } from "./charts/download";
export { getExportPalette } from "./export-palette";
export { buildExportFileName, isoDateStamp, slugify, triggerBrowserDownload } from "./file-utils";
export { rasterizeSvg, svgToPngDataUrl } from "./charts/raster";
export { buildZip, type ZipEntry } from "./zip-builder";
export { estimateBulkExport, formatBytes } from "./export-estimator";
export { resolveAuditorId } from "./identity";
export { buildPlaceComparisonSummaries, auditRawPercent, auditWeightedPercent } from "./comparison-metrics";
export type {
	AuditComparisonReportInput,
	AuditReportInput,
	ExportFormat,
	ExportPalette,
	PlaceComparisonReportInput,
	PlaceComparisonSummary,
	ReportDocumentFormat,
	ReportScope,
	TrendReportInput
} from "./types";
