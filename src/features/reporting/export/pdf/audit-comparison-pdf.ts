/**
 * R4 — Audit Comparison Report PDF (2–3 selected audits). Side-by-side summary,
 * per-domain delta table (with an explicit Δ column when exactly two audits are
 * selected), radar overlay, and grouped domain bars — side-by-side reads more
 * clearly than stacked when comparing a few audits (logistics §6).
 */
import autoTable from "jspdf-autotable";

import { auditRawPercent, auditWeightedPercent, pairwiseDomainDeltas } from "../comparison-metrics";
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
		head: [["Place", "Auditor", "Date", "Raw", "Raw %", "Youth-weighted", "YW %"]],
		body: records.map(record => [
			record.place_name,
			resolveAuditorId(record.auditor_id),
			record.date,
			`${record.total_raw_score}/${record.total_raw_maximum}`,
			`${auditRawPercent(record).toFixed(0)}%`,
			`${record.total_weighted_score.toFixed(2)}/${record.total_weighted_maximum.toFixed(2)}`,
			`${auditWeightedPercent(record).toFixed(0)}%`
		]),
		styles: { font: "helvetica", fontSize: 8.5, cellPadding: 4, lineColor: hexToRgb(palette.brand.border), lineWidth: 0.4, textColor: hexToRgb(palette.brand.foreground) },
		headStyles: { fillColor: hexToRgb(palette.brand.green900), textColor: [255, 255, 255], fontStyle: "bold" },
		columnStyles: { 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" }, 6: { halign: "right" } },
		didParseCell: data => {
			if (data.section === "body" && (data.column.index === 4 || data.column.index === 6)) {
				const record = records[data.row.index];
				const percent = data.column.index === 4 ? auditRawPercent(record) : auditWeightedPercent(record);
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
			...row.values.map(value => `${value.toFixed(0)}%`),
			...(twoUp ? [formatDelta(row.delta ?? 0)] : [])
		]),
		styles: { font: "helvetica", fontSize: 8.5, cellPadding: 4, halign: "center", lineColor: hexToRgb(palette.brand.border), lineWidth: 0.4, textColor: hexToRgb(palette.brand.foreground) },
		headStyles: { fillColor: hexToRgb(palette.brand.green900), textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7.5 },
		columnStyles: { 0: { halign: "left", fontStyle: "bold" } },
		didParseCell: data => {
			if (twoUp && data.section === "body" && data.column.index === deltaHead.length - 1) {
				const delta = deltas[data.row.index].delta ?? 0;
				const key = delta > 0 ? "high" : delta < 0 ? "low" : "mid";
				data.cell.styles.textColor = hexToRgb(palette.bands[key].fg);
				data.cell.styles.fontStyle = "bold";
			}
		}
	});
	y = lastTableY(doc) + 12;

	// Radar overlay + grouped bars.
	const radarSvg = buildRadarSvg({
		axisLabels: domainOrder.map(domain => domainLabels[domain]),
		palette,
		size: 340,
		series: records.map((record, index) => ({
			label: seriesLabels[index],
			color: palette.chartSeries[index % palette.chartSeries.length],
			values: domainOrder.map(domain => percentFor(record, domain))
		}))
	});
	const groupedSvg = buildGroupedBarsSvg({
		palette,
		width: 720,
		series: records.map((_, index) => ({ label: seriesLabels[index], color: palette.chartSeries[index % palette.chartSeries.length] })),
		groups: domainOrder.map(domain => ({ label: domainLabels[domain], values: records.map(record => percentFor(record, domain)) }))
	});
	const [radar, grouped] = await Promise.all([rasterizeSvg(radarSvg, 2).catch(() => null), rasterizeSvg(groupedSvg, 2).catch(() => null)]);
	if (radar) {
		y = drawSectionTitle(doc, palette, "Domain profile overlay", y);
		y = drawChartImage(doc, radar.dataUrl, radar.width, radar.height, y, { maxWidth: contentWidth(doc) * 0.72, maxHeight: 280 });
	}
	if (grouped) {
		y = drawSectionTitle(doc, palette, "Grouped domain bars", y + 4);
		y = drawChartImage(doc, grouped.dataUrl, grouped.width, grouped.height, y, { maxHeight: 240 });
	}

	finalizeChrome(doc, palette, generatedDate);
	return doc.output("blob");
}

function percentFor(record: AuditComparisonReportInput["records"][number], domain: (typeof domainOrder)[number]): number {
	const score = record.raw_domain_scores[domain];
	const max = record.raw_domain_maximums[domain];
	return max ? Math.max(0, Math.min(100, (score / max) * 100)) : 0;
}
function formatDelta(delta: number): string {
	if (delta > 0) return `+${delta.toFixed(0)}`;
	if (delta < 0) return `${delta.toFixed(0)}`;
	return "0";
}
