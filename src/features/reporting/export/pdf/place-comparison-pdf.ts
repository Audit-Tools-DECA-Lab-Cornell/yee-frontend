/**
 * R2 — Place Comparison Report PDF. Exports what the Compare Places mode shows,
 * honoring the active filters (printed on the cover). Ranking table + band-tinted
 * domain matrix + top-3 radar overlay (same limit as the dashboard).
 */
import autoTable from "jspdf-autotable";

import { buildRadarSvg } from "../charts/radar";
import { rasterizeSvg } from "../charts/raster";
import { bandForPercent } from "../export-palette";
import { domainLabels, domainOrder, type ExportPalette, type PlaceComparisonReportInput } from "../types";
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

export async function generatePlaceComparisonPdf(
	input: PlaceComparisonReportInput,
	palette: ExportPalette,
	generatedDate: Date = new Date()
): Promise<Blob> {
	const { summaries, scope } = input;
	const doc = createReportDoc();

	let y = await drawCover(doc, palette, {
		title: "Place Comparison Report",
		subtitle: "Average performance across the places in the current view.",
		scopeLine: `Scope: ${scope.line} · ${scope.auditCount} audits · ${scope.placeCount} places`
	});

	// Ranking table.
	y = drawSectionTitle(doc, palette, "Ranking", y);
	autoTable(doc, {
		startY: y,
		margin: { top: PAGE.continuationTop, bottom: PAGE.marginBottom, left: PAGE.marginX, right: PAGE.marginX },
		theme: "grid",
		head: [["Place", "Project", "Audits", "Avg raw", "Raw %", "Avg youth-weighted", "YW %"]],
		body: summaries.map(summary => [
			summary.placeName,
			summary.projectName,
			String(summary.auditCount),
			summary.avgRawScore.toFixed(1),
			`${summary.avgRawPercent.toFixed(0)}%`,
			summary.avgWeightedScore.toFixed(2),
			`${summary.avgWeightedPercent.toFixed(0)}%`
		]),
		styles: { font: "helvetica", fontSize: 8.5, cellPadding: 4, lineColor: hexToRgb(palette.brand.border), lineWidth: 0.4, textColor: hexToRgb(palette.brand.foreground) },
		headStyles: { fillColor: hexToRgb(palette.brand.green900), textColor: [255, 255, 255], fontStyle: "bold" },
		columnStyles: { 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" }, 6: { halign: "right" } }
	});
	y = lastTableY(doc) + 12;

	// Domain matrix — cells tinted by score band.
	y = drawSectionTitle(doc, palette, "Domain matrix (raw %)", y);
	const matrixHead = ["Place", ...domainOrder.map(domain => domainLabels[domain])];
	const matrixBody = summaries.map(summary => [summary.placeName, ...domainOrder.map(domain => `${summary.rawPercentByDomain[domain].toFixed(0)}%`)]);
	autoTable(doc, {
		startY: y,
		margin: { top: PAGE.continuationTop, bottom: PAGE.marginBottom, left: PAGE.marginX, right: PAGE.marginX },
		theme: "grid",
		head: [matrixHead],
		body: matrixBody,
		styles: { font: "helvetica", fontSize: 8, cellPadding: 3.5, halign: "center", lineColor: hexToRgb(palette.brand.border), lineWidth: 0.4, textColor: hexToRgb(palette.brand.foreground) },
		headStyles: { fillColor: hexToRgb(palette.brand.green900), textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7.5 },
		columnStyles: { 0: { halign: "left", fontStyle: "bold" } },
		didParseCell: data => {
			if (data.section === "body" && data.column.index > 0) {
				const summary = summaries[data.row.index];
				const domain = domainOrder[data.column.index - 1];
				const band = bandForPercent(summary.rawPercentByDomain[domain]);
				data.cell.styles.fillColor = hexToRgb(palette.bands[band].bg);
				data.cell.styles.textColor = hexToRgb(palette.bands[band].fg);
			}
		}
	});
	y = lastTableY(doc) + 12;

	// Radar overlay — top 3 places.
	const topPlaces = summaries.slice(0, 3);
	if (topPlaces.length > 0) {
		y = drawSectionTitle(doc, palette, `Domain profile — top ${topPlaces.length} places`, y);
		const radarSvg = buildRadarSvg({
			axisLabels: domainOrder.map(domain => domainLabels[domain]),
			palette,
			size: 340,
			series: topPlaces.map((summary, index) => ({
				label: summary.placeName,
				color: palette.chartSeries[index % palette.chartSeries.length],
				values: domainOrder.map(domain => summary.rawPercentByDomain[domain])
			}))
		});
		const radar = await rasterizeSvg(radarSvg, 2).catch(() => null);
		if (radar) {
			y = drawChartImage(doc, radar.dataUrl, radar.width, radar.height, y, { maxWidth: contentWidth(doc) * 0.72, maxHeight: 280 });
		}
	}

	finalizeChrome(doc, palette, generatedDate);
	return doc.output("blob");
}
