/**
 * Frozen legacy CSV generators.
 *
 * Each function preserves an existing CSV's exact header names, ordering, value
 * formatting, and escaping — verified by golden fixtures (plan acceptance
 * criterion 4). These bytes must NOT move when a PDF/XLSX layout changes, so the
 * formatting here is deliberately independent of `row-builders.ts`. The only
 * sanctioned diff is the identity-column privacy migration (criterion 5): the
 * auditor field routes through `resolveAuditorId`, so an absent generated ID
 * yields a placeholder instead of the raw identifier.
 */
import type { InstrumentResponse } from "@/features/yee-audit/api/yee-instrument";
import type { YeeSubmissionRecord } from "@/features/yee-audit/api/yee-audit-api";
import type { PlaceComparisonAuditRecord } from "@/features/workspaces/api/live-api";

import { auditRawPercent, auditWeightedPercent } from "./comparison-metrics";
import { resolveAuditorId } from "./identity";
import { normalizeText, walkDomainResponses } from "./response-walk";
import { toCsv } from "../reporting";
import type { PlaceComparisonSummary } from "./types";

/**
 * R1 single-submission CSV — byte-compatible with the legacy
 * `downloadSingleSubmissionCsv` in `yee-submission-report.tsx`. Its escaping is
 * intentionally NOT `toCsv` (unquoted header row, every cell double-quoted, no
 * formula-injection prefix), matching the original exactly.
 */
export function buildSingleSubmissionCsv(
	submission: YeeSubmissionRecord,
	instrument: InstrumentResponse | null
): string {
	const row: Record<string, string | number> = {
		"Auditor ID": resolveAuditorId(submission.auditor_generated_id),
		Place: submission.place_name || submission.place_id,
		"Place ID": submission.place_id,
		"Submitted At": submission.submitted_at,
		"Raw Score": submission.score.total_score
	};

	for (const [key, value] of Object.entries(submission.participant_info ?? {})) {
		if (key === "domain_weights" || key === "section_comments") continue;
		row[`Participant ${normalizeText(key.replace(/_/g, " "))}`] =
			typeof value === "object" ? JSON.stringify(value) : String(value ?? "");
	}

	if (instrument) {
		for (const group of walkDomainResponses(submission, instrument)) {
			group.items.forEach((item, index) => {
				const position = index + 1;
				row[`${group.label} Question ${position} Prompt`] = item.prompt;
				row[`${group.label} Question ${position} Response`] = item.response;
				row[`${group.label} Question ${position} Condition`] = item.condition;
			});
			row[`${group.label} Comments`] = group.comment;
		}
	}

	const headers = Object.keys(row);
	return [
		headers.join(","),
		headers.map(header => `"${String(row[header] ?? "").replace(/"/g, '""')}"`).join(",")
	].join("\n");
}

/** Default download filename for the single-submission CSV (legacy pattern). */
export function singleSubmissionCsvFileName(submission: YeeSubmissionRecord): string {
	return `yee-submission-${submission.id}.csv`;
}

/**
 * R2 place-comparison CSV — byte-compatible with the legacy
 * `yee-place-comparison.csv` (the `exportCurrentComparison` "places" branch).
 * Uses `toCsv` (formula-injection safe) exactly as before.
 */
export function buildPlaceComparisonCsv(summaries: PlaceComparisonSummary[]): string {
	return toCsv(
		summaries.map(summary => ({
			project: summary.projectName,
			place: summary.placeName,
			raw_score: summary.avgRawScore,
			raw_percent: `${summary.avgRawPercent.toFixed(1)}%`,
			youth_weighted_score: summary.avgWeightedScore,
			youth_weighted_percent: `${summary.avgWeightedPercent.toFixed(1)}%`,
			total_audits: summary.auditCount
		}))
	);
}

/** Rows shared by the trend (R3) and audit-comparison (R4) CSVs. */
function auditRowsCsv(records: PlaceComparisonAuditRecord[]): string {
	return toCsv(
		records.map(record => ({
			project: record.project_name,
			place: record.place_name,
			auditor_id: record.auditor_id,
			date: record.date,
			raw_score: `${record.total_raw_score}/${record.total_raw_maximum}`,
			raw_percent: `${auditRawPercent(record).toFixed(1)}%`,
			youth_weighted_score: `${record.total_weighted_score.toFixed(2)}/${record.total_weighted_maximum.toFixed(2)}`,
			youth_weighted_percent: `${auditWeightedPercent(record).toFixed(1)}%`
		}))
	);
}

/**
 * R3 trend CSV — byte-compatible with the legacy `yee-audit-trend.csv`. The
 * comparison payload's `auditor_id` is already the generated code (verified with
 * the backend, M0), so this stays byte-identical.
 */
export function buildTrendCsv(records: PlaceComparisonAuditRecord[]): string {
	return auditRowsCsv(records);
}

/**
 * R4 audit-comparison CSV — byte-compatible with the legacy
 * `yee-individual-audit-comparison.csv`.
 */
export function buildAuditComparisonCsv(records: PlaceComparisonAuditRecord[]): string {
	return auditRowsCsv(records);
}
