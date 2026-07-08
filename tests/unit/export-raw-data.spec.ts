import { readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

import { buildRawDataTableCsv } from "../../src/features/reporting/export/csv-builders";
import { generateRawDataXlsx } from "../../src/features/reporting/export/excel/raw-data-xlsx";
import { getExportPalette } from "../../src/features/reporting/export/export-palette";
import { rawDataRecords } from "../fixtures/export-raw-data";

const golden = readFileSync(join(__dirname, "../fixtures/golden-raw-data.csv"), "utf8");

test("raw-data CSV is byte-identical to the legacy toExportRows + toCsv export", () => {
	expect(buildRawDataTableCsv(rawDataRecords)).toBe(golden);
});

test("raw-data Excel generates a valid .xlsx with a Data Dictionary sheet", async () => {
	const blob = generateRawDataXlsx(rawDataRecords, getExportPalette());
	const bytes = Buffer.from(await blob.arrayBuffer());
	expect(bytes[0]).toBe(0x50);
	expect(bytes[1]).toBe(0x4b);
	const text = bytes.toString("latin1");
	expect(text).toContain("Raw data");
	expect(text).toContain("Data Dictionary");
});
