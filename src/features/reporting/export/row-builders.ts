/**
 * Pure data → presentation rows for the PDF and XLSX renderers (R1). CSV bytes
 * are NOT produced here (see `csv-builders.ts`); this module is free to change
 * layout without moving any legacy CSV. Identity fields route through
 * `resolveAuditorId`, keeping the privacy invariant in one place.
 */
import type { InstrumentResponse } from "@/features/yee-audit/api/yee-instrument";
import type { YeeSubmissionRecord } from "@/features/yee-audit/api/yee-audit-api";
import { yeeDomainLabels, type YeeDomainKey } from "@/features/yee-audit/config/yee-audit-config";
import { getScoreRows } from "@/features/yee-audit/scoring/yee-scoring";

import type { DomainBarRow } from "./charts/domain-bars";
import { bandForPercent } from "./export-palette";
import { resolveAuditorId } from "./identity";
import { walkDomainResponses, type ResponseWalkGroup } from "./response-walk";
import { domainOrder, type ScoreBandKey } from "./types";

function toPercent(value: number, maximum: number): number {
	if (!maximum) return 0;
	return Math.max(0, Math.min(100, (value / maximum) * 100));
}

function formatWeightLabel(value: string): string {
	switch (value) {
		case "3":
			return "Very important";
		case "2":
			return "Somewhat important";
		case "1":
			return "Not really important";
		default:
			return "Not recorded";
	}
}

function normalizeWeight(raw: unknown, domain: YeeDomainKey): string {
	if (!raw || typeof raw !== "object") return "";
	return String((raw as Record<string, unknown>)[domain] ?? "");
}

export type OverviewField = { label: string; value: string };

export type HeadlineMeasure = {
	label: string;
	value: string;
	max: string;
	percent: number;
	band: ScoreBandKey;
};

export type AuditOverview = {
	placeName: string;
	auditorId: string;
	submittedAt: string;
	fields: OverviewField[];
	raw: HeadlineMeasure;
	weighted: HeadlineMeasure;
};

function participantString(participantInfo: Record<string, unknown>, key: string): string {
	const value = participantInfo[key];
	return value === undefined || value === null ? "" : String(value);
}

export function buildAuditOverview(submission: YeeSubmissionRecord): AuditOverview {
	const participantInfo: Record<string, unknown> = submission.participant_info ?? {};
	const score = submission.score;
	const rawPercent = toPercent(score.total_raw_score, score.total_raw_maximum);
	const weightedPercent = toPercent(score.total_weighted_score, score.total_weighted_maximum);

	return {
		placeName: submission.place_name || submission.place_id,
		auditorId: resolveAuditorId(submission.auditor_generated_id),
		submittedAt: submission.submitted_at,
		fields: [
			{ label: "Place", value: submission.place_name || submission.place_id },
			{ label: "Auditor ID", value: resolveAuditorId(submission.auditor_generated_id) },
			{ label: "Audit date", value: participantString(participantInfo, "audit_date") },
			{ label: "Visit frequency", value: participantString(participantInfo, "visit_frequency") },
			{ label: "Season", value: participantString(participantInfo, "season") },
			{ label: "Weather", value: participantString(participantInfo, "weather") }
			// Submission ID is a database identifier — intentionally not shown to users.
		],
		raw: {
			label: "Total Raw Score",
			value: String(score.total_raw_score),
			max: String(score.total_raw_maximum),
			percent: rawPercent,
			band: bandForPercent(rawPercent)
		},
		weighted: {
			label: "Youth Weighted Average",
			value: score.total_weighted_score.toFixed(2),
			max: score.total_weighted_maximum.toFixed(2),
			percent: weightedPercent,
			band: bandForPercent(weightedPercent)
		}
	};
}

export type ScoreTableRow = {
	domainKey: YeeDomainKey;
	label: string;
	rawScore: number;
	rawMax: number;
	rawPercent: number;
	weightedScore: number;
	weightedMax: number;
	weightedPercent: number;
};

export function buildScoreTableRows(submission: YeeSubmissionRecord): ScoreTableRow[] {
	return getScoreRows(submission.score).map(row => ({
		domainKey: row.domain,
		label: row.label,
		rawScore: row.rawScore,
		rawMax: row.rawMaximum,
		rawPercent: toPercent(row.rawScore, row.rawMaximum),
		weightedScore: row.weightedScore,
		weightedMax: row.weightedMaximum,
		weightedPercent: toPercent(row.weightedScore, row.weightedMaximum)
	}));
}

export type WeightingRow = {
	label: string;
	/** 1–3 as recorded, or empty string when not recorded. */
	weight: string;
	weightLabel: string;
	/** Normalized weight as a percentage (0–100). */
	normalizedPercent: number;
};

export function buildWeightingRows(submission: YeeSubmissionRecord): WeightingRow[] {
	const participantInfo: Record<string, unknown> = submission.participant_info ?? {};
	const normalized = submission.score.normalized_weights;
	return (Object.keys(yeeDomainLabels) as YeeDomainKey[]).map(domain => {
		const weight = normalizeWeight(participantInfo.domain_weights, domain);
		return {
			label: yeeDomainLabels[domain],
			weight,
			weightLabel: formatWeightLabel(weight),
			normalizedPercent: Math.round((normalized?.[domain] ?? 0) * 100)
		};
	});
}

/** Structured per-domain responses for the grouped responses table. */
export function buildResponseGroups(
	submission: YeeSubmissionRecord,
	instrument: InstrumentResponse
): ResponseWalkGroup[] {
	return walkDomainResponses(submission, instrument);
}

export type CommentRow = { label: string; value: string };

export function buildCommentRows(submission: YeeSubmissionRecord): CommentRow[] {
	const participantInfo: Record<string, unknown> = submission.participant_info ?? {};
	const sectionComments =
		participantInfo.section_comments && typeof participantInfo.section_comments === "object"
			? (participantInfo.section_comments as Partial<Record<YeeDomainKey, string>>)
			: {};
	const weightingComments =
		typeof participantInfo.weighting_comments === "string" ? participantInfo.weighting_comments : "";

	const rows: CommentRow[] = [
		{ label: "Overall", value: participantString(participantInfo, "comments") },
		{ label: "Weighting", value: weightingComments }
	];
	for (const domain of Object.keys(yeeDomainLabels) as YeeDomainKey[]) {
		rows.push({ label: yeeDomainLabels[domain], value: sectionComments[domain] || "" });
	}
	return rows;
}

/** Per-domain raw-vs-weighted percentages for the R1 domain-bars chart. */
export function buildDomainBarRows(submission: YeeSubmissionRecord): DomainBarRow[] {
	return buildScoreTableRows(submission).map(row => ({
		domainKey: row.domainKey,
		label: row.label,
		rawPercent: row.rawPercent,
		weightedPercent: row.weightedPercent
	}));
}

/** Per-domain raw percentages (in domain order) for the R1 radar profile. */
export function buildRadarValues(submission: YeeSubmissionRecord): number[] {
	const byDomain = new Map(buildScoreTableRows(submission).map(row => [row.domainKey, row.rawPercent]));
	return domainOrder.map(domain => byDomain.get(domain) ?? 0);
}
