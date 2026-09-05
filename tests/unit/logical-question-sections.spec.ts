/**
 * Section matching and follow-up requiredness across the two instrument shapes.
 *
 * A YEE instrument reaches the wizard either as legacy scoring items or as an
 * authoring-v2 document, and the same section has a different name in each: the
 * authoring id `experienceOfSpace`, versus a stored block heading
 * "Experience of Space:" matched against the label "Experience of the Space".
 * A question that fails to match simply vanishes from its section, and an empty
 * section reads as complete - so the failure is silent in both directions.
 */
import { expect, test } from "@playwright/test";

import {
	isLogicalQuestionComplete,
	logicalQuestionsForSection,
	normalizeLogicalQuestions
} from "../../src/features/yee-audit/api/yee-logical-questions";
import type { InstrumentResponse } from "../../src/features/yee-audit/api/yee-instrument";

/** Legacy shape: a matrix presence item whose block heading is the real one in production. */
const legacy = {
	survey_name: "YEE",
	version: "2.0",
	condition_prompt: "Rate the condition",
	scoring_items: [
		{
			item_id: "QID15#1",
			base_question_id: "QID15",
			block: "Experience of Space:",
			question_text: "Experience",
			item_kind: "presence",
			choices: { "1": { Display: "Feels welcoming" } },
			answers: { "1": { Display: "Yes" }, "2": { Display: "No" } },
			score_entries: [{ choice_id: "1", answer_id: "1", scores_by_category_id: { a: 1 } }]
		}
	]
} as unknown as InstrumentResponse;

/** Authoring shape: same question, section named by id, and no follow-up. */
const authoring = {
	...legacy,
	authoring: {
		schemaVersion: 2,
		sections: [
			{
				id: "experienceOfSpace",
				title: "Experience of the Space",
				instructions: "",
				commentPrompt: "",
				questions: [
					{
						id: "experienceOfSpace.q1",
						prompt: "Feels welcoming",
						primary: { type: "single_select", options: [{ id: "1", label: "Yes", score: 1 }] },
						followUp: null,
						scoring: { method: "option_score", domain: "experienceOfSpace" },
						responseBinding: { presenceItemId: "QID15#1", choiceId: "1", conditionItemId: null }
					}
				]
			}
		]
	}
} as unknown as InstrumentResponse;

const LABEL = "Experience of the Space";

test("a legacy block heading still matches the section it belongs to", () => {
	// "Experience of Space:" vs "Experience of the Space" - one article apart.
	// Substring matching missed it, and the whole section rendered empty.
	expect(normalizeLogicalQuestions(legacy)).toHaveLength(1);
	expect(logicalQuestionsForSection(legacy, "experienceOfSpace", LABEL)).toHaveLength(1);
});

test("an authoring section id matches the same section", () => {
	expect(logicalQuestionsForSection(authoring, "experienceOfSpace", LABEL)).toHaveLength(1);
});

test("a legacy heading with a trailing description still matches its label", () => {
	const access = {
		...legacy,
		scoring_items: [{ ...legacy.scoring_items[0], block: "Access: Presence, Condition, Provision" }]
	} as unknown as InstrumentResponse;
	expect(logicalQuestionsForSection(access, "access", "Access")).toHaveLength(1);
});

test("a section label does not capture another section's questions", () => {
	expect(logicalQuestionsForSection(legacy, "amenities", "Amenities")).toHaveLength(0);
});

test("a question with no follow-up is not marked as requiring one", () => {
	// The authoring branch defaulted this to true when followUp was absent. Only
	// a second guard kept that from reporting an answered question incomplete.
	const [question] = normalizeLogicalQuestions(authoring);
	expect(question.conditionRequiredWhenShown).toBe(false);
	expect(isLogicalQuestionComplete(question, { "QID15#1": { "1": "1" } })).toBe(true);
});

test("both shapes agree on the question a section contains", () => {
	const fromLegacy = logicalQuestionsForSection(legacy, "experienceOfSpace", LABEL);
	const fromAuthoring = logicalQuestionsForSection(authoring, "experienceOfSpace", LABEL);
	expect(fromAuthoring.map(q => q.key)).toEqual(fromLegacy.map(q => q.key));
	expect(fromAuthoring[0].binding).toEqual(fromLegacy[0].binding);
	expect(fromAuthoring[0].conditionRequiredWhenShown).toBe(fromLegacy[0].conditionRequiredWhenShown);
});
