import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
	authoringInstrumentSchema,
	instrumentVersionDetailSchema,
	type InstrumentVersionDetail
} from "../../src/features/admin/instruments/authoring/schema";
import { instrumentErrorMessage } from "../../src/features/admin/instruments/authoring/errors";
import {
	authoringReducer,
	createAuthoringState,
	isAuthoringDirty
} from "../../src/features/admin/instruments/authoring/state";
import { validateAuthoring } from "../../src/features/admin/instruments/authoring/validation";
import { ApiError } from "../../src/lib/api/client";

const detail: InstrumentVersionDetail = instrumentVersionDetailSchema.parse({
	id: "11111111-1111-4111-8111-111111111111",
	instrument_key: "yee",
	instrument_version: "draft-1",
	parent_instrument_id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1",
	is_active: false,
	lifecycle: "draft",
	usage_count: 0,
	schema_generation: "authoring_v2",
	compatibility_status: "copy_only",
	created_at: "2026-08-28T12:00:00Z",
	updated_at: "2026-08-28T12:00:00Z",
	content: {
		survey_name: "YEE",
		version: "1",
		futureExtension: { preserved: true },
		authoring: {
			schemaVersion: 2,
			sections: [
				{
					id: "access",
					title: "Access",
					instructions: "Look around the entrance.",
					commentPrompt: "Any access notes?",
					questions: [
						{
							id: "access.q1",
							prompt: "Is transit nearby?",
							primary: {
								type: "single_select",
								options: [
									{ id: "1", label: "Yes", score: 1 },
									{ id: "2", label: "No", score: 0 }
								]
							},
							followUp: null,
							scoring: { method: "option_score", domain: "access" },
							responseBinding: {
								presenceItemId: "QID1#1",
								choiceId: "1",
								conditionItemId: null
							}
						}
					]
				}
			]
		}
	}
});

test("authoring boundary preserves extensions and rejects malformed option scores", () => {
	expect(detail.content.futureExtension).toEqual({ preserved: true });
	const malformed = structuredClone(detail.content.authoring);
	malformed.sections[0].questions[0].primary.options[0].score = 1.5;
	expect(authoringInstrumentSchema.safeParse(malformed).success).toBe(false);
});

test("one-level undo restores the complete question-centric snapshot", () => {
	const initial = createAuthoringState(detail);
	const edited = authoringReducer(initial, {
		type: "edit",
		update: draft => {
			draft.versionLabel = "draft-2";
			draft.content.authoring.sections[0].questions[0].prompt = "Edited wording";
		}
	});
	expect(isAuthoringDirty(edited)).toBe(true);
	const undone = authoringReducer(edited, { type: "undo" });
	expect(undone.versionLabel).toBe("draft-1");
	expect(undone.content.authoring.sections[0].questions[0].prompt).toBe("Is transit nearby?");
	expect(isAuthoringDirty(undone)).toBe(false);
});

test("local validation identifies a trigger that no longer has an option", () => {
	const authoring = structuredClone(detail.content.authoring);
	authoring.sections[0].questions[0].followUp = {
		triggerOptionIds: ["missing"],
		requiredWhenShown: true,
		prompt: "Rate it",
		options: [
			{ id: "1", label: "Poor", score: 0 },
			{ id: "2", label: "Great", score: 2 }
		]
	};
	expect(validateAuthoring(authoring).map(finding => finding.code)).toContain("unknown_trigger");
});

test("draft-only proxies never invalidate the public instrument cache", () => {
	for (const operation of ["fork", "draft", "validate"]) {
		const source = readFileSync(
			resolve(process.cwd(), `src/app/api/admin/instruments/[instrumentId]/${operation}/route.ts`),
			"utf8"
		);
		expect(source).not.toContain("revalidateTag");
	}
	const publishSource = readFileSync(
		resolve(process.cwd(), "src/app/api/admin/instruments/[instrumentId]/publish/route.ts"),
		"utf8"
	);
	expect(publishSource).toContain('revalidateTag("yee-instrument", { expire: 0 })');
});

test("scored-question deletion errors name every question the admin must restore", () => {
	const error = new ApiError(422, "Save failed", {
		detail: {
			code: "missing_scored_questions",
			question_ids: ["access.q1", "amenities.q2"]
		}
	});
	expect(instrumentErrorMessage(error)).toContain("access.q1, amenities.q2");
});
