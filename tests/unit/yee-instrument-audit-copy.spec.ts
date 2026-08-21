import { expect, test } from "@playwright/test";

import {
	resolveConditionPrompt,
	resolveFinalCommentsPrompt,
	resolveWeightingDescription,
	resolveWeightingDomainPrompt,
	resolveWeightingOptions,
	resolveWeightingTitle,
	type InstrumentResponse
} from "../../src/features/yee-audit/api/yee-instrument";

/** The local scale — values are the scoring contract, labels are copy. */
const localWeightOptions = [
	{ value: "3", label: "Very important to me" },
	{ value: "2", label: "Somewhat important to me" },
	{ value: "1", label: "Not really important to me" }
];

const instrumentWithAuditCopy: InstrumentResponse = {
	survey_name: "YEE",
	version: "1",
	scoring_items: [],
	weighting: {
		title: "Youth weighting",
		description: "Tell us how important each of the following issues are to you.",
		options: [
			{ value: "3", label: "Matters a lot" },
			{ value: "1", label: "Does not matter much" }
		],
		domains: [
			{ key: "access", label: "Access", prompt: "How important is it to you that you can get there safely?" }
		]
	},
	condition_prompt: "If yes, please rate the condition that this feature or area is in.",
	final_comments_prompt: "Overall survey comments"
};

const instrumentWithoutAuditCopy: InstrumentResponse = {
	survey_name: "YEE",
	version: "0",
	scoring_items: []
};

test("published audit copy reaches the web wizard", () => {
	expect(resolveWeightingTitle(instrumentWithAuditCopy, "fallback")).toBe("Youth weighting");
	expect(resolveWeightingDescription(instrumentWithAuditCopy, "fallback")).toMatch(/how important/i);
	expect(resolveWeightingDomainPrompt(instrumentWithAuditCopy, "access", "fallback")).toMatch(/get there safely/);
	expect(resolveConditionPrompt(instrumentWithAuditCopy, "Condition")).toMatch(/rate the condition/);
	expect(resolveFinalCommentsPrompt(instrumentWithAuditCopy, "fallback")).toBe("Overall survey comments");
});

test("instrument versions without the audit-copy keys render exactly as before", () => {
	expect(resolveWeightingTitle(instrumentWithoutAuditCopy, "Youth-Weighted Importance")).toBe(
		"Youth-Weighted Importance"
	);
	expect(resolveWeightingDomainPrompt(instrumentWithoutAuditCopy, "access", "How important…")).toBe("How important…");
	expect(resolveConditionPrompt(instrumentWithoutAuditCopy, "Condition")).toBe("Condition");
	expect(resolveFinalCommentsPrompt(null, "Final optional comments")).toBe("Final optional comments");
	expect(resolveWeightingOptions(instrumentWithoutAuditCopy, localWeightOptions)).toEqual(localWeightOptions);
});

test("blank instrument strings fall back rather than rendering an empty prompt", () => {
	const givenBlankCopy: InstrumentResponse = {
		survey_name: "YEE",
		version: "1",
		scoring_items: [],
		weighting: { title: "   ", domains: [{ key: "access", label: "Access", prompt: "" }] },
		condition_prompt: "",
		final_comments_prompt: "   "
	};

	expect(resolveWeightingTitle(givenBlankCopy, "Youth-Weighted Importance")).toBe("Youth-Weighted Importance");
	expect(resolveWeightingDomainPrompt(givenBlankCopy, "access", "Fallback prompt")).toBe("Fallback prompt");
	expect(resolveConditionPrompt(givenBlankCopy, "Condition")).toBe("Condition");
	expect(resolveFinalCommentsPrompt(givenBlankCopy, "Final optional comments")).toBe("Final optional comments");
});

test("weighting values stay the scoring contract while labels come from the instrument", () => {
	const whenOptionsResolve = resolveWeightingOptions(instrumentWithAuditCopy, localWeightOptions);

	// Order and values are owned locally — the draft stores these and the
	// backend scores on them, so an instrument must never reorder or retire one.
	expect(whenOptionsResolve.map(option => option.value)).toEqual(["3", "2", "1"]);
	expect(whenOptionsResolve[0].label).toBe("Matters a lot");
	// "2" is absent from the instrument, so it keeps its local label.
	expect(whenOptionsResolve[1].label).toBe("Somewhat important to me");
	expect(whenOptionsResolve[2].label).toBe("Does not matter much");
});

test("an unrecognised weighting value is ignored rather than becoming an unscoreable choice", () => {
	const givenRogueOption: InstrumentResponse = {
		...instrumentWithAuditCopy,
		weighting: { options: [{ value: "99", label: "Extremely important" }] }
	};

	const whenOptionsResolve = resolveWeightingOptions(givenRogueOption, localWeightOptions);

	expect(whenOptionsResolve).toEqual(localWeightOptions);
});

test("an unknown domain key falls back instead of borrowing another domain's prompt", () => {
	expect(resolveWeightingDomainPrompt(instrumentWithAuditCopy, "amenities", "Amenities fallback")).toBe(
		"Amenities fallback"
	);
});
