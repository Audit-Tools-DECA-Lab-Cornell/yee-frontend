import { readFile } from "node:fs/promises";

import { expect, type Download, type Page } from "@playwright/test";

/**
 * Download-assertion helpers for the export layer (implementation-plan M0/M5).
 *
 * Every export spec drives a real click, captures the browser download, and
 * asserts the filename pattern + magic bytes so a broken generator fails loudly
 * (a truncated PDF, an empty ZIP, a CSV with the wrong columns).
 */

export type CapturedDownload = {
	filename: string;
	bytes: Buffer;
	text: string;
};

/** Run `action`, capture the resulting download, and read its bytes. */
export async function captureDownload(page: Page, action: () => Promise<void>): Promise<CapturedDownload> {
	const [download] = await Promise.all([page.waitForEvent("download"), action()]);
	return readDownload(download);
}

async function readDownload(download: Download): Promise<CapturedDownload> {
	const path = await download.path();
	const bytes = path ? await readFile(path) : Buffer.alloc(0);
	return {
		filename: download.suggestedFilename(),
		bytes,
		text: bytes.toString("utf8")
	};
}

/** Assert a PDF: `%PDF` magic header and a non-trivial size. */
export function expectPdf(download: CapturedDownload): void {
	expect(download.filename, `expected a .pdf filename, got ${download.filename}`).toMatch(/\.pdf$/);
	expect(download.bytes.subarray(0, 5).toString("latin1")).toBe("%PDF-");
	expect(download.bytes.length).toBeGreaterThan(1000);
}

/** Assert a ZIP/XLSX (both are PK-headered ZIP containers). */
export function expectZipContainer(download: CapturedDownload, extension: "zip" | "xlsx"): void {
	expect(download.filename).toMatch(new RegExp(`\\.${extension}$`));
	// Local file header signature "PK\x03\x04".
	expect(download.bytes[0]).toBe(0x50);
	expect(download.bytes[1]).toBe(0x4b);
	expect(download.bytes[2]).toBe(0x03);
	expect(download.bytes[3]).toBe(0x04);
	expect(download.bytes.length).toBeGreaterThan(100);
}

/** Assert a CSV filename and return its parsed rows (RFC-4180 subset). */
export function expectCsv(download: CapturedDownload): string[][] {
	expect(download.filename).toMatch(/\.csv$/);
	return parseCsv(download.text);
}

/**
 * Parse an RFC-4180 CSV string into rows of cells. Handles double-quoted fields,
 * escaped quotes (`""`), and embedded newlines — enough to assert legacy
 * column headers and cell values in specs.
 */
export function parseCsv(input: string): string[][] {
	const rows: string[][] = [];
	let row: string[] = [];
	let cell = "";
	let inQuotes = false;

	for (let i = 0; i < input.length; i += 1) {
		const char = input[i];
		if (inQuotes) {
			if (char === '"') {
				if (input[i + 1] === '"') {
					cell += '"';
					i += 1;
				} else {
					inQuotes = false;
				}
			} else {
				cell += char;
			}
			continue;
		}
		if (char === '"') {
			inQuotes = true;
		} else if (char === ",") {
			row.push(cell);
			cell = "";
		} else if (char === "\n") {
			row.push(cell);
			rows.push(row);
			row = [];
			cell = "";
		} else if (char !== "\r") {
			cell += char;
		}
	}
	if (cell.length > 0 || row.length > 0) {
		row.push(cell);
		rows.push(row);
	}
	return rows;
}
