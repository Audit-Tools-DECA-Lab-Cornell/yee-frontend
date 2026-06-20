"use client";

import { SpreadsheetPanel } from "../instrument-content-viewer";
import type { StructuredInstrumentContent } from "../types";
import { buildSpreadsheetRows } from "../utils";

/**
 * Spreadsheet tab inside the editor. Read-only cross-cutting view of every
 * section and question; structural edits stay out of scope for light editing.
 */
export function SpreadsheetView({ content }: { content: StructuredInstrumentContent }) {
	return <SpreadsheetPanel rows={buildSpreadsheetRows(content)} />;
}
