/**
 * R1 — Individual Audit Report PDF. One submitted audit, self-contained: cover
 * with headline measures, score summary (table + radar + domain bars), section
 * weighting, domain-grouped responses with colored banners, and comments.
 */
import autoTable from "jspdf-autotable";

import { buildDomainBarsSvg } from "../charts/domain-bars";
import { buildRadarSvg } from "../charts/radar";
import { rasterizeSvg } from "../charts/raster";
import {
	buildAuditOverview,
	buildCommentRows,
	buildDomainBarRows,
	buildRadarValues,
	buildResponseGroups,
	buildScoreTableRows,
	buildWeightingRows
} from "../row-builders";
import { domainLabels, domainOrder, type AuditReportInput, type ExportPalette } from "../types";
import {
	contentWidth,
	createReportDoc,
	drawBannerTable,
	drawChartImage,
	drawCover,
	drawParagraph,
	drawSectionTitle,
	finalizeChrome,
	hexToRgb,
	lastTableY,
	PAGE
} from "./pdf-shared";

export async function generateAuditPdf(
	input: AuditReportInput,
	palette: ExportPalette,
	generatedDate: Date = new Date()
): Promise<Blob> {
	const { submission, instrument } = input;
	const doc = createReportDoc();
	const overview = buildAuditOverview(submission);
	const submittedLabel = formatDateTime(submission.submitted_at);

	// Cover.
	let y = await drawCover(doc, palette, {
		title: `${overview.placeName} — YEE Audit Report`,
		subtitle: `Submitted by ${overview.auditorId} on ${submittedLabel}. Scores and comments are locked as recorded.`,
		measures: [
			{ label: overview.raw.label, value: `${overview.raw.value}/${overview.raw.max}`, sub: `${overview.raw.percent.toFixed(0)}% of available`, band: overview.raw.band },
			{ label: overview.weighted.label, value: `${overview.weighted.value}/${overview.weighted.max}`, sub: `${overview.weighted.percent.toFixed(0)}% of available`, band: overview.weighted.band }
		]
	});

	// Overview detail table.
	y = drawSectionTitle(doc, palette, "Submission overview", y);
	autoTable(doc, {
		startY: y,
		margin: { top: PAGE.continuationTop, bottom: PAGE.marginBottom, left: PAGE.marginX, right: PAGE.marginX },
		theme: "plain",
		styles: { font: "helvetica", fontSize: 9, cellPadding: 2.5, textColor: hexToRgb(palette.brand.foreground) },
		body: overview.fields.map(field => [
			{ content: field.label, styles: { fontStyle: "bold" as const, textColor: hexToRgb(palette.brand.muted), cellWidth: 130 } },
			{ content: field.value || "Not recorded" }
		])
	});
	y = lastTableY(doc) + 10;

	// Score summary: table + charts.
	y = drawSectionTitle(doc, palette, "Score summary", y);
	const scoreRows = buildScoreTableRows(submission);
	autoTable(doc, {
		startY: y,
		margin: { top: PAGE.continuationTop, bottom: PAGE.marginBottom, left: PAGE.marginX, right: PAGE.marginX },
		theme: "grid",
		head: [["Section", "Raw score", "Raw %", "Youth-weighted", "YW %"]],
		body: scoreRows.map(row => [
			row.label,
			`${round1(row.rawScore)} / ${round1(row.rawMax)}`,
			`${row.rawPercent.toFixed(0)}%`,
			`${round2(row.weightedScore)} / ${round2(row.weightedMax)}`,
			`${row.weightedPercent.toFixed(0)}%`
		]),
		styles: { font: "helvetica", fontSize: 8.5, cellPadding: 4, lineColor: hexToRgb(palette.brand.border), lineWidth: 0.4, textColor: hexToRgb(palette.brand.foreground) },
		headStyles: { fillColor: hexToRgb(palette.brand.green900), textColor: [255, 255, 255], fontStyle: "bold" },
		columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" } },
		didParseCell: data => {
			if (data.section === "body" && data.column.index === 0) {
				data.cell.styles.fillColor = hexToRgb(palette.domains[scoreRows[data.row.index].domainKey].light);
				data.cell.styles.textColor = hexToRgb(palette.domains[scoreRows[data.row.index].domainKey].text);
				data.cell.styles.fontStyle = "bold";
			}
		}
	});
	y = lastTableY(doc) + 12;

	// Charts (rasterized standalone SVG).
	const radarSvg = buildRadarSvg({
		axisLabels: domainOrder.map(domain => domainLabels[domain]),
		palette,
		series: [{ label: overview.placeName, color: palette.chartSeries[0], values: buildRadarValues(submission) }],
		size: 320
	});
	const barsSvg = buildDomainBarsSvg({ rows: buildDomainBarRows(submission), palette, width: 720 });
	// Rasterization needs a browser canvas; if it's unavailable (or fails) the
	// PDF still renders — the tables carry the same numbers, so we skip the
	// chart rather than abort the document.
	const [radar, bars] = await Promise.all([tryRasterize(radarSvg), tryRasterize(barsSvg)]);
	if (radar) {
		y = drawChartImage(doc, radar.dataUrl, radar.width, radar.height, y, { maxWidth: contentWidth(doc) * 0.62, maxHeight: 240 });
	}
	if (bars) {
		y = drawChartImage(doc, bars.dataUrl, bars.width, bars.height, y + 4, { maxHeight: 220 });
	}

	// Section weighting.
	y = drawSectionTitle(doc, palette, "Section weighting", y + 6);
	autoTable(doc, {
		startY: y,
		margin: { top: PAGE.continuationTop, bottom: PAGE.marginBottom, left: PAGE.marginX, right: PAGE.marginX },
		theme: "grid",
		head: [["Section", "Importance", "Weight", "Normalized"]],
		body: buildWeightingRows(submission).map(row => [
			row.label,
			row.weightLabel,
			row.weight ? `${row.weight}/3` : "Not recorded",
			`${row.normalizedPercent}%`
		]),
		styles: { font: "helvetica", fontSize: 8.5, cellPadding: 4, lineColor: hexToRgb(palette.brand.border), lineWidth: 0.4, textColor: hexToRgb(palette.brand.foreground) },
		headStyles: { fillColor: hexToRgb(palette.brand.green900), textColor: [255, 255, 255], fontStyle: "bold" },
		columnStyles: { 2: { halign: "right" }, 3: { halign: "right" } }
	});
	y = lastTableY(doc) + 8;
	const weightingComments =
		typeof submission.participant_info?.weighting_comments === "string"
			? submission.participant_info.weighting_comments
			: "";
	if (weightingComments) {
		y = drawParagraph(doc, palette, `Weighting comments: ${weightingComments}`, y);
	}

	// Responses, grouped by domain with colored banners.
	const responseGroups = instrument
		? buildResponseGroups(submission, instrument).filter(group => group.items.length > 0)
		: [];
	if (responseGroups.length > 0) {
		y = drawSectionTitle(doc, palette, "Responses", y + 6);
		y = drawBannerTable(doc, palette, {
			startY: y,
			head: ["Question", "Recorded answer", "Condition"],
			sections: responseGroups.map(group => ({
				label: group.label,
				color: palette.domains[group.domainKey].strong,
				rows: group.items.map(item => [item.prompt, item.response || "—", item.condition])
			})),
			columnStyles: { 0: { cellWidth: "auto" }, 1: { cellWidth: 120 }, 2: { cellWidth: 90 } }
		});
		y += 8;
	}

	// Comments.
	y = drawSectionTitle(doc, palette, "Auditor comments", y + 6);
	autoTable(doc, {
		startY: y,
		margin: { top: PAGE.continuationTop, bottom: PAGE.marginBottom, left: PAGE.marginX, right: PAGE.marginX },
		theme: "plain",
		styles: { font: "helvetica", fontSize: 9, cellPadding: 3, textColor: hexToRgb(palette.brand.foreground), overflow: "linebreak" },
		body: buildCommentRows(submission).map(row => [
			{ content: row.label, styles: { fontStyle: "bold" as const, textColor: hexToRgb(palette.brand.muted), cellWidth: 130 } },
			{ content: row.value || "No comments submitted." }
		])
	});

	finalizeChrome(doc, palette, generatedDate);
	return doc.output("blob");
}

async function tryRasterize(svg: string): Promise<Awaited<ReturnType<typeof rasterizeSvg>> | null> {
	try {
		return await rasterizeSvg(svg, 2);
	} catch {
		return null;
	}
}
function round1(value: number): number {
	return Math.round(value * 10) / 10;
}
function round2(value: number): number {
	return Math.round(value * 100) / 100;
}
function formatDateTime(value: string): string {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return date.toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" });
}
