import { expect, test } from "@playwright/test";

import {
	getConditionAnswer,
	getPrimaryAnswer,
	isLogicalQuestionAnswered,
	isLogicalQuestionComplete,
	normalizeLogicalQuestions,
	shouldShowLogicalFollowUp
} from "../../src/features/yee-audit/api/yee-logical-questions";
import type { InstrumentResponse } from "../../src/features/yee-audit/api/yee-instrument";

const legacy: InstrumentResponse = {
	survey_name: "YEE",
	version: "1",
	sections: [],
	scoring_items: [
		{
			item_id: "QID1#1",
			base_question_id: "QID1",
			block: "Access",
			question_text: "Presence",
			item_kind: "presence",
			choices: { "1": { Display: "Is transit nearby?" } },
			answers: { "1": { Display: "Yes" }, "2": { Display: "No" } },
			score_entries: [
				{ item_id: "QID1#1", choice_id: "1", answer_id: "1", scores_by_category_id: { presence: 1 } },
				{ item_id: "QID1#1", choice_id: "1", answer_id: "2", scores_by_category_id: { presence: 0 } }
			]
		},
		{
			item_id: "QID1#2",
			base_question_id: "QID1",
			block: "Access",
			question_text: "Rate its condition",
			item_kind: "condition",
			choices: { "1": { Display: "Is transit nearby?" } },
			answers: { "1": { Display: "Poor" }, "2": { Display: "Great" } }
		}
	]
};

test("legacy adapter uses item kinds and score entries, not answer labels", () => {
	const [question] = normalizeLogicalQuestions(legacy);
	expect(question).toMatchObject({
		key: "QID1#1:1",
		prompt: "Is transit nearby?",
		conditionTriggerAnswerIds: ["1"],
		conditionRequiredWhenShown: true,
		binding: { presenceItemId: "QID1#1", choiceId: "1", conditionItemId: "QID1#2" }
	});
	const responses = { "QID1#1": { "1": "1" } };
	expect(isLogicalQuestionAnswered(question, responses)).toBe(true);
	expect(shouldShowLogicalFollowUp(question, responses)).toBe(true);
	expect(isLogicalQuestionComplete(question, responses)).toBe(false);
});

test("authoring-v2 explicit optional follow-up preserves response bindings", () => {
	const instrument: InstrumentResponse = {
		...legacy,
		authoring: {
			schemaVersion: 2,
			sections: [
				{
					id: "access",
					title: "Access",
					instructions: "",
					commentPrompt: "",
					questions: [
						{
							id: "access.q1",
							prompt: "Is the stop close?",
							primary: {
								type: "single_select",
								options: [
									{ id: "yes", label: "Present", score: 1 },
									{ id: "no", label: "Absent", score: 0 }
								]
							},
							followUp: {
								triggerOptionIds: ["yes"],
								requiredWhenShown: false,
								prompt: "Rate it",
								options: [{ id: "good", label: "Good", score: 2 }]
							},
							scoring: { method: "presence_condition_product", domain: "access" },
							responseBinding: { presenceItemId: "QID1#1", choiceId: "1", conditionItemId: "QID1#2" }
						}
					]
				}
			]
		}
	};
	const [question] = normalizeLogicalQuestions(instrument);
	const responses = { "QID1#1": { "1": "yes" }, "QID1#2": { "1": "good" } };
	expect(question.prompt).toBe("Is the stop close?");
	expect(question.conditionRequiredWhenShown).toBe(false);
	expect(getPrimaryAnswer(question, responses)).toBe("yes");
	expect(getConditionAnswer(question, responses)).toBe("good");
	expect(isLogicalQuestionComplete(question, { "QID1#1": { "1": "yes" } })).toBe(true);
});
