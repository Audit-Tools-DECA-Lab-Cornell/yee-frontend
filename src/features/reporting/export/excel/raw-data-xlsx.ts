/**
 * R5 raw-data Excel workbook. A Data sheet with the same flat columns as the CSV,
 * plus a Data Dictionary sheet (column → meaning → type → allowed values) so the
 * file is self-describing for researchers (logistics §R5).
 */
import type { RawDataRecord } from "@/features/workspaces/api/live-api";

import { rawDataExportRows, RAW_DATA_DICTIONARY } from "../raw-data-columns";
import type { ExportPalette } from "../types";
import { appendSheet, buildStyledSheet, cell, makeStyles, newWorkbook, workbookToBlob, type StyledCell } from "./excel-shared";

export function generateRawDataXlsx(rows: RawDataRecord[], palette: ExportPalette): Blob {
	const styles = makeStyles(palette);
	const wb = newWorkbook();
	const exportRows = rawDataExportRows(rows);

	// Column order = first row's keys (matches the CSV); fall back to the base
	// header set when there are no rows so the sheet still has a header.
	const columns = exportRows.length > 0 ? Object.keys(exportRows[0]) : RAW_DATA_DICTIONARY.map(entry => entry.column);

	const dataGrid: StyledCell[][] = [columns.map(column => cell(column, styles.header))];
	for (const row of exportRows) {
		dataGrid.push(columns.map(column => cell(row[column] ?? "", styles.body)));
	}
	appendSheet(wb, buildStyledSheet(dataGrid, { colWidths: columns.map(() => 18) }), "Raw data");

	// Data Dictionary sheet.
	const dictGrid: StyledCell[][] = [
		[cell("Data Dictionary", styles.title)],
		[cell("What each column in the Raw data sheet means.", styles.subtitle)],
		[cell(null)],
		[cell("Column", styles.header), cell("Meaning", styles.header), cell("Type", styles.header), cell("Allowed values", styles.header)]
	];
	for (const entry of RAW_DATA_DICTIONARY) {
		dictGrid.push([
			cell(entry.column, styles.label),
			cell(entry.meaning, styles.body),
			cell(entry.type, styles.body),
			cell(entry.allowed, styles.body)
		]);
	}
	appendSheet(wb, buildStyledSheet(dictGrid, { colWidths: [30, 46, 12, 22] }), "Data Dictionary");

	return workbookToBlob(wb);
}
