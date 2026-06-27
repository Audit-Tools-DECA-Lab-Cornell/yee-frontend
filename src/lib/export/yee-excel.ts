/**
 * Excel (XLSX) export for the YEE reports dashboard.
 *
 * Produces a styled multi-sheet workbook:
 *   Sheet 1 – Overview        (summary metrics + domain averages)
 *   Sheet 2 – Place Summary   (one row per place, all 6 domain scores)
 *   Sheet 3 – Audit Scores    (one row per audit with full domain breakdown)
 *   Sheet 4 – Raw Responses   (one row per audit with all question responses)
 *
 * Uses xlsx-js-style for cell-level styling (colours, bold, borders).
 */

import * as XLSX from "xlsx-js-style";

import type { PlaceComparisonAuditRecord, RawDataRecord } from "@/lib/dashboard/live-api";
import { domainLabels, domainOrder } from "@/lib/dashboard/reporting";
import { yeeDomainThemes } from "@/lib/yee-domain-theme";
import { getYouthWeightedScoreMaximum, rawDomainScoreMaximums, totalRawScoreMaximum } from "@/lib/yee-score-limits";
import type { YeePdfPlaceSummary } from "./yee-pdf";

// ── Types ──────────────────────────────────────────────────────────────────────

export type YeeExcelInput = {
	placeSummaries: YeePdfPlaceSummary[];
	filteredAudits: PlaceComparisonAuditRecord[];
	filteredRawRows: RawDataRecord[];
	averageRawScore: number;
	averageWeightedScore: number;
	totalAudits: number;
	scopeDescription: string;
	generatedAt: string;
	includeRawData: boolean;
};

type StyleProps = {
	font?: { bold?: boolean; color?: { rgb: string }; sz?: number };
	fill?: { fgColor?: { rgb: string }; patternType?: "solid" };
	alignment?: { horizontal?: "left" | "center" | "right"; vertical?: "center"; wrapText?: boolean };
	border?: {
		top?: { style?: "thin" | "medium"; color?: { rgb: string } };
		bottom?: { style?: "thin" | "medium"; color?: { rgb: string } };
		left?: { style?: "thin" | "medium"; color?: { rgb: string } };
		right?: { style?: "thin" | "medium"; color?: { rgb: string } };
	};
};

type StyledCell = {
	v: string | number | boolean;
	t: "s" | "n" | "b";
	s?: StyleProps;
};

// ── Palette ───────────────────────────────────────────────────────────────────

const RGB = {
	darkGreen: "10231F",
	medGreen: "5C8F68",
	slate: "334155",
	white: "FFFFFF",
	lightGray: "F8FAFC",
	borderGray: "E2E8F0",
	mutedText: "6B7280",
	bodyText: "1F2937"
};

function domainRgb(domain: (typeof domainOrder)[number], shade: "light" | "strong"): string {
	const hex = shade === "light" ? yeeDomainThemes[domain].lightHex : yeeDomainThemes[domain].strongHex;
	return hex.replace("#", "").toUpperCase();
}

// ── Cell factories ─────────────────────────────────────────────────────────────

const bottomBorder = { bottom: { style: "thin" as const, color: { rgb: RGB.borderGray } } };

function hdr(value: string, bg = RGB.darkGreen, align: "left" | "center" = "left"): StyledCell {
	return {
		v: value,
		t: "s",
		s: {
			font: { bold: true, color: { rgb: RGB.white }, sz: 9 },
			fill: { fgColor: { rgb: bg }, patternType: "solid" },
			alignment: { horizontal: align, vertical: "center" },
			border: bottomBorder
		}
	};
}

function cell(
	value: string | number,
	opts: { bold?: boolean; bg?: string; align?: "left" | "center" | "right"; mono?: boolean } = {}
): StyledCell {
	return {
		v: value,
		t: typeof value === "number" ? "n" : "s",
		s: {
			font: { bold: opts.bold ?? false, sz: 9, ...(opts.mono ? {} : {}) },
			...(opts.bg ? { fill: { fgColor: { rgb: opts.bg }, patternType: "solid" } } : {}),
			alignment: { horizontal: opts.align ?? "left", vertical: "center" },
			border: bottomBorder
		}
	};
}

function empty(): StyledCell {
	return { v: "", t: "s", s: { border: bottomBorder } };
}

function pct(num: number, den: number): string {
	if (!den) return "0%";
	return `${((num / den) * 100).toFixed(1)}%`;
}

function applyColWidths(ws: XLSX.WorkSheet, widths: number[]) {
	ws["!cols"] = widths.map(w => ({ wch: w }));
}

// ── Public API ─────────────────────────────────────────────────────────────────

export function generateYeeExcelBlob(input: YeeExcelInput): Blob {
	const wb = XLSX.utils.book_new();

	XLSX.utils.book_append_sheet(wb, buildOverviewSheet(input), "Overview");

	if (input.placeSummaries.length > 0) {
		XLSX.utils.book_append_sheet(wb, buildPlaceSummarySheet(input), "Place Summary");
	}

	if (input.filteredAudits.length > 0) {
		XLSX.utils.book_append_sheet(wb, buildAuditScoresSheet(input), "Audit Scores");
	}

	if (input.includeRawData && input.filteredRawRows.length > 0) {
		XLSX.utils.book_append_sheet(wb, buildRawResponsesSheet(input), "Raw Responses");
	}

	const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
	return new Blob([buffer as ArrayBuffer], {
		type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
	});
}

// ── Sheet builders ────────────────────────────────────────────────────────────

function buildOverviewSheet(input: YeeExcelInput): XLSX.WorkSheet {
	const rows: StyledCell[][] = [
		[hdr("Youth Enabling Environments — Audit Report", RGB.darkGreen), empty(), empty(), empty()],
		[empty(), empty(), empty(), empty()],
		[hdr("REPORT METADATA", RGB.slate), empty(), empty(), empty()],
		[cell("Generated At", { bold: true }), cell(input.generatedAt), empty(), empty()],
		[cell("Scope", { bold: true }), cell(input.scopeDescription), empty(), empty()],
		[cell("Total Audits", { bold: true }), cell(input.totalAudits, { align: "left" }), empty(), empty()],
		[empty(), empty(), empty(), empty()],
		[hdr("KEY METRICS", RGB.slate), empty(), empty(), empty()],
		[
			cell("Avg Raw Score", { bold: true }),
			cell(Number(input.averageRawScore.toFixed(1))),
			cell(`/ ${totalRawScoreMaximum}`),
			cell(pct(input.averageRawScore, totalRawScoreMaximum))
		],
		[
			cell("Avg Youth Weighted Score", { bold: true }),
			cell(Number(input.averageWeightedScore.toFixed(3))),
			empty(),
			empty()
		],
		[empty(), empty(), empty(), empty()],
		[hdr("DOMAIN AVERAGES", RGB.slate), empty(), empty(), empty()],
		[hdr("Domain"), hdr("Max Raw Score"), hdr("Avg Raw Score"), hdr("Avg Raw %")]
	];

	for (const domain of domainOrder) {
		const rawAvg =
			input.filteredAudits.length > 0
				? input.filteredAudits.reduce((s, a) => s + a.raw_domain_scores[domain], 0) /
					input.filteredAudits.length
				: 0;
		const max = rawDomainScoreMaximums[domain];
		const bg = domainRgb(domain, "light");

		rows.push([
			cell(domainLabels[domain], { bold: true, bg }),
			cell(max),
			cell(Number(rawAvg.toFixed(1))),
			cell(pct(rawAvg, max))
		]);
	}

	const ws = XLSX.utils.aoa_to_sheet(rows as unknown as (string | number)[][]);
	applyColWidths(ws, [30, 22, 22, 16]);
	return ws;
}

function buildPlaceSummarySheet(input: YeeExcelInput): XLSX.WorkSheet {
	const domainHdrs = domainOrder.map(d => hdr(domainLabels[d], domainRgb(d, "strong")));

	const rows: StyledCell[][] = [
		[
			hdr("Place"),
			hdr("Project"),
			hdr("Audits", RGB.slate, "center"),
			hdr("Avg Raw Score"),
			hdr("Avg Raw %", RGB.slate, "center"),
			hdr("Avg Youth Weighted"),
			hdr("Avg Wtd %", RGB.slate, "center"),
			...domainHdrs
		]
	];

	for (const s of input.placeSummaries) {
		rows.push([
			cell(s.place_name, { bold: true }),
			cell(s.project_name),
			cell(s.auditCount, { align: "center" }),
			cell(s.avgRawScore),
			cell(pct(s.avgRawScore, totalRawScoreMaximum), { align: "center" }),
			cell(Number(s.avgWeightedScore.toFixed(3))),
			cell(`${s.avgWeightedPercent.toFixed(0)}%`, { align: "center" }),
			...domainOrder.map(d =>
				cell(`${s.rawPercentByDomain[d].toFixed(0)}%`, { bg: domainRgb(d, "light"), align: "center" })
			)
		]);
	}

	const ws = XLSX.utils.aoa_to_sheet(rows as unknown as (string | number)[][]);
	applyColWidths(ws, [30, 26, 10, 18, 14, 22, 12, ...domainOrder.map(() => 20)]);
	return ws;
}

function buildAuditScoresSheet(input: YeeExcelInput): XLSX.WorkSheet {
	const rawDomainHdrs = domainOrder.map(d => hdr(`${domainLabels[d]} — Raw`, domainRgb(d, "strong")));
	const wtdDomainHdrs = domainOrder.map(d => hdr(`${domainLabels[d]} — Weighted`, domainRgb(d, "strong")));

	const rows: StyledCell[][] = [
		[
			hdr("Audit ID"),
			hdr("Place"),
			hdr("Project"),
			hdr("Auditor ID"),
			hdr("Date"),
			hdr("Raw Score"),
			hdr("Raw %", RGB.slate, "center"),
			hdr("Youth Weighted Score"),
			hdr("Youth Wtd %", RGB.slate, "center"),
			...rawDomainHdrs,
			...wtdDomainHdrs
		]
	];

	for (const r of input.filteredAudits) {
		const wtdMax = getYouthWeightedScoreMaximum(r.domain_weights);
		rows.push([
			cell(r.audit_id),
			cell(r.place_name, { bold: true }),
			cell(r.project_name),
			cell(r.auditor_id),
			cell(r.date),
			cell(r.total_raw_score),
			cell(pct(r.total_raw_score, totalRawScoreMaximum), { align: "center" }),
			cell(Number(r.total_weighted_score.toFixed(3))),
			cell(pct(r.total_weighted_score, wtdMax), { align: "center" }),
			...domainOrder.map(d =>
				cell(r.raw_domain_scores[d], { bg: domainRgb(d, "light") })
			),
			...domainOrder.map(d =>
				cell(Number(r.weighted_domain_scores[d].toFixed(3)), { bg: domainRgb(d, "light") })
			)
		]);
	}

	const ws = XLSX.utils.aoa_to_sheet(rows as unknown as (string | number)[][]);
	applyColWidths(ws, [
		24, 28, 24, 20, 14, 14, 12, 22, 14,
		...domainOrder.map(() => 22),
		...domainOrder.map(() => 24)
	]);
	return ws;
}

function buildRawResponsesSheet(input: YeeExcelInput): XLSX.WorkSheet {
	const responseKeys = Array.from(
		new Set(input.filteredRawRows.flatMap(r => Object.keys(r.responses ?? {})))
	).sort();

	const fixedHdrs: StyledCell[] = [
		hdr("Audit ID"),
		hdr("Organization"),
		hdr("Place"),
		hdr("Project"),
		hdr("Auditor ID"),
		hdr("Date"),
		hdr("Submitted At"),
		hdr("Start Time"),
		hdr("Finish Time"),
		hdr("Total Minutes"),
		hdr("Visit Frequency"),
		hdr("Season"),
		hdr("Weather"),
		hdr("Comments"),
		hdr("Raw Access", domainRgb("access", "strong")),
		hdr("Raw Activity Spaces", domainRgb("activitySpaces", "strong")),
		hdr("Raw Amenities", domainRgb("amenities", "strong")),
		hdr("Raw Experience of Space", domainRgb("experienceOfSpace", "strong")),
		hdr("Raw Aesthetics & Care", domainRgb("aestheticsAndCare", "strong")),
		hdr("Raw Use & Usability", domainRgb("useAndUsability", "strong")),
		hdr("Wtd Access", domainRgb("access", "strong")),
		hdr("Wtd Activity Spaces", domainRgb("activitySpaces", "strong")),
		hdr("Wtd Amenities", domainRgb("amenities", "strong")),
		hdr("Wtd Experience of Space", domainRgb("experienceOfSpace", "strong")),
		hdr("Wtd Aesthetics & Care", domainRgb("aestheticsAndCare", "strong")),
		hdr("Wtd Use & Usability", domainRgb("useAndUsability", "strong")),
		hdr("Total Raw Score"),
		hdr("Total Youth Weighted Score"),
		...responseKeys.map(k => hdr(k, RGB.slate))
	];

	const rows: StyledCell[][] = [fixedHdrs];

	for (const r of input.filteredRawRows) {
		rows.push([
			cell(r.audit_id),
			cell(r.organization),
			cell(r.place_name, { bold: true }),
			cell(r.project_name),
			cell(r.auditor_generated_id),
			cell(r.date),
			cell(r.submitted_at ?? ""),
			cell(r.start_time ?? ""),
			cell(r.finish_time ?? ""),
			cell(r.total_minutes ?? 0),
			cell(r.visit_frequency ?? ""),
			cell(r.season ?? ""),
			cell(r.weather ?? ""),
			cell(r.comments ?? ""),
			cell(r.raw_access, { bg: domainRgb("access", "light") }),
			cell(r.raw_activity_spaces, { bg: domainRgb("activitySpaces", "light") }),
			cell(r.raw_amenities, { bg: domainRgb("amenities", "light") }),
			cell(r.raw_experience_of_space, { bg: domainRgb("experienceOfSpace", "light") }),
			cell(r.raw_aesthetics_and_care, { bg: domainRgb("aestheticsAndCare", "light") }),
			cell(r.raw_use_and_usability, { bg: domainRgb("useAndUsability", "light") }),
			cell(r.weighted_access, { bg: domainRgb("access", "light") }),
			cell(r.weighted_activity_spaces, { bg: domainRgb("activitySpaces", "light") }),
			cell(r.weighted_amenities, { bg: domainRgb("amenities", "light") }),
			cell(r.weighted_experience_of_space, { bg: domainRgb("experienceOfSpace", "light") }),
			cell(r.weighted_aesthetics_and_care, { bg: domainRgb("aestheticsAndCare", "light") }),
			cell(r.weighted_use_and_usability, { bg: domainRgb("useAndUsability", "light") }),
			cell(r.total_raw_score),
			cell(Number(r.total_weighted_score.toFixed(3))),
			...responseKeys.map(k => cell(r.responses?.[k] ?? ""))
		]);
	}

	const ws = XLSX.utils.aoa_to_sheet(rows as unknown as (string | number)[][]);
	applyColWidths(ws, [
		24, 32, 28, 24, 20, 14, 20, 14, 14, 14, 18, 14, 14, 40,
		18, 22, 18, 28, 24, 22, 20, 24, 20, 28, 24, 24, 18, 26,
		...responseKeys.map(() => 14)
	]);
	return ws;
}
