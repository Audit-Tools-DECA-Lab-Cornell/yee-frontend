/**
 * PDF export for the YEE reports dashboard.
 *
 * Page layout:
 * - Page 1 (Portrait A4): Executive summary — metrics, domain averages, place rankings
 * - Page 2 (Portrait A4): Place comparison table with all 6 domain scores
 * - Page 3 (Landscape A4): Individual audit records with domain breakdown
 * - Page 4+ (Landscape A4, optional): Raw audit data summary (domain totals)
 *
 * Uses jsPDF + jspdf-autotable, loaded via dynamic import so the bundle is not
 * charged to the initial page load.
 */

import type { PlaceComparisonAuditRecord, RawDataRecord } from "@/lib/dashboard/live-api";
import { domainLabels, domainOrder } from "@/lib/dashboard/reporting";
import { yeeDomainThemes } from "@/lib/yee-domain-theme";
import {
	getDomainYouthWeightedMaximum,
	getYouthWeightedScoreMaximum,
	rawDomainScoreMaximums,
	totalRawScoreMaximum
} from "@/lib/yee-score-limits";

export type YeePdfPlaceSummary = {
	place_id: string;
	place_name: string;
	project_name: string;
	auditCount: number;
	avgRawScore: number;
	avgRawPercent: number;
	avgWeightedScore: number;
	avgWeightedPercent: number;
	rawPercentByDomain: Record<(typeof domainOrder)[number], number>;
	weightedPercentByDomain: Record<(typeof domainOrder)[number], number>;
};

export type YeePdfInput = {
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

// ── Colour palette ─────────────────────────────────────────────────────────────

type RGB = [number, number, number];

const YEE_DARK: RGB = [16, 35, 31];
const YEE_GREEN: RGB = [92, 143, 104];
const HEADER_TEXT: RGB = [255, 255, 255];
const BODY_TEXT: RGB = [31, 41, 55];
const MUTED_TEXT: RGB = [107, 114, 128];
const SLATE_DARK: RGB = [51, 65, 85];
const ROW_EVEN: RGB = [248, 250, 252];
const ROW_ODD: RGB = [255, 255, 255];

function hexToRgb(hex: string): RGB {
	const h = hex.replace("#", "");
	return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

const DOMAIN_LIGHT_COLORS = Object.fromEntries(
	domainOrder.map(d => [d, hexToRgb(yeeDomainThemes[d].lightHex)])
) as Record<(typeof domainOrder)[number], RGB>;

const DOMAIN_STRONG_COLORS = Object.fromEntries(
	domainOrder.map(d => [d, hexToRgb(yeeDomainThemes[d].strongHex)])
) as Record<(typeof domainOrder)[number], RGB>;

// ── Internal helpers ───────────────────────────────────────────────────────────

function pct(num: number, den: number): string {
	if (!den) return "0%";
	return `${((num / den) * 100).toFixed(1)}%`;
}

// ── Public API ─────────────────────────────────────────────────────────────────

export async function generateYeePdfBlob(input: YeePdfInput): Promise<Blob> {
	const [{ jsPDF }, { default: autoTable }] = await Promise.all([
		import("jspdf"),
		import("jspdf-autotable")
	]);

	type JsPDFWithTable = InstanceType<typeof jsPDF> & { lastAutoTable: { finalY: number } };

	const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" }) as JsPDFWithTable;
	const margin = 14;

	// ── Page 1: Executive Summary ────────────────────────────────────────────────
	const pw1 = doc.internal.pageSize.getWidth();
	drawPageHeader(doc, pw1, margin, "Reports Dashboard", "Youth Enabling Environments Collaborative");

	let y = 46;

	// Generation metadata
	doc.setFontSize(8);
	doc.setFont("helvetica", "normal");
	doc.setTextColor(...MUTED_TEXT);
	doc.text(`Generated ${input.generatedAt}  ·  ${input.scopeDescription}`, margin, y);
	y += 10;

	// Key metrics
	autoTable(doc, {
		startY: y,
		head: [["Total Audits", "Avg Raw Score", "Avg Raw %", "Avg Youth Weighted Score"]],
		body: [
			[
				String(input.totalAudits),
				`${input.averageRawScore.toFixed(1)} / ${totalRawScoreMaximum}`,
				pct(input.averageRawScore, totalRawScoreMaximum),
				input.averageWeightedScore.toFixed(3)
			]
		],
		styles: { fontSize: 9, cellPadding: 4.5, textColor: BODY_TEXT, font: "helvetica" },
		headStyles: { fillColor: YEE_DARK, textColor: HEADER_TEXT, fontStyle: "bold", fontSize: 7.5 },
		bodyStyles: { fillColor: ROW_ODD },
		margin: { left: margin, right: margin },
		tableWidth: pw1 - margin * 2
	});
	y = doc.lastAutoTable.finalY + 10;

	// Domain averages
	sectionLabel(doc, margin, y, "Average Scores by Domain");
	y += 5;

	const domainRows = domainOrder.map(domain => {
		const rawAvg =
			input.filteredAudits.length > 0
				? input.filteredAudits.reduce((s, a) => s + a.raw_domain_scores[domain], 0) /
					input.filteredAudits.length
				: 0;
		const wtdAvg =
			input.filteredAudits.length > 0
				? input.filteredAudits.reduce((s, a) => s + a.weighted_domain_scores[domain], 0) /
					input.filteredAudits.length
				: 0;
		const max = rawDomainScoreMaximums[domain];
		return [domainLabels[domain], `${rawAvg.toFixed(1)} / ${max}`, pct(rawAvg, max), wtdAvg.toFixed(3)];
	});

	autoTable(doc, {
		startY: y,
		head: [["Domain", "Avg Raw Score", "Avg Raw %", "Avg Youth Weighted"]],
		body: domainRows,
		styles: { fontSize: 8.5, cellPadding: 3.5, textColor: BODY_TEXT, font: "helvetica" },
		headStyles: { fillColor: SLATE_DARK, textColor: HEADER_TEXT, fontStyle: "bold", fontSize: 7.5 },
		bodyStyles: { fillColor: ROW_ODD },
		alternateRowStyles: { fillColor: ROW_EVEN },
		columnStyles: { 0: { fontStyle: "bold" } },
		margin: { left: margin, right: margin },
		tableWidth: pw1 - margin * 2,
		didParseCell: hookData => {
			if (hookData.section === "body" && hookData.column.index === 0) {
				const domain = domainOrder[hookData.row.index];
				if (domain) hookData.cell.styles.fillColor = DOMAIN_LIGHT_COLORS[domain];
			}
		}
	});
	y = doc.lastAutoTable.finalY + 10;

	// Place rankings
	if (input.placeSummaries.length > 0) {
		sectionLabel(doc, margin, y, "Place Rankings (by Youth Weighted Average)");
		y += 5;

		const rankRows = input.placeSummaries.map((s, i) => [
			String(i + 1),
			s.place_name,
			s.project_name,
			String(s.auditCount),
			`${s.avgRawScore.toFixed(1)} (${s.avgRawPercent.toFixed(0)}%)`,
			`${s.avgWeightedScore.toFixed(3)} (${s.avgWeightedPercent.toFixed(0)}%)`
		]);

		autoTable(doc, {
			startY: y,
			head: [["#", "Place", "Project", "Audits", "Avg Raw Score", "Avg Youth Weighted"]],
			body: rankRows,
			styles: { fontSize: 8, cellPadding: 3, textColor: BODY_TEXT, font: "helvetica" },
			headStyles: { fillColor: SLATE_DARK, textColor: HEADER_TEXT, fontStyle: "bold", fontSize: 7.5 },
			bodyStyles: { fillColor: ROW_ODD },
			alternateRowStyles: { fillColor: ROW_EVEN },
			columnStyles: { 0: { cellWidth: 10, halign: "center" }, 1: { fontStyle: "bold" }, 3: { halign: "center" } },
			margin: { left: margin, right: margin },
			tableWidth: pw1 - margin * 2
		});
	}

	addPageNumber(doc, 1);

	// ── Page 2: Place Comparison ─────────────────────────────────────────────────
	if (input.placeSummaries.length > 0) {
		doc.addPage("a4", "portrait");
		const pw2 = doc.internal.pageSize.getWidth();
		drawPageHeader(doc, pw2, margin, "Place Comparison", "Raw score % per domain across all places");
		y = 46;

		const shortDomain: Record<(typeof domainOrder)[number], string> = {
			access: "Access",
			activitySpaces: "Activity Sp.",
			amenities: "Amenities",
			experienceOfSpace: "Exp. Space",
			aestheticsAndCare: "Aesthetics",
			useAndUsability: "Use & Usab."
		};

		const compRows = input.placeSummaries.map(s => [
			s.place_name,
			s.project_name,
			String(s.auditCount),
			`${s.avgRawPercent.toFixed(0)}%`,
			`${s.avgWeightedPercent.toFixed(0)}%`,
			...domainOrder.map(d => `${s.rawPercentByDomain[d].toFixed(0)}%`)
		]);

		autoTable(doc, {
			startY: y,
			head: [["Place", "Project", "Audits", "Raw %", "Wtd %", ...domainOrder.map(d => shortDomain[d])]],
			body: compRows,
			styles: { fontSize: 7.5, cellPadding: 2.5, textColor: BODY_TEXT, font: "helvetica" },
			headStyles: { fillColor: YEE_DARK, textColor: HEADER_TEXT, fontStyle: "bold", fontSize: 7 },
			bodyStyles: { fillColor: ROW_ODD },
			alternateRowStyles: { fillColor: ROW_EVEN },
			columnStyles: {
				0: { fontStyle: "bold", cellWidth: 34 },
				2: { halign: "center" },
				3: { halign: "center" },
				4: { halign: "center" },
				5: { halign: "center" },
				6: { halign: "center" },
				7: { halign: "center" },
				8: { halign: "center" },
				9: { halign: "center" },
				10: { halign: "center" }
			},
			margin: { left: margin, right: margin },
			tableWidth: pw2 - margin * 2,
			didParseCell: hookData => {
				if (hookData.section === "head" && hookData.column.index >= 5) {
					const domain = domainOrder[hookData.column.index - 5];
					if (domain) hookData.cell.styles.fillColor = DOMAIN_STRONG_COLORS[domain];
				}
				if (hookData.section === "body" && hookData.column.index >= 5) {
					const domain = domainOrder[hookData.column.index - 5];
					if (domain) hookData.cell.styles.fillColor = DOMAIN_LIGHT_COLORS[domain];
				}
			}
		});

		addPageNumber(doc, 2);
	}

	// ── Page 3: Individual Audit Records (landscape) ─────────────────────────────
	if (input.filteredAudits.length > 0) {
		doc.addPage("a4", "landscape");
		const pw3 = doc.internal.pageSize.getWidth();
		drawPageHeader(doc, pw3, margin, "Individual Audit Records", "Scores per audit and domain breakdown");
		y = 46;

		const auditRows = input.filteredAudits.map(r => [
			r.place_name,
			r.project_name,
			r.auditor_id,
			r.date,
			`${r.total_raw_score} / ${totalRawScoreMaximum}`,
			pct(r.total_raw_score, totalRawScoreMaximum),
			`${r.total_weighted_score.toFixed(3)} / ${getYouthWeightedScoreMaximum(r.domain_weights).toFixed(3)}`,
			...domainOrder.map(d => `${r.raw_domain_scores[d]} / ${rawDomainScoreMaximums[d]}`),
			...domainOrder.map(d =>
				`${r.weighted_domain_scores[d].toFixed(2)} / ${getDomainYouthWeightedMaximum(d, r.domain_weights).toFixed(2)}`
			)
		]);

		const auditHead = [
			"Place",
			"Project",
			"Auditor",
			"Date",
			"Raw Score",
			"Raw %",
			"Youth Weighted",
			...domainOrder.map(d => `${shortDomainLabel(d)} Raw`),
			...domainOrder.map(d => `${shortDomainLabel(d)} Wtd`)
		];

		autoTable(doc, {
			startY: y,
			head: [auditHead],
			body: auditRows,
			styles: { fontSize: 6.5, cellPadding: 2, textColor: BODY_TEXT, font: "helvetica" },
			headStyles: { fillColor: YEE_DARK, textColor: HEADER_TEXT, fontStyle: "bold", fontSize: 6 },
			bodyStyles: { fillColor: ROW_ODD },
			alternateRowStyles: { fillColor: ROW_EVEN },
			columnStyles: { 0: { fontStyle: "bold" }, 4: { halign: "center" }, 5: { halign: "center" } },
			margin: { left: margin, right: margin },
			tableWidth: pw3 - margin * 2,
			didParseCell: hookData => {
				if (hookData.section === "head") {
					const ci = hookData.column.index;
					if (ci >= 7 && ci < 7 + domainOrder.length) {
						const domain = domainOrder[ci - 7];
						if (domain) hookData.cell.styles.fillColor = DOMAIN_STRONG_COLORS[domain];
					} else if (ci >= 7 + domainOrder.length) {
						const domain = domainOrder[ci - 7 - domainOrder.length];
						if (domain) hookData.cell.styles.fillColor = DOMAIN_STRONG_COLORS[domain];
					}
				}
				if (hookData.section === "body") {
					const ci = hookData.column.index;
					if (ci >= 7 && ci < 7 + domainOrder.length) {
						const domain = domainOrder[ci - 7];
						if (domain) hookData.cell.styles.fillColor = DOMAIN_LIGHT_COLORS[domain];
					} else if (ci >= 7 + domainOrder.length) {
						const domain = domainOrder[ci - 7 - domainOrder.length];
						if (domain) hookData.cell.styles.fillColor = DOMAIN_LIGHT_COLORS[domain];
					}
				}
			}
		});

		addPageNumber(doc, 3);
	}

	// ── Page 4+: Raw Data Summary (landscape, optional) ──────────────────────────
	if (input.includeRawData && input.filteredRawRows.length > 0) {
		doc.addPage("a4", "landscape");
		const pw4 = doc.internal.pageSize.getWidth();
		drawPageHeader(
			doc,
			pw4,
			margin,
			"Raw Audit Data",
			"Metadata and domain totals per submission — see Excel export for full question responses"
		);
		y = 46;

		const rawHead = [
			"Place",
			"Project",
			"Auditor ID",
			"Date",
			"Visit Freq.",
			"Season",
			"Weather",
			"Raw Access",
			"Raw Act. Sp.",
			"Raw Amen.",
			"Raw Exp. Sp.",
			"Raw Aes. Care",
			"Raw Use & Us.",
			"Total Raw",
			"Total Wtd"
		];

		const rawRows = input.filteredRawRows.map(r => [
			r.place_name,
			r.project_name,
			r.auditor_generated_id,
			r.date,
			r.visit_frequency || "—",
			r.season || "—",
			r.weather || "—",
			String(r.raw_access),
			String(r.raw_activity_spaces),
			String(r.raw_amenities),
			String(r.raw_experience_of_space),
			String(r.raw_aesthetics_and_care),
			String(r.raw_use_and_usability),
			String(r.total_raw_score),
			r.total_weighted_score.toFixed(3)
		]);

		autoTable(doc, {
			startY: y,
			head: [rawHead],
			body: rawRows,
			styles: { fontSize: 6.5, cellPadding: 2, textColor: BODY_TEXT, font: "helvetica" },
			headStyles: { fillColor: SLATE_DARK, textColor: HEADER_TEXT, fontStyle: "bold", fontSize: 6 },
			bodyStyles: { fillColor: ROW_ODD },
			alternateRowStyles: { fillColor: ROW_EVEN },
			columnStyles: { 0: { fontStyle: "bold" } },
			margin: { left: margin, right: margin },
			tableWidth: pw4 - margin * 2,
			didParseCell: hookData => {
				if (hookData.section === "head" && hookData.column.index >= 7 && hookData.column.index <= 12) {
					const domain = domainOrder[hookData.column.index - 7];
					if (domain) hookData.cell.styles.fillColor = DOMAIN_STRONG_COLORS[domain];
				}
				if (hookData.section === "body" && hookData.column.index >= 7 && hookData.column.index <= 12) {
					const domain = domainOrder[hookData.column.index - 7];
					if (domain) hookData.cell.styles.fillColor = DOMAIN_LIGHT_COLORS[domain];
				}
			}
		});

		addPageNumber(doc, 4);
	}

	return doc.output("blob");
}

// ── Drawing helpers ───────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDoc = any;

function drawPageHeader(doc: AnyDoc, pageW: number, margin: number, title: string, subtitle: string) {
	doc.setFillColor(...YEE_DARK);
	doc.rect(0, 0, pageW, 36, "F");

	doc.setFillColor(...YEE_GREEN);
	doc.rect(0, 34, pageW, 2.5, "F");

	doc.setFontSize(7);
	doc.setFont("helvetica", "bold");
	doc.setTextColor(127, 181, 139);
	doc.text("YOUTH ENABLING ENVIRONMENTS", margin, 11);

	doc.setFontSize(15);
	doc.setFont("helvetica", "bold");
	doc.setTextColor(...HEADER_TEXT);
	doc.text(title, margin, 23);

	doc.setFontSize(7.5);
	doc.setFont("helvetica", "normal");
	doc.setTextColor(180, 215, 190);
	doc.text(subtitle, margin, 31);
}

function sectionLabel(doc: AnyDoc, x: number, y: number, label: string) {
	doc.setFontSize(8);
	doc.setFont("helvetica", "bold");
	doc.setTextColor(...MUTED_TEXT);
	doc.text(label.toUpperCase(), x, y);
}

function addPageNumber(doc: AnyDoc, page: number) {
	const pw = doc.internal.pageSize.getWidth();
	const ph = doc.internal.pageSize.getHeight();
	doc.setFontSize(7);
	doc.setFont("helvetica", "normal");
	doc.setTextColor(...MUTED_TEXT);
	doc.text(`Page ${page}`, pw - 14, ph - 6, { align: "right" });
	doc.text("Youth Enabling Environments — Confidential", 14, ph - 6);
}

function shortDomainLabel(domain: (typeof domainOrder)[number]): string {
	const map: Record<(typeof domainOrder)[number], string> = {
		access: "Acc",
		activitySpaces: "Act",
		amenities: "Amen",
		experienceOfSpace: "Exp",
		aestheticsAndCare: "Aes",
		useAndUsability: "Use"
	};
	return map[domain];
}
