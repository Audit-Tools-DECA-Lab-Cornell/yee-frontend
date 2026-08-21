import { readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

const wizardSource = readFileSync(
	join(__dirname, "../../src/features/yee-audit/components/yee-audit-wizard.tsx"),
	"utf8"
);

/**
 * Strings the admin Audit Copy tab can publish, paired with the fallback the
 * wizard uses when an instrument version predates that key.
 *
 * Each fallback must appear exactly once — in the block near the top of the
 * component that resolves every instrument string. Every render site then reads
 * that resolved value.
 *
 * This has regressed three times: the questionnaire consumed published copy
 * while the review screen kept rendering a hardcoded heading, so an auditor
 * answered under the admin's wording and saw the old wording before submitting.
 * A second literal is exactly how that happens.
 */
const auditCopyFallbacks = [
	{ field: "weighting.title", fallback: "Youth-Weighted Importance" },
	{ field: "weighting.description", fallback: "Please start by telling us how important" },
	{ field: "final_comments_prompt", fallback: "Final optional comments" },
	{ field: "condition_prompt", fallback: '"Condition"' }
];

function countOccurrences(haystack: string, needle: string) {
	return haystack.split(needle).length - 1;
}

for (const { field, fallback } of auditCopyFallbacks) {
	test(`${field} is resolved once, not repeated at a render site`, () => {
		expect(
			countOccurrences(wizardSource, fallback),
			`Found more than one "${fallback}" in yee-audit-wizard.tsx. Instrument-authored copy must be resolved once into a named value and reused at every render site, otherwise the questionnaire and the review screen drift apart. Read the resolved value instead of writing this string again.`
		).toBe(1);
	});
}

test("headings that used to hardcode published copy are gone", () => {
	// Each of these was a render site rendering its own wording while the
	// questionnaire showed the admin's published version.
	expect(wizardSource).not.toContain("Youth-Weighted Importance of Sections");
	expect(wizardSource).not.toContain(">Overall comments<");
	expect(wizardSource).toContain("{finalCommentsPrompt}");
	expect(wizardSource).toContain("{weightingTitle}");
	expect(wizardSource).toContain("{conditionPrompt}");
});
