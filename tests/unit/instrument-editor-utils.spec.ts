import { expect, test } from "@playwright/test";

import type { EditableItem } from "../../src/features/admin/instruments/types";
import {
	describeInstrumentSaveError,
	getEditablePromptEntries,
	summarizeInstrument,
	toUniqueDraftLabel,
	updateEditablePromptEntry
} from "../../src/features/admin/instruments/utils";
import { getThemeByBlock } from "../../src/features/yee-audit/config/yee-domain-theme";
import { ApiError } from "../../src/lib/api/client";

const matrixItem: EditableItem = {
	item_id: "QID1#1",
	question_text: "  Shared  prompt <strong>with markup</strong>  ",
	item_kind: "presence",
	choices: {
		"1": { Display: "  First  question  " },
		"2": { Display: "" }
	},
	answers: {
		"1": { Display: "Yes" },
		"2": { Display: "No" }
	}
};

test("returns raw shared prompts, questions, and answer options for matrix items", () => {
	const givenMatrixItemWithUntouchedText = matrixItem;
	const whenEntriesAreBuilt = getEditablePromptEntries(givenMatrixItemWithUntouchedText);
	const thenEverySemanticFieldIsEditable = [
		{
			target: "sharedPrompt",
			entryKey: "question-text",
			label: "Shared prompt",
			value: "  Shared  prompt <strong>with markup</strong>  "
		},
		{
			target: "question",
			entryKey: "question-1",
			optionId: "1",
			label: "Question 1",
			value: "  First  question  "
		},
		{
			target: "question",
			entryKey: "question-2",
			optionId: "2",
			label: "Question 2",
			value: ""
		},
		{
			target: "answerOption",
			entryKey: "answer-1",
			optionId: "1",
			label: "Answer option 1",
			value: "Yes"
		},
		{
			target: "answerOption",
			entryKey: "answer-2",
			optionId: "2",
			label: "Answer option 2",
			value: "No"
		}
	];

	expect(whenEntriesAreBuilt).toEqual(thenEverySemanticFieldIsEditable);
});

test("shows the authoring placeholder as an empty shared prompt without dropping other fields", () => {
	const givenPlaceholderItem: EditableItem = {
		item_id: "QID2#1",
		question_text: "Click to write the question text",
		choices: { "1": { Display: "Question" } },
		answers: { "1": { Display: "" } }
	};
	const whenEntriesAreBuilt = getEditablePromptEntries(givenPlaceholderItem);
	const thenExistingFieldsRemainEditable = [
		{
			target: "sharedPrompt",
			entryKey: "question-text",
			label: "Shared prompt",
			value: ""
		},
		{
			target: "question",
			entryKey: "question-1",
			optionId: "1",
			label: "Question 1",
			value: "Question"
		},
		{
			target: "answerOption",
			entryKey: "answer-1",
			optionId: "1",
			label: "Answer option 1",
			value: ""
		}
	];

	expect(whenEntriesAreBuilt).toEqual(thenExistingFieldsRemainEditable);
});

test("updates only the selected display while preserving map keys and score entries", () => {
	const givenMatrixItemWithScoring: EditableItem = {
		...matrixItem,
		score_entries: [{ score: 1, answer: "1" }]
	};
	const answerEntry = getEditablePromptEntries(givenMatrixItemWithScoring).find(
		entry => entry.target === "answerOption" && entry.optionId === "2"
	);
	if (!answerEntry) throw new Error("Expected answer option 2");

	const whenOneAnswerDisplayIsUpdated = updateEditablePromptEntry(givenMatrixItemWithScoring, answerEntry, "Never");

	expect(Object.keys(whenOneAnswerDisplayIsUpdated.choices ?? {})).toEqual(["1", "2"]);
	expect(Object.keys(whenOneAnswerDisplayIsUpdated.answers ?? {})).toEqual(["1", "2"]);
	expect(whenOneAnswerDisplayIsUpdated.answers?.["1"]?.Display).toBe("Yes");
	expect(whenOneAnswerDisplayIsUpdated.answers?.["2"]?.Display).toBe("Never");
	expect(whenOneAnswerDisplayIsUpdated.score_entries).toBe(givenMatrixItemWithScoring.score_entries);
});

test("omits Scale Guidance from instrument summaries", () => {
	const givenContentWithBackendScaleGuidance = {
		survey_name: "YEE",
		version: "1",
		scale_guidance: [{ id: "provision" }]
	};
	const whenSummaryIsBuilt = summarizeInstrument(givenContentWithBackendScaleGuidance);

	expect(whenSummaryIsBuilt).not.toHaveProperty("scaleGuidance");
});

test("opening and saving an untouched draft preserves the payload byte for byte", () => {
	// The editor's round trip is JSON.parse -> mutate -> JSON.stringify. Nothing
	// may normalize on the way through: markup, repeated spaces, trailing spaces
	// and line breaks all belong to the instrument, not to the editor.
	const givenAwkwardContent = {
		survey_name: "YEE  Instrument ",
		preamble: ["<p>Welcome</p>", "Line one\n\nLine two", "  padded  "],
		sections: [{ block: "Access", title: "Access ", intro_text: "Do <br> this", comment_prompt: "" }],
		scoring_items: [matrixItem],
		scale_guidance: [{ id: "provision", rules: [{ value: "0", add: 0 }] }]
	};

	const whenReopenedFromTheEditorJson = JSON.parse(JSON.stringify(givenAwkwardContent, null, 2));

	expect(whenReopenedFromTheEditorJson).toEqual(givenAwkwardContent);
});

test("editing one field leaves every sibling field and unknown key untouched", () => {
	const givenDraft = {
		survey_name: "YEE  Instrument ",
		preamble: ["<p>Welcome</p>"],
		scoring_items: [matrixItem],
		scale_guidance: [{ id: "provision" }]
	};
	const draft = JSON.parse(JSON.stringify(givenDraft)) as typeof givenDraft;

	const questionEntry = getEditablePromptEntries(draft.scoring_items[0]).find(
		entry => entry.target === "question" && entry.optionId === "1"
	);
	if (!questionEntry) throw new Error("Expected question 1");
	draft.scoring_items[0] = updateEditablePromptEntry(draft.scoring_items[0], questionEntry, "Edited question");

	expect(draft.scoring_items[0].choices?.["1"]?.Display).toBe("Edited question");
	expect(draft.scoring_items[0].choices?.["2"]?.Display).toBe("");
	expect(draft.survey_name).toBe("YEE  Instrument ");
	expect(draft.preamble).toEqual(["<p>Welcome</p>"]);
	// The removed Scale Guidance UI must not remove the backend key from drafts.
	expect(draft.scale_guidance).toEqual([{ id: "provision" }]);
});

test("draft labels skip every label already in the version history", () => {
	const givenHistoryWithDuplicates = ["1-draft", "1-draft-2", "spring-2026"];

	expect(toUniqueDraftLabel("1", givenHistoryWithDuplicates)).toBe("1-draft-3");
	expect(toUniqueDraftLabel("1-draft", givenHistoryWithDuplicates)).toBe("1-draft-3");
	expect(toUniqueDraftLabel("2", givenHistoryWithDuplicates)).toBe("2-draft");
	// Case-insensitive: the backend does not enforce uniqueness, so be strict here.
	expect(toUniqueDraftLabel("1", ["1-DRAFT"])).toBe("1-draft-2");
});

test("a publish 409 is rendered as the questions the admin has to restore", () => {
	const givenPublishConflict = new ApiError(409, "This version is missing questions the scoring needs.", {
		detail: {
			message: "This version is missing questions the scoring needs.",
			scoring_compatibility: {
				ok: false,
				scoring_version: "yee-1",
				required_item_count: 17,
				present_item_count: 15,
				missing_items: ["QID1#1", "QID11#2"],
				missing_choices: []
			}
		}
	});

	const whenTheToastIsFormatted = describeInstrumentSaveError(givenPublishConflict);

	expect(whenTheToastIsFormatted.title).toMatch(/scored questions are missing/i);
	expect(whenTheToastIsFormatted.description).toContain("QID1#1, QID11#2");
	expect(whenTheToastIsFormatted.description).toContain("15 of the 17");
});

test("errors without a scoring report still produce a readable message", () => {
	const givenPlainFailure = new ApiError(500, "Instrument service is unavailable.", { detail: "boom" });

	expect(describeInstrumentSaveError(givenPlainFailure)).toEqual({
		title: "Could not save version",
		description: "Instrument service is unavailable."
	});
	expect(describeInstrumentSaveError(new Error("offline")).description).toBe("offline");
});

test("instrument blocks resolve to their audit domain theme, or to neutral", () => {
	// Blocks carry the full authoring label, and "Experience of the Space" is
	// stored as "Experience of Space" — getBlockMatch owns that discrepancy.
	expect(getThemeByBlock("Access: Presence, Condition, Provision")?.label).toBe("Access");
	expect(getThemeByBlock("Activity Spaces: Presence, Condition, Provision")?.label).toBe("Activity Spaces");
	expect(getThemeByBlock("Experience of Space:")?.label).toBe("Experience of the Space");
	expect(getThemeByBlock("Use & Usability: Presence, condition, provision")?.label).toBe("Use & Usability");
	// Unscored sections render neutral rather than borrowing another domain's color.
	expect(getThemeByBlock("Youth Participant Info")).toBeNull();
	expect(getThemeByBlock(undefined)).toBeNull();
});
