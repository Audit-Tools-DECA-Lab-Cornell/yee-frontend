/**
 * R1 - Individual Audit Report PDF. One submitted audit, self-contained: cover
 * with headline measures, score summary (table + radar + domain bars), section
 * weighting, domain-grouped responses with colored banners, and comments.
 */
import autoTable from "jspdf-autotable";

import { formatScoreFraction, formatScorePercent, formatScoreSummary, SCORE_UNAVAILABLE } from "@/lib/score-format";

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
	const score = submission.score;
	const rawPercentLabel = formatScorePercent(score.total_raw_score, score.total_raw_maximum);
	const weightedPercentLabel = formatScorePercent(score.total_weighted_score, score.total_weighted_maximum);

	// Cover.
	let y = await drawCover(doc, palette, {
		title: `${overview.placeName} – YEE Audit Report`,
		subtitle: `Submitted by ${overview.auditorId} on ${submittedLabel}. Scores and comments are locked as recorded.`,
		measures: [
			{
				label: overview.raw.label,
				value: rawPercentLabel ?? SCORE_UNAVAILABLE,
				sub: formatScoreFraction(score.total_raw_score, score.total_raw_maximum),
				band: overview.raw.band
			},
			{
				label: overview.weighted.label,
				value: weightedPercentLabel ?? SCORE_UNAVAILABLE,
				sub: formatScoreFraction(score.total_weighted_score, score.total_weighted_maximum, 2),
				band: overview.weighted.band
			}
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
			{
				content: field.label,
				styles: { fontStyle: "bold" as const, textColor: hexToRgb(palette.brand.muted), cellWidth: 130 }
			},
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
		head: [["Section", "Raw", "Youth-weighted"]],
		body: scoreRows.map(row => [
			row.label,
			formatScoreSummary(round1(row.rawScore), round1(row.rawMax)),
			formatScoreSummary(round2(row.weightedScore), round2(row.weightedMax), 2)
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
		columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } },
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
	const radarValues = buildRadarValues(submission);
	const domainBars = buildDomainBarRows(submission);
	const radarSvg =
		radarValues.length === domainOrder.length
			? buildRadarSvg({
					axisLabels: domainOrder.map(domain => domainLabels[domain]),
					axisColors: domainOrder.map(domain => palette.domains[domain].text),
					palette,
					series: [{ label: overview.placeName, color: palette.chartSeries[0], values: radarValues }]
				})
			: null;
	const barsSvg =
		domainBars.length === domainOrder.length ? buildDomainBarsSvg({ rows: domainBars, palette, width: 720 }) : null;
	// Rasterization needs a browser canvas; if it's unavailable (or fails) the
	// PDF still renders - the tables carry the same numbers, so we skip the
	// chart rather than abort the document.
	const [radar, bars] = await Promise.all([
		radarSvg === null ? null : tryRasterize(radarSvg),
		barsSvg === null ? null : tryRasterize(barsSvg)
	]);
	if (radar) {
		y = drawChartImage(doc, radar.dataUrl, radar.width, radar.height, y, {
			maxWidth: contentWidth(doc) * 0.92,
			maxHeight: 260
		});
	}
	if (bars) {
		y = drawChartImage(doc, bars.dataUrl, bars.width, bars.height, y + 6, { maxHeight: 280 });
	}

	// Section weighting.
	y = drawSectionTitle(doc, palette, "Section weighting", y);
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
		styles: {
			font: "helvetica",
			fontSize: 8.5,
			cellPadding: 4,
			lineColor: hexToRgb(palette.brand.border),
			lineWidth: 0.4,
			textColor: hexToRgb(palette.brand.foreground)
		},
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
		y = drawSectionTitle(doc, palette, "Responses", y);
		y = drawBannerTable(doc, palette, {
			startY: y,
			head: ["Question", "Recorded answer", "Condition"],
			sections: responseGroups.map(group => ({
				label: group.label,
				color: palette.domains[group.domainKey].strong,
				// "n/a" is the data-layer sentinel for "no condition pair" (kept
				// verbatim in the frozen CSV / raw-data exports); show an em dash in
				// the presentation PDF instead.
				rows: group.items.map(item => [
					item.prompt,
					item.response || "—",
					item.condition === "n/a" ? "—" : item.condition
				])
			})),
			columnStyles: { 0: { cellWidth: "auto" }, 1: { cellWidth: 120 }, 2: { cellWidth: 90 } }
		});
		y += 8;
	}

	// Comments.
	y = drawSectionTitle(doc, palette, "Auditor comments", y);
	autoTable(doc, {
		startY: y,
		margin: { top: PAGE.continuationTop, bottom: PAGE.marginBottom, left: PAGE.marginX, right: PAGE.marginX },
		theme: "plain",
		styles: {
			font: "helvetica",
			fontSize: 9,
			cellPadding: 3,
			textColor: hexToRgb(palette.brand.foreground),
			overflow: "linebreak"
		},
		body: buildCommentRows(submission).map(row => [
			{
				content: row.label,
				styles: { fontStyle: "bold" as const, textColor: hexToRgb(palette.brand.muted), cellWidth: 130 }
			},
			{ content: row.value || "No comments submitted." }
		])
	});

	await finalizeChrome(doc, palette, generatedDate);
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
