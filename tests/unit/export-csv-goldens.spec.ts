import { readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

import { buildSingleSubmissionCsv } from "../../src/features/reporting/export/csv-builders";
import { resolveAuditorId } from "../../src/features/reporting/export/identity";
import { sampleInstrument, sampleSubmission } from "../fixtures/export-submission";

const golden = readFileSync(join(__dirname, "../fixtures/golden-single-submission.csv"), "utf8");

test("single-submission CSV is byte-identical to the legacy generator", () => {
	const csv = buildSingleSubmissionCsv(sampleSubmission, sampleInstrument);
	// Exact bytes — captured from the original downloadSingleSubmissionCsv before
	// any code moved (plan acceptance criterion 4).
	expect(csv).toBe(golden);
});

test("single-submission CSV keeps the legacy identity + participant column order", () => {
	const csv = buildSingleSubmissionCsv(sampleSubmission, sampleInstrument);
	const header = csv.split("\n")[0];
	expect(header.startsWith("Auditor ID,Place,Place ID,Submitted At,Raw Score,")).toBeTruthy();
	// domain_weights / section_comments are excluded from participant columns.
	expect(header).not.toContain("Participant domain weights");
	expect(header).not.toContain("Participant section comments");
});

test("privacy invariant: absent generated ID becomes a redaction placeholder, never the raw id", () => {
	const redactedSubmission = { ...sampleSubmission, auditor_generated_id: null };
	const csv = buildSingleSubmissionCsv(redactedSubmission, sampleInstrument);
	const firstCell = csv.split("\n")[1].split(",")[0];
	expect(firstCell).toBe(`"${resolveAuditorId(null)}"`);
	// The raw auditor UUID must never appear anywhere in the export.
	expect(csv).not.toContain(sampleSubmission.auditor_id);
});

test("resolveAuditorId returns the generated id when present", () => {
	expect(resolveAuditorId("AUD007")).toBe("AUD007");
	expect(resolveAuditorId("  ")).toBe(resolveAuditorId(null));
	expect(resolveAuditorId(undefined)).toBe(resolveAuditorId(""));
});

test("single-submission CSV neutralizes formula injection in free-text participant fields", () => {
	const malicious = {
		...sampleSubmission,
		participant_info: { ...sampleSubmission.participant_info, participant_id: '=HYPERLINK("http://evil")' }
	};
	const csv = buildSingleSubmissionCsv(malicious, sampleInstrument);
	// The dangerous value is prefixed with a single quote so spreadsheets treat it as
	// literal text; it must never reach the cell as a bare formula.
	expect(csv).toContain(`"'=HYPERLINK(""http://evil"")"`);
	expect(csv).not.toContain(`"=HYPERLINK`);
});
