/**
 * Shared jsPDF helpers: page geometry, brand header/footer chrome, cover block,
 * section titles, domain section-banner rows (the COPA pattern), and chart image
 * fitting. Every YEE PDF (R1–R4) is assembled from these so the documents share
 * one identity.
 */
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import type { ExportPalette, ScoreBandKey } from "../types";

/** A4 portrait, points. */
export const PAGE = {
	marginX: 40,
	marginTop: 92, // room for the brand header band
	continuationTop: 56, // slim header on pages 2+
	marginBottom: 46 // room for the footer
};

export type Rgb = [number, number, number];

export function hexToRgb(hex: string): Rgb {
	const clean = hex.replace("#", "");
	const value = clean.length === 3
		? clean
				.split("")
				.map(c => c + c)
				.join("")
		: clean;
	const int = parseInt(value, 16);
	return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

export function bandColor(palette: ExportPalette, band: ScoreBandKey): Rgb {
	return hexToRgb(palette.bands[band].fg);
}

export function createReportDoc(): jsPDF {
	return new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
}

export function pageWidth(doc: jsPDF): number {
	return doc.internal.pageSize.getWidth();
}

export function pageHeight(doc: jsPDF): number {
	return doc.internal.pageSize.getHeight();
}

export function contentWidth(doc: jsPDF): number {
	return pageWidth(doc) - PAGE.marginX * 2;
}

/** Read the finalY of the most recent autoTable without relying on augmentation. */
export function lastTableY(doc: jsPDF): number {
	const table = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable;
	return table?.finalY ?? PAGE.marginTop;
}

function setFill(doc: jsPDF, hex: string): void {
	const [r, g, b] = hexToRgb(hex);
	doc.setFillColor(r, g, b);
}

function setText(doc: jsPDF, hex: string): void {
	const [r, g, b] = hexToRgb(hex);
	doc.setTextColor(r, g, b);
}

function setDraw(doc: jsPDF, hex: string): void {
	const [r, g, b] = hexToRgb(hex);
	doc.setDrawColor(r, g, b);
}

/** Ensure `needed` pts fit below `y`; add a page and return the new top if not. */
export function ensureSpace(doc: jsPDF, y: number, needed: number): number {
	if (y + needed <= pageHeight(doc) - PAGE.marginBottom) return y;
	doc.addPage();
	return PAGE.continuationTop;
}

/** Section heading with a colored tick; returns the y below it. */
export function drawSectionTitle(doc: jsPDF, palette: ExportPalette, title: string, y: number): number {
	const top = ensureSpace(doc, y, 34);
	setFill(doc, palette.brand.green900);
	doc.rect(PAGE.marginX, top - 9, 3, 13, "F");
	setText(doc, palette.brand.foreground);
	doc.setFont("helvetica", "bold");
	doc.setFontSize(13);
	doc.text(title, PAGE.marginX + 10, top + 2);
	return top + 16;
}

/** Wrapped paragraph in muted text; returns the y below it. */
export function drawParagraph(doc: jsPDF, palette: ExportPalette, text: string, y: number, size = 9.5): number {
	if (!text) return y;
	setText(doc, palette.brand.muted);
	doc.setFont("helvetica", "normal");
	doc.setFontSize(size);
	const lines = doc.splitTextToSize(text, contentWidth(doc));
	let top = ensureSpace(doc, y, lines.length * (size + 3));
	doc.text(lines, PAGE.marginX, top + size);
	top += lines.length * (size + 3) + 2;
	return top;
}

export type CoverOptions = {
	title: string;
	subtitle: string;
	/** Optional scope/filter line printed under the subtitle (self-describing). */
	scopeLine?: string;
	/** Optional headline measures (raw + weighted) with colored band chips. */
	measures?: { label: string; value: string; sub: string; band: ScoreBandKey }[];
};

/**
 * Draw the brand cover block at the top of page 1. Returns the y below it.
 */
export function drawCover(doc: jsPDF, palette: ExportPalette, options: CoverOptions): number {
	const width = pageWidth(doc);
	// Deep-green title band.
	setFill(doc, palette.brand.green950);
	doc.rect(0, 0, width, 74, "F");
	setText(doc, "#ffffff");
	doc.setFont("helvetica", "bold");
	doc.setFontSize(15);
	doc.text("YEE Audit Tools", PAGE.marginX, 34);
	setText(doc, palette.brand.green50);
	doc.setFont("helvetica", "normal");
	doc.setFontSize(9);
	doc.text("Youth Enabling Environments Collaborative", PAGE.marginX, 52);

	let y = 104;
	setText(doc, palette.brand.foreground);
	doc.setFont("helvetica", "bold");
	doc.setFontSize(20);
	const titleLines = doc.splitTextToSize(options.title, contentWidth(doc));
	doc.text(titleLines, PAGE.marginX, y);
	y += titleLines.length * 22;

	setText(doc, palette.brand.muted);
	doc.setFont("helvetica", "normal");
	doc.setFontSize(10.5);
	const subLines = doc.splitTextToSize(options.subtitle, contentWidth(doc));
	doc.text(subLines, PAGE.marginX, y + 4);
	y += subLines.length * 14 + 6;

	if (options.scopeLine) {
		setText(doc, palette.brand.green900);
		doc.setFont("helvetica", "bold");
		doc.setFontSize(9);
		const scopeLines = doc.splitTextToSize(options.scopeLine, contentWidth(doc));
		doc.text(scopeLines, PAGE.marginX, y + 8);
		y += scopeLines.length * 12 + 8;
	}

	if (options.measures && options.measures.length > 0) {
		y += 8;
		const gap = 12;
		const cardWidth = (contentWidth(doc) - gap * (options.measures.length - 1)) / options.measures.length;
		options.measures.forEach((measure, index) => {
			const x = PAGE.marginX + index * (cardWidth + gap);
			setFill(doc, palette.bands[measure.band].bg);
			setDraw(doc, palette.bands[measure.band].fg);
			doc.setLineWidth(0.75);
			doc.roundedRect(x, y, cardWidth, 58, 5, 5, "FD");
			setText(doc, palette.brand.muted);
			doc.setFont("helvetica", "bold");
			doc.setFontSize(8);
			doc.text(measure.label.toUpperCase(), x + 12, y + 18);
			setText(doc, palette.brand.foreground);
			doc.setFont("helvetica", "bold");
			doc.setFontSize(19);
			doc.text(measure.value, x + 12, y + 40);
			setText(doc, palette.bands[measure.band].fg);
			doc.setFont("helvetica", "normal");
			doc.setFontSize(9);
			doc.text(measure.sub, x + 12, y + 52);
		});
		y += 58;
	}

	return y + 14;
}

/**
 * Fit a chart PNG into `maxWidth` × `maxHeight`, centered, adding a page if it
 * doesn't fit below `y`. Returns the y below the image.
 */
export function drawChartImage(
	doc: jsPDF,
	dataUrl: string,
	pixelWidth: number,
	pixelHeight: number,
	y: number,
	options: { maxWidth?: number; maxHeight?: number } = {}
): number {
	const maxWidth = options.maxWidth ?? contentWidth(doc);
	const maxHeight = options.maxHeight ?? 260;
	const ratio = pixelHeight / pixelWidth;
	let drawWidth = maxWidth;
	let drawHeight = drawWidth * ratio;
	if (drawHeight > maxHeight) {
		drawHeight = maxHeight;
		drawWidth = drawHeight / ratio;
	}
	const top = ensureSpace(doc, y, drawHeight + 8);
	const x = PAGE.marginX + (contentWidth(doc) - drawWidth) / 2;
	doc.addImage(dataUrl, "PNG", x, top, drawWidth, drawHeight, undefined, "FAST");
	return top + drawHeight + 8;
}

/**
 * Draw the brand chrome on every page AFTER all content exists, so "Page X of Y"
 * is accurate. Slim header wordmark on continuation pages; footer everywhere.
 */
export function finalizeChrome(doc: jsPDF, palette: ExportPalette, generatedDate: Date): void {
	const total = doc.getNumberOfPages();
	const stamp = generatedDate.toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });
	for (let page = 1; page <= total; page += 1) {
		doc.setPage(page);
		const width = pageWidth(doc);
		const height = pageHeight(doc);

		if (page > 1) {
			setText(doc, palette.brand.green900);
			doc.setFont("helvetica", "bold");
			doc.setFontSize(9);
			doc.text("YEE Audit Tools", PAGE.marginX, 32);
			setDraw(doc, palette.brand.border);
			doc.setLineWidth(0.5);
			doc.line(PAGE.marginX, 40, width - PAGE.marginX, 40);
		}

		setDraw(doc, palette.brand.border);
		doc.setLineWidth(0.5);
		doc.line(PAGE.marginX, height - 32, width - PAGE.marginX, height - 32);
		setText(doc, palette.brand.muted);
		doc.setFont("helvetica", "normal");
		doc.setFontSize(8);
		doc.text(`Generated ${stamp} · YEE Audit Tools`, PAGE.marginX, height - 20);
		doc.text(`Page ${page} of ${total}`, width - PAGE.marginX, height - 20, { align: "right" });
	}
}

/**
 * Render a domain-grouped table where each domain is introduced by a colored
 * section-banner row (COPA pattern). `sections` supply the banner label/color
 * and the body rows beneath it. Returns the y below the table.
 */
export function drawBannerTable(
	doc: jsPDF,
	palette: ExportPalette,
	options: {
		startY: number;
		head: string[];
		sections: { label: string; color: string; rows: string[][] }[];
		columnStyles?: Record<number, { cellWidth?: number | "auto"; halign?: "left" | "center" | "right" }>;
	}
): number {
	type BannerRow = { banner?: { label: string; color: string }; cells?: string[] };
	const body: BannerRow[] = [];
	for (const section of options.sections) {
		body.push({ banner: { label: section.label, color: section.color } });
		for (const row of section.rows) body.push({ cells: row });
	}

	const columnCount = options.head.length;
	autoTable(doc, {
		startY: options.startY,
		margin: { top: PAGE.continuationTop, bottom: PAGE.marginBottom, left: PAGE.marginX, right: PAGE.marginX },
		head: [options.head],
		body: body.map(row =>
			row.banner ? [{ content: row.banner.label, colSpan: columnCount }] : (row.cells ?? [])
		),
		theme: "grid",
		styles: { font: "helvetica", fontSize: 8.5, cellPadding: 4, overflow: "linebreak", lineColor: hexToRgb(palette.brand.border), lineWidth: 0.4, textColor: hexToRgb(palette.brand.foreground) },
		headStyles: { fillColor: hexToRgb(palette.brand.green900), textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8.5 },
		columnStyles: options.columnStyles,
		didParseCell: data => {
			const raw = body[data.row.index];
			if (data.section === "body" && raw?.banner) {
				const [r, g, b] = hexToRgb(raw.banner.color);
				data.cell.styles.fillColor = [r, g, b];
				data.cell.styles.textColor = [255, 255, 255];
				data.cell.styles.fontStyle = "bold";
				data.cell.styles.fontSize = 9;
			}
		}
	});
	return lastTableY(doc);
}
