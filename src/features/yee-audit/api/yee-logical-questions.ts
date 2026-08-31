import type { InstrumentItem, InstrumentResponse } from "./yee-instrument";

export type LogicalOption = {
	id: string;
	label: string;
};

export type LogicalQuestionBinding =
	| {
			mode: "matrix";
			presenceItemId: string;
			choiceId: string;
			conditionItemId: string | null;
	  }
	| {
			mode: "single";
			presenceItemId: string;
			choiceId: null;
			conditionItemId: null;
	  };

export type InstrumentLogicalQuestion = {
	key: string;
	sectionId: string;
	prompt: string;
	primaryOptions: LogicalOption[];
	followUpPrompt: string | null;
	followUpOptions: LogicalOption[];
	conditionTriggerAnswerIds: string[];
	conditionRequiredWhenShown: boolean;
	binding: LogicalQuestionBinding;
};

type ResponsesState = Record<string, string | Record<string, string>>;

function display(value: { Display?: string } | undefined, fallback: string): string {
	const candidate = value?.Display?.trim();
	return candidate ? candidate : fallback;
}

function options(source: Record<string, { Display?: string }>): LogicalOption[] {
	return Object.entries(source).map(([id, value]) => ({ id, label: display(value, id) }));
}

function positiveAnswerIds(item: InstrumentItem, choiceId: string): string[] {
	const entries = item.score_entries ?? [];
	return [
		...new Set(
			entries
				.filter(entry => entry.choice_id === choiceId)
				.filter(entry => Object.values(entry.scores_by_category_id).some(score => score > 0))
				.map(entry => entry.answer_id)
		)
	];
}

function legacySinglePrompt(item: InstrumentItem): string {
	const prompt = item.question_text.trim();
	return prompt.length === 0 || prompt.toLowerCase() === "click to write the question text" ? item.item_id : prompt;
}

function legacyQuestions(instrument: InstrumentResponse): InstrumentLogicalQuestion[] {
	const groups = new Map<string, InstrumentItem[]>();
	for (const item of instrument.scoring_items) {
		const groupId = item.base_question_id || item.item_id;
		groups.set(groupId, [...(groups.get(groupId) ?? []), item]);
	}

	return [...groups.entries()].flatMap(([groupId, items]): InstrumentLogicalQuestion[] => {
		const presence = items.find(item => item.item_kind === "presence") ?? null;
		if (presence === null) return [];
		const condition = items.find(item => item.item_kind === "condition") ?? null;
		const primaryOptions = options(presence.answers);
		if (primaryOptions.length === 0) {
			return [
				{
					key: presence.item_id,
					sectionId: presence.block,
					prompt: legacySinglePrompt(presence),
					primaryOptions: options(presence.choices),
					followUpPrompt: null,
					followUpOptions: [],
					conditionTriggerAnswerIds: [],
					conditionRequiredWhenShown: false,
					binding: {
						mode: "single" as const,
						presenceItemId: presence.item_id,
						choiceId: null,
						conditionItemId: null
					}
				}
			];
		}

		const followUpOptions = condition === null ? [] : options(condition.answers);
		return Object.entries(presence.choices).map(([choiceId, choice]) => ({
			key: `${presence.item_id}:${choiceId}`,
			sectionId: presence.block,
			prompt: display(choice, `${groupId}:${choiceId}`),
			primaryOptions,
			followUpPrompt:
				condition === null
					? null
					: display({ Display: condition.question_text }, instrument.condition_prompt || "Condition"),
			followUpOptions,
			conditionTriggerAnswerIds: condition === null ? [] : positiveAnswerIds(presence, choiceId),
			conditionRequiredWhenShown: condition !== null,
			binding: {
				mode: "matrix" as const,
				presenceItemId: presence.item_id,
				choiceId,
				conditionItemId: condition?.item_id ?? null
			}
		}));
	});
}

function authoringQuestions(instrument: InstrumentResponse): InstrumentLogicalQuestion[] | null {
	const authoring = instrument.authoring;
	if (authoring?.schemaVersion !== 2) return null;

	return authoring.sections.flatMap(section =>
		section.questions.flatMap(question => {
			const binding = question.responseBinding;
			if (binding === null) return [];
			return [
				{
					key: `${binding.presenceItemId}:${binding.choiceId}`,
					sectionId: section.id,
					prompt: question.prompt,
					primaryOptions: question.primary.options.map(option => ({ id: option.id, label: option.label })),
					followUpPrompt: question.followUp?.prompt ?? null,
					followUpOptions:
						question.followUp?.options.map(option => ({ id: option.id, label: option.label })) ?? [],
					conditionTriggerAnswerIds: question.followUp?.triggerOptionIds ?? [],
					// No follow-up means there is nothing that can be required. The
					// old `?? true` said the opposite, and only a second guard
					// downstream kept it from marking such a question incomplete.
					conditionRequiredWhenShown: question.followUp ? question.followUp.requiredWhenShown : false,
					binding: {
						mode: "matrix" as const,
						presenceItemId: binding.presenceItemId,
						choiceId: binding.choiceId,
						conditionItemId: binding.conditionItemId
					}
				}
			];
		})
	);
}

export function normalizeLogicalQuestions(instrument: InstrumentResponse): InstrumentLogicalQuestion[] {
	return authoringQuestions(instrument) ?? legacyQuestions(instrument);
}

/**
 * Reduce a section name to comparable letters and digits.
 *
 * The two vocabularies this has to reconcile were written by different people:
 * an authoring section id (`experienceOfSpace`) and the block heading stored on
 * a legacy scoring item (`"Experience of Space:"`), which is matched against a
 * display label (`"Experience of the Space"`). Punctuation, spacing, casing, and
 * a stray article are all that separate them, and none of those carry meaning
 * here — so none of them should decide whether a question appears on screen.
 */
function sectionSlug(value: string): string {
	return value
		.toLowerCase()
		.replace(/\bthe\b/g, "")
		.replace(/[^a-z0-9]/g, "");
}

export function logicalQuestionsForSection(
	instrument: InstrumentResponse,
	sectionId: string,
	legacyBlockLabel: string
): InstrumentLogicalQuestion[] {
	const wanted = sectionSlug(sectionId);
	const wantedLegacy = sectionSlug(legacyBlockLabel);
	return normalizeLogicalQuestions(instrument).filter(question => {
		const value = sectionSlug(question.sectionId);
		// A legacy block heading carries a trailing description of the section
		// ("Access: Presence, Condition, Provision"), so the label is a prefix of
		// it rather than the whole of it.
		return value === wanted || value.startsWith(wantedLegacy);
	});
}

export function getPrimaryAnswer(question: InstrumentLogicalQuestion, responses: ResponsesState): string {
	const value = responses[question.binding.presenceItemId];
	if (question.binding.mode === "single") return typeof value === "string" ? value : "";
	return typeof value === "object" && value ? value[question.binding.choiceId] || "" : "";
}

export function getConditionAnswer(question: InstrumentLogicalQuestion, responses: ResponsesState): string {
	if (question.binding.mode !== "matrix" || question.binding.conditionItemId === null) return "";
	const value = responses[question.binding.conditionItemId];
	return typeof value === "object" && value ? value[question.binding.choiceId] || "" : "";
}

export function shouldShowLogicalFollowUp(question: InstrumentLogicalQuestion, responses: ResponsesState): boolean {
	return question.conditionTriggerAnswerIds.includes(getPrimaryAnswer(question, responses));
}

export function isLogicalQuestionAnswered(question: InstrumentLogicalQuestion, responses: ResponsesState): boolean {
	return getPrimaryAnswer(question, responses).length > 0;
}

export function isLogicalQuestionComplete(question: InstrumentLogicalQuestion, responses: ResponsesState): boolean {
	if (!isLogicalQuestionAnswered(question, responses)) return false;
	if (!shouldShowLogicalFollowUp(question, responses) || !question.conditionRequiredWhenShown) return true;
	return getConditionAnswer(question, responses).length > 0;
}
