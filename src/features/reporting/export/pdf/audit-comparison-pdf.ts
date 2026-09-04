/**
 * R4 — Audit Comparison Report PDF (2–3 selected audits). Side-by-side summary,
 * per-domain delta table (with an explicit Δ column when exactly two audits are
 * selected), radar overlay, and grouped domain bars — side-by-side reads more
 * clearly than stacked when comparing a few audits (logistics §6).
 */
import autoTable from "jspdf-autotable";

import { SCORE_UNAVAILABLE, formatScoreSummary, scorePercent, scorePercentage } from "@/lib/score-format";

import { pairwiseDomainDeltas } from "../comparison-metrics";
import { buildGroupedBarsSvg } from "../charts/grouped-bars";
import { buildRadarSvg } from "../charts/radar";
import { rasterizeSvg } from "../charts/raster";
import { bandForPercent } from "../export-palette";
import { resolveAuditorId } from "../identity";
import { domainLabels, domainOrder, type AuditComparisonReportInput, type ExportPalette } from "../types";
import {
	contentWidth,
	createReportDoc,
	drawChartImage,
	drawCover,
	drawSectionTitle,
	finalizeChrome,
	hexToRgb,
	lastTableY,
	PAGE
} from "./pdf-shared";

export async function generateAuditComparisonPdf(
	input: AuditComparisonReportInput,
	palette: ExportPalette,
	generatedDate: Date = new Date()
): Promise<Blob> {
	const { records, scope } = input;
	const doc = createReportDoc();
	const seriesLabels = records.map(record => `${record.place_name} (${record.date})`);

	let y = await drawCover(doc, palette, {
		title: "Audit Comparison Report",
		subtitle: `Side-by-side comparison of ${records.length} selected audits.`,
		scopeLine: `Scope: ${scope.line}`
	});

	// Side-by-side summary table.
	y = drawSectionTitle(doc, palette, "Selected audits", y);
	autoTable(doc, {
		startY: y,
		margin: { top: PAGE.continuationTop, bottom: PAGE.marginBottom, left: PAGE.marginX, right: PAGE.marginX },
		theme: "grid",
		head: [["Place", "Auditor", "Participant", "Date", "Raw", "Youth-weighted"]],
		body: records.map(record => [
			record.place_name,
			resolveAuditorId(record.auditor_id),
			record.participant_id || "—",
			record.date,
			formatScoreSummary(record.total_raw_score, record.total_raw_maximum),
			formatScoreSummary(record.total_weighted_score, record.total_weighted_maximum, 2)
		]),
		styles: {
			font: "helvetica",
			fontSize: 8.5,
			cellPadding: 4,
			lineColor: hexToRgb(palette.brand.border),
			lineWidth: 0.4,
			textColor: hexToRgb(palette.brand.foreground)
		},
		headStyles: { fillColor: hexToRgb(palette.brand.green900), textColor: [255, 255, 255], fontStyle: "bold" },
		columnStyles: { 4: { halign: "right" }, 5: { halign: "right" } },
		didParseCell: data => {
			if (data.section === "body" && (data.column.index === 4 || data.column.index === 5)) {
				const record = records[data.row.index];
				const percent =
					data.column.index === 4
						? scorePercent(record.total_raw_score, record.total_raw_maximum)
						: scorePercent(record.total_weighted_score, record.total_weighted_maximum);
				// An unavailable score has no band — tinting it would paint the same
				// "low" red as a genuine 0%.
				if (percent === null) return;
				const band = bandForPercent(percent);
				data.cell.styles.fillColor = hexToRgb(palette.bands[band].bg);
				data.cell.styles.textColor = hexToRgb(palette.bands[band].fg);
			}
		}
	});
	y = lastTableY(doc) + 12;

	// Domain delta table.
	y = drawSectionTitle(doc, palette, "Domain comparison (raw %)", y);
	const deltas = pairwiseDomainDeltas(records);
	const twoUp = records.length === 2;
	const deltaHead = ["Section", ...seriesLabels, ...(twoUp ? ["Δ"] : [])];
	autoTable(doc, {
		startY: y,
		margin: { top: PAGE.continuationTop, bottom: PAGE.marginBottom, left: PAGE.marginX, right: PAGE.marginX },
		theme: "grid",
		head: [deltaHead],
		body: deltas.map(row => [
			row.label,
			...row.values.map(value => (value === null ? SCORE_UNAVAILABLE : `${value.toFixed(0)}%`)),
			...(twoUp ? [formatDelta(row.delta)] : [])
		]),
		styles: {
			font: "helvetica",
			fontSize: 8.5,
			cellPadding: 4,
			halign: "center",
			lineColor: hexToRgb(palette.brand.border),
			lineWidth: 0.4,
			textColor: hexToRgb(palette.brand.foreground)
		},
		headStyles: {
			fillColor: hexToRgb(palette.brand.green900),
			textColor: [255, 255, 255],
			fontStyle: "bold",
			fontSize: 7.5
		},
		columnStyles: { 0: { halign: "left", fontStyle: "bold" } },
		didParseCell: data => {
			// Section column: the row IS a domain, so it wears that domain's tint.
			if (data.section === "body" && data.column.index === 0) {
				const colors = palette.domains[deltas[data.row.index].domainKey];
				data.cell.styles.fillColor = hexToRgb(colors.light);
				data.cell.styles.textColor = hexToRgb(colors.text);
			}
			if (twoUp && data.section === "body" && data.column.index === deltaHead.length - 1) {
				const delta = deltas[data.row.index].delta;
				if (delta === null || delta === undefined) return;
				const key = delta > 0 ? "high" : delta < 0 ? "low" : "mid";
				data.cell.styles.textColor = hexToRgb(palette.bands[key].fg);
				data.cell.styles.fontStyle = "bold";
			}
		}
	});
	y = lastTableY(doc) + 12;

	// Radar overlay + grouped bars.
	const chartRecords = records.filter(record => domainOrder.every(domain => percentFor(record, domain) !== null));
	const chartSeriesLabels = chartRecords.map(record => `${record.place_name} (${record.date})`);
	const radarSvg = buildRadarSvg({
		axisLabels: domainOrder.map(domain => domainLabels[domain]),
		axisColors: domainOrder.map(domain => palette.domains[domain].text),
		palette,
		series: chartRecords.map((record, index) => ({
			label: chartSeriesLabels[index],
			color: palette.chartSeries[index % palette.chartSeries.length],
			values: domainOrder.map(domain => percentFor(record, domain) ?? 0)
		}))
	});
	const groupedSvg = buildGroupedBarsSvg({
		palette,
		width: 720,
		series: chartRecords.map((_, index) => ({
			label: chartSeriesLabels[index],
			color: palette.chartSeries[index % palette.chartSeries.length]
		})),
		groups: domainOrder.map(domain => ({
			label: domainLabels[domain],
			labelColor: palette.domains[domain].text,
			values: chartRecords.map(record => percentFor(record, domain) ?? 0)
		}))
	});
	const [radar, grouped] = await Promise.all([
		rasterizeSvg(radarSvg, 2).catch(() => null),
		rasterizeSvg(groupedSvg, 2).catch(() => null)
	]);
	if (radar) {
		y = drawSectionTitle(doc, palette, "Domain profile overlay", y);
		y = drawChartImage(doc, radar.dataUrl, radar.width, radar.height, y, {
			maxWidth: contentWidth(doc) * 0.92,
			maxHeight: 330
		});
	}
	if (grouped) {
		y = drawSectionTitle(doc, palette, "Grouped domain bars", y);
		y = drawChartImage(doc, grouped.dataUrl, grouped.width, grouped.height, y, { maxHeight: 300 });
	}

	await finalizeChrome(doc, palette, generatedDate);
	return doc.output("blob");
}

function percentFor(
	record: AuditComparisonReportInput["records"][number],
	domain: (typeof domainOrder)[number]
): number | null {
	const score = record.raw_domain_scores[domain];
	const max = record.raw_domain_maximums[domain];
	return scorePercentage(score, max);
}
function formatDelta(delta?: number | null): string {
	if (delta === null || delta === undefined) return SCORE_UNAVAILABLE;
	if (delta > 0) return `+${delta.toFixed(0)}`;
	if (delta < 0) return `${delta.toFixed(0)}`;
	return "0";
}
