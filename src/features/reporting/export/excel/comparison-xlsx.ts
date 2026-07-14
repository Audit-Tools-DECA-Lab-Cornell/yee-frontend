/**
 * R2/R3/R4 — comparison Excel workbooks (the analysis surface). R2: Summary +
 * Domain matrix + Audit rows. R3: Timeline + Change summary. R4: Side-by-side +
 * Domain deltas. Excel renders Unicode, so delta cells use ▲/▼ markers.
 */
import {
	auditRawPercent,
	auditWeightedPercent,
	firstVsLatestDeltas,
	pairwiseDomainDeltas
} from "../comparison-metrics";
import { resolveAuditorId } from "../identity";
import {
	domainLabels,
	domainOrder,
	type AuditComparisonReportInput,
	type ExportPalette,
	type PlaceComparisonReportInput,
	type TrendReportInput
} from "../types";
import {
	appendSheet,
	buildStyledSheet,
	cell,
	makeStyles,
	newWorkbook,
	workbookToBlob,
	type StyledCell
} from "./excel-shared";

export function generatePlaceComparisonXlsx(input: PlaceComparisonReportInput, palette: ExportPalette): Blob {
	const styles = makeStyles(palette);
	const wb = newWorkbook();

	// Summary sheet.
	const summary: StyledCell[][] = [
		[cell("Place Comparison", styles.title)],
		[cell(input.scope.line, styles.subtitle)],
		[cell(null)],
		[
			cell("Place", styles.header),
			cell("Project", styles.header),
			cell("Audits", styles.header),
			cell("Avg raw", styles.header),
			cell("Raw %", styles.header),
			cell("Avg youth-weighted", styles.header),
			cell("YW %", styles.header)
		]
	];
	for (const row of input.summaries) {
		summary.push([
			cell(row.placeName, styles.body),
			cell(row.projectName, styles.body),
			cell(row.auditCount, styles.body),
			cell(row.avgRawScore, styles.body),
			cell(Math.round(row.avgRawPercent), styles.body),
			cell(row.avgWeightedScore, styles.body),
			cell(Math.round(row.avgWeightedPercent), styles.body)
		]);
	}
	appendSheet(wb, buildStyledSheet(summary, { colWidths: [28, 24, 8, 10, 8, 18, 8] }), "Summary");

	// Domain matrix sheet.
	const matrix: StyledCell[][] = [
		[cell("Place", styles.header), ...domainOrder.map(domain => cell(domainLabels[domain], styles.header))]
	];
	for (const row of input.summaries) {
		matrix.push([
			cell(row.placeName, styles.label),
			...domainOrder.map(domain => cell(Math.round(row.rawPercentByDomain[domain]), styles.body))
		]);
	}
	appendSheet(wb, buildStyledSheet(matrix, { colWidths: [28, 12, 12, 12, 16, 14, 12] }), "Domain matrix");

	// Audit rows sheet.
	appendSheet(
		wb,
		buildStyledSheet(auditRowsGrid(input.audits, styles), { colWidths: [24, 24, 12, 12, 12, 18, 10] }),
		"Audit rows"
	);

	return workbookToBlob(wb);
}

export function generateTrendXlsx(input: TrendReportInput, palette: ExportPalette): Blob {
	const styles = makeStyles(palette);
	const wb = newWorkbook();
	const sorted = [...input.records].sort((a, b) => timeOf(a.date) - timeOf(b.date));

	const timeline: StyledCell[][] = [
		[cell(`Trend — ${input.placeName}`, styles.title)],
		[cell(`${input.projectName} · ${input.scope.line}`, styles.subtitle)],
		[cell(null)],
		[
			cell("Date", styles.header),
			cell("Auditor", styles.header),
			cell("Participant", styles.header),
			cell("Raw score", styles.header),
			cell("Raw max", styles.header),
			cell("Raw %", styles.header),
			cell("Youth-weighted", styles.header),
			cell("YW %", styles.header)
		]
	];
	for (const record of sorted) {
		timeline.push([
			cell(record.date, styles.body),
			cell(resolveAuditorId(record.auditor_id), styles.body),
			cell(record.participant_id || "—", styles.body),
			cell(record.total_raw_score, styles.body),
			cell(record.total_raw_maximum, styles.body),
			cell(Math.round(auditRawPercent(record)), styles.body),
			cell(Number(record.total_weighted_score.toFixed(2)), styles.body),
			cell(Math.round(auditWeightedPercent(record)), styles.body)
		]);
	}
	appendSheet(wb, buildStyledSheet(timeline, { colWidths: [14, 12, 14, 12, 10, 8, 18, 8] }), "Timeline");

	// Change summary sheet.
	const change: StyledCell[][] = [
		[
			cell("Section", styles.header),
			cell("First %", styles.header),
			cell("Latest %", styles.header),
			cell("Change", styles.header)
		]
	];
	for (const delta of firstVsLatestDeltas(sorted)) {
		change.push([
			cell(delta.label, styles.label),
			cell(Math.round(delta.first), styles.body),
			cell(Math.round(delta.latest), styles.body),
			cell(deltaMark(delta.delta), styles.body)
		]);
	}
	appendSheet(wb, buildStyledSheet(change, { colWidths: [26, 10, 10, 14] }), "Change summary");

	return workbookToBlob(wb);
}

export function generateAuditComparisonXlsx(input: AuditComparisonReportInput, palette: ExportPalette): Blob {
	const styles = makeStyles(palette);
	const wb = newWorkbook();
	const labels = input.records.map(record => `${record.place_name} (${record.date})`);

	appendSheet(
		wb,
		buildStyledSheet(auditRowsGrid(input.records, styles, "Selected audits"), {
			colWidths: [24, 24, 14, 12, 12, 12, 18, 10]
		}),
		"Side by side"
	);

	// Domain deltas sheet.
	const twoUp = input.records.length === 2;
	const header: StyledCell[] = [cell("Section", styles.header), ...labels.map(label => cell(label, styles.header))];
	if (twoUp) header.push(cell("Δ", styles.header));
	const deltas: StyledCell[][] = [header];
	for (const row of pairwiseDomainDeltas(input.records)) {
		const line: StyledCell[] = [
			cell(row.label, styles.label),
			...row.values.map(value => cell(Math.round(value), styles.body))
		];
		if (twoUp) line.push(cell(deltaMark(row.delta ?? 0), styles.body));
		deltas.push(line);
	}
	appendSheet(wb, buildStyledSheet(deltas, { colWidths: [26, 18, 18, 10] }), "Domain deltas");

	return workbookToBlob(wb);
}

function auditRowsGrid(
	records: PlaceComparisonReportInput["audits"],
	styles: ReturnType<typeof makeStyles>,
	titleText?: string
): StyledCell[][] {
	const grid: StyledCell[][] = [];
	if (titleText) grid.push([cell(titleText, styles.title)], [cell(null)]);
	grid.push([
		cell("Place", styles.header),
		cell("Auditor", styles.header),
		cell("Participant", styles.header),
		cell("Date", styles.header),
		cell("Raw score", styles.header),
		cell("Raw %", styles.header),
		cell("Youth-weighted", styles.header),
		cell("YW %", styles.header)
	]);
	for (const record of records) {
		grid.push([
			cell(record.place_name, styles.body),
			cell(resolveAuditorId(record.auditor_id), styles.body),
			cell(record.participant_id || "—", styles.body),
			cell(record.date, styles.body),
			cell(`${record.total_raw_score}/${record.total_raw_maximum}`, styles.body),
			cell(Math.round(auditRawPercent(record)), styles.body),
			cell(`${record.total_weighted_score.toFixed(2)}/${record.total_weighted_maximum.toFixed(2)}`, styles.body),
			cell(Math.round(auditWeightedPercent(record)), styles.body)
		]);
	}
	return grid;
}

function deltaMark(delta: number): string {
	if (delta > 0) return `▲ +${delta.toFixed(1)}`;
	if (delta < 0) return `▼ ${delta.toFixed(1)}`;
	return "– 0.0";
}
function timeOf(date: string): number {
	const parsed = new Date(date);
	// Unparseable/empty dates sort LAST — not to epoch 0, which would wrongly make
	// an undated record the "earliest" row in the trend timeline.
	return Number.isNaN(parsed.getTime()) ? Number.POSITIVE_INFINITY : parsed.getTime();
}
