/**
 * Shared xlsx-js-style helpers: styled-cell construction, a header/title style
 * palette derived from the export palette, a sheet-name sanitizer, and the
 * workbook → Blob writer. All YEE Excel workbooks (R1/R2/R3/R4/R5) build from
 * these so styling stays consistent. No embedded chart images (logistics §5).
 */
import * as XLSX from "xlsx-js-style";

import type { ExportPalette } from "../types";

export type CellValue = string | number | null;

export type StyledCell = {
	value: CellValue;
	style?: XLSX.CellStyle;
};

/** ARGB/RGB hex without the leading `#`, as xlsx-js-style expects. */
function rgb(hex: string): string {
	return hex.replace("#", "").toUpperCase();
}

export function cell(value: CellValue, style?: XLSX.CellStyle): StyledCell {
	return { value, style };
}

export type ExcelStyles = {
	title: XLSX.CellStyle;
	subtitle: XLSX.CellStyle;
	header: XLSX.CellStyle;
	label: XLSX.CellStyle;
	body: XLSX.CellStyle;
	bandHeader: (bandHex: string) => XLSX.CellStyle;
	sectionBanner: (colorHex: string) => XLSX.CellStyle;
};

export function makeStyles(palette: ExportPalette): ExcelStyles {
	const border = {
		top: { style: "thin", color: { rgb: rgb(palette.brand.border) } },
		bottom: { style: "thin", color: { rgb: rgb(palette.brand.border) } },
		left: { style: "thin", color: { rgb: rgb(palette.brand.border) } },
		right: { style: "thin", color: { rgb: rgb(palette.brand.border) } }
	};
	return {
		title: { font: { bold: true, sz: 15, color: { rgb: rgb(palette.brand.green950) } } },
		subtitle: { font: { sz: 10, color: { rgb: rgb(palette.brand.muted) } } },
		header: {
			font: { bold: true, sz: 10, color: { rgb: "FFFFFF" } },
			fill: { patternType: "solid", fgColor: { rgb: rgb(palette.brand.green900) } },
			alignment: { vertical: "center", wrapText: true },
			border
		},
		label: { font: { bold: true, sz: 10, color: { rgb: rgb(palette.brand.muted) } }, alignment: { vertical: "top" } },
		body: { font: { sz: 10, color: { rgb: rgb(palette.brand.foreground) } }, alignment: { vertical: "top", wrapText: true }, border },
		bandHeader: bandHex => ({
			font: { bold: true, sz: 10, color: { rgb: "FFFFFF" } },
			fill: { patternType: "solid", fgColor: { rgb: rgb(bandHex) } },
			alignment: { horizontal: "center" }
		}),
		sectionBanner: colorHex => ({
			font: { bold: true, sz: 10, color: { rgb: "FFFFFF" } },
			fill: { patternType: "solid", fgColor: { rgb: rgb(colorHex) } }
		})
	};
}

/**
 * Excel sheet names are ≤31 chars and may not contain `[ ] : * ? / \`.
 * Falls back to "Sheet" for an empty result.
 */
export function sanitizeSheetName(name: string): string {
	const cleaned = name.replace(/[[\]:*?/\\]/g, " ").replace(/\s+/g, " ").trim();
	return (cleaned || "Sheet").slice(0, 31);
}

/** Build a styled worksheet from a grid of {value, style} cells. */
export function buildStyledSheet(
	rows: StyledCell[][],
	options: { colWidths?: number[]; merges?: XLSX.WorkSheet["!merges"] } = {}
): XLSX.WorkSheet {
	const aoa = rows.map(row => row.map(styled => styled.value));
	const ws = XLSX.utils.aoa_to_sheet(aoa);
	rows.forEach((row, r) => {
		row.forEach((styled, c) => {
			if (!styled.style) return;
			const addr = XLSX.utils.encode_cell({ r, c });
			const existing = ws[addr] as XLSX.CellObject | undefined;
			if (existing) existing.s = styled.style;
		});
	});
	if (options.colWidths) ws["!cols"] = options.colWidths.map(wch => ({ wch }));
	if (options.merges) ws["!merges"] = options.merges;
	return ws;
}

export function newWorkbook(): XLSX.WorkBook {
	return XLSX.utils.book_new();
}

export function appendSheet(wb: XLSX.WorkBook, ws: XLSX.WorkSheet, name: string): void {
	XLSX.utils.book_append_sheet(wb, ws, sanitizeSheetName(name));
}

/** Serialize the workbook to an .xlsx Blob. */
export function workbookToBlob(wb: XLSX.WorkBook): Blob {
	const output = XLSX.write(wb, { type: "array", bookType: "xlsx", cellStyles: true });
	return new Blob([output], {
		type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
	});
}
