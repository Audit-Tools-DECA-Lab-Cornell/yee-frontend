/**
 * R3 — Trend Report PDF (one place over time). Trend chart + audit timeline
 * table + the change summary (per-domain first-vs-latest delta), which is new
 * content that debuts in exports (logistics §6). jsPDF's Helvetica can't render
 * ▲/▼, so direction is shown with color-coded signed deltas.
 */
import autoTable from "jspdf-autotable";

import { SCORE_UNAVAILABLE, formatScoreSummary } from "@/lib/score-format";

import { auditRawPercent, auditWeightedPercent, firstVsLatestDeltas } from "../comparison-metrics";
import { buildTrendSvg } from "../charts/trend";
import { rasterizeSvg } from "../charts/raster";
import { resolveAuditorId } from "../identity";
import { type ExportPalette, type TrendReportInput } from "../types";
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

export async function generateTrendPdf(
	input: TrendReportInput,
	palette: ExportPalette,
	generatedDate: Date = new Date()
): Promise<Blob> {
	const { placeName, projectName, records, scope } = input;
	const doc = createReportDoc();
	const sorted = [...records].sort((a, b) => timeOf(a.date) - timeOf(b.date));

	let y = await drawCover(doc, palette, {
		title: `Trend Report — ${placeName}`,
		subtitle: `${projectName}. How this place changes across repeated audits.`,
		scopeLine: `Scope: ${scope.line} · ${sorted.length} audits in range`
	});

	// Trend chart.
	const trendPoints = sorted.flatMap(record => {
		const rawPercent = auditRawPercent(record);
		const weightedPercent = auditWeightedPercent(record);
		if (rawPercent === null || weightedPercent === null) return [];
		return [{ label: record.date, rawPercent, weightedPercent }];
	});
	const trendSvg = buildTrendSvg({
		palette,
		width: 760,
		points: trendPoints
	});
	const trend = await rasterizeSvg(trendSvg, 2).catch(() => null);
	if (trend) {
		y = drawSectionTitle(doc, palette, "Performance over time", y);
		y = drawChartImage(doc, trend.dataUrl, trend.width, trend.height, y, {
			maxWidth: contentWidth(doc),
			maxHeight: 280
		});
	}

	// Audit timeline table.
	y = drawSectionTitle(doc, palette, "Audit timeline", y);
	autoTable(doc, {
		startY: y,
		margin: { top: PAGE.continuationTop, bottom: PAGE.marginBottom, left: PAGE.marginX, right: PAGE.marginX },
		theme: "grid",
		head: [["Date", "Auditor", "Participant", "Raw", "Youth-weighted"]],
		body: sorted.map(record => [
			record.date,
			resolveAuditorId(record.auditor_id),
			record.participant_id || "—",
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
		columnStyles: { 3: { halign: "right" }, 4: { halign: "right" } }
	});
	y = lastTableY(doc) + 12;

	// Change summary — per-domain first-vs-latest delta.
	if (sorted.length >= 2) {
		y = drawSectionTitle(doc, palette, "Change summary (first vs latest, raw %)", y);
		const deltas = firstVsLatestDeltas(sorted);
		autoTable(doc, {
			startY: y,
			margin: { top: PAGE.continuationTop, bottom: PAGE.marginBottom, left: PAGE.marginX, right: PAGE.marginX },
			theme: "grid",
			head: [["Section", "First", "Latest", "Change"]],
			body: deltas.map(delta => [
				delta.label,
				formatPercent(delta.first),
				formatPercent(delta.latest),
				formatDelta(delta.delta)
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
			columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" } },
			didParseCell: data => {
				// Section column: the row IS a domain, so it wears that domain's tint.
				if (data.section === "body" && data.column.index === 0) {
					const colors = palette.domains[deltas[data.row.index].domainKey];
					data.cell.styles.fillColor = hexToRgb(colors.light);
					data.cell.styles.textColor = hexToRgb(colors.text);
				}
				if (data.section === "body" && data.column.index === 3) {
					const delta = deltas[data.row.index].delta;
					if (delta === null) return;
					const key = delta > 0 ? "high" : delta < 0 ? "low" : "mid";
					data.cell.styles.textColor = hexToRgb(palette.bands[key].fg);
					data.cell.styles.fontStyle = "bold";
				}
			}
		});
	}

	await finalizeChrome(doc, palette, generatedDate);
	return doc.output("blob");
}

function formatPercent(value: number | null): string {
	return value === null ? SCORE_UNAVAILABLE : `${value.toFixed(0)}%`;
}

function formatDelta(delta: number | null): string {
	if (delta === null) return SCORE_UNAVAILABLE;
	if (delta > 0) return `+${delta.toFixed(1)} pts`;
	if (delta < 0) return `${delta.toFixed(1)} pts`;
	return "no change";
}
function timeOf(date: string): number {
	const parsed = new Date(date);
	// Unparseable/empty dates sort LAST — not to epoch 0, which would wrongly make
	// an undated record the "earliest" point in the trend chart + timeline.
	return Number.isNaN(parsed.getTime()) ? Number.POSITIVE_INFINITY : parsed.getTime();
}
