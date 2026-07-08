/**
 * R1 — Individual Audit Report Excel workbook. The analysis surface: styled
 * multi-sheet (Overview, Scores, Responses, Comments), no embedded chart images
 * (logistics §5). Identity routes through the row builders' `resolveAuditorId`.
 */
import {
	buildAuditOverview,
	buildCommentRows,
	buildResponseGroups,
	buildScoreTableRows,
	buildWeightingRows
} from "../row-builders";
import type { AuditReportInput, ExportPalette } from "../types";
import { appendSheet, buildStyledSheet, cell, makeStyles, newWorkbook, workbookToBlob, type StyledCell } from "./excel-shared";

export function generateAuditXlsx(input: AuditReportInput, palette: ExportPalette): Blob {
	const { submission, instrument } = input;
	const styles = makeStyles(palette);
	const overview = buildAuditOverview(submission);
	const wb = newWorkbook();

	// --- Overview sheet ---
	const overviewRows: StyledCell[][] = [
		[cell("YEE Individual Audit Report", styles.title)],
		[cell(`${overview.placeName} · ${overview.auditorId}`, styles.subtitle)],
		[cell(null)],
		[cell("Field", styles.header), cell("Value", styles.header)]
	];
	for (const field of overview.fields) {
		overviewRows.push([cell(field.label, styles.label), cell(field.value || "Not recorded", styles.body)]);
	}
	overviewRows.push([cell(null)]);
	overviewRows.push([cell("Measure", styles.header), cell("Value", styles.header), cell("%", styles.header)]);
	overviewRows.push([
		cell(overview.raw.label, styles.label),
		cell(`${overview.raw.value} / ${overview.raw.max}`, styles.body),
		cell(`${overview.raw.percent.toFixed(0)}%`, styles.bandHeader(palette.bands[overview.raw.band].fg))
	]);
	overviewRows.push([
		cell(overview.weighted.label, styles.label),
		cell(`${overview.weighted.value} / ${overview.weighted.max}`, styles.body),
		cell(`${overview.weighted.percent.toFixed(0)}%`, styles.bandHeader(palette.bands[overview.weighted.band].fg))
	]);
	appendSheet(wb, buildStyledSheet(overviewRows, { colWidths: [26, 34, 10] }), "Overview");

	// --- Scores sheet ---
	const scoreRows = buildScoreTableRows(submission);
	const scoresGrid: StyledCell[][] = [
		[
			cell("Section", styles.header),
			cell("Raw score", styles.header),
			cell("Raw max", styles.header),
			cell("Raw %", styles.header),
			cell("Youth-weighted", styles.header),
			cell("YW max", styles.header),
			cell("YW %", styles.header)
		]
	];
	for (const row of scoreRows) {
		scoresGrid.push([
			cell(row.label, { ...styles.body, fill: { patternType: "solid", fgColor: { rgb: palette.domains[row.domainKey].light.replace("#", "").toUpperCase() } } }),
			cell(round1(row.rawScore), styles.body),
			cell(round1(row.rawMax), styles.body),
			cell(Math.round(row.rawPercent), styles.body),
			cell(round2(row.weightedScore), styles.body),
			cell(round2(row.weightedMax), styles.body),
			cell(Math.round(row.weightedPercent), styles.body)
		]);
	}
	// Weighting appended below the score table on the same analysis sheet.
	scoresGrid.push([cell(null)]);
	scoresGrid.push([
		cell("Section", styles.header),
		cell("Importance", styles.header),
		cell("Weight (1–3)", styles.header),
		cell("Normalized %", styles.header)
	]);
	for (const row of buildWeightingRows(submission)) {
		scoresGrid.push([
			cell(row.label, styles.label),
			cell(row.weightLabel, styles.body),
			cell(row.weight ? Number(row.weight) : "Not recorded", styles.body),
			cell(row.normalizedPercent, styles.body)
		]);
	}
	appendSheet(wb, buildStyledSheet(scoresGrid, { colWidths: [26, 16, 12, 10, 16, 12, 10] }), "Scores");

	// --- Responses sheet (domain section banners) ---
	const responseGroups = instrument ? buildResponseGroups(submission, instrument) : [];
	const responseGrid: StyledCell[][] = [
		[cell("Question", styles.header), cell("Recorded answer", styles.header), cell("Condition", styles.header)]
	];
	for (const group of responseGroups) {
		if (group.items.length === 0) continue;
		responseGrid.push([
			cell(group.label, styles.sectionBanner(palette.domains[group.domainKey].strong)),
			cell("", styles.sectionBanner(palette.domains[group.domainKey].strong)),
			cell("", styles.sectionBanner(palette.domains[group.domainKey].strong))
		]);
		for (const item of group.items) {
			responseGrid.push([
				cell(item.prompt, styles.body),
				cell(item.response, styles.body),
				cell(item.condition, styles.body)
			]);
		}
	}
	appendSheet(wb, buildStyledSheet(responseGrid, { colWidths: [64, 26, 18] }), "Responses");

	// --- Comments sheet ---
	const commentGrid: StyledCell[][] = [[cell("Section", styles.header), cell("Comment", styles.header)]];
	for (const row of buildCommentRows(submission)) {
		commentGrid.push([cell(row.label, styles.label), cell(row.value || "No comments submitted.", styles.body)]);
	}
	appendSheet(wb, buildStyledSheet(commentGrid, { colWidths: [26, 80] }), "Comments");

	return workbookToBlob(wb);
}

function round1(value: number): number {
	return Math.round(value * 10) / 10;
}
function round2(value: number): number {
	return Math.round(value * 100) / 100;
}
