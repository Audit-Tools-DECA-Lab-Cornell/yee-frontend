import { type InstrumentResponse } from "@/features/yee-audit/api/yee-instrument";
import type { YeeSubmissionRecord } from "@/features/yee-audit/api/yee-audit-api";
import {
	getConditionAnswer,
	getPrimaryAnswer,
	logicalQuestionsForSection
} from "@/features/yee-audit/api/yee-logical-questions";
import { yeeDomainLabels, type YeeDomainKey } from "@/features/yee-audit/config/yee-audit-config";

export function normalizeText(value: string): string {
	return value
		.replace(/<[^>]+>/g, "")
		.replace(/\s+/g, " ")
		.trim();
}

function ensureQuestionMark(value: string): string {
	if (!value) return value;
	return /[?.!]$/.test(value) ? value : `${value}?`;
}

function normalizeVisibleQuestion(value: string): string {
	return ensureQuestionMark(normalizeText(value));
}

function selectedLabel(options: readonly { id: string; label: string }[], answerId: string): string {
	return options.find(option => option.id === answerId)?.label ?? answerId;
}

/** One recorded item - a question prompt, its answer, and any condition answer. */
export type ResponseWalkItem = {
	prompt: string;
	response: string;
	/** Condition answer, or "n/a" when the item has no condition pair. */
	condition: string;
};

export type ResponseWalkGroup = {
	domainKey: YeeDomainKey;
	label: string;
	items: ResponseWalkItem[];
	comment: string;
};

/**
 * Walk the instrument for one submission, yielding per-domain groups whose
 * `items` are in the exact order the legacy flat CSV numbered them.
 */
export function walkDomainResponses(
	submission: YeeSubmissionRecord,
	instrument: InstrumentResponse
): ResponseWalkGroup[] {
	const participantInfo: Record<string, unknown> = submission.participant_info ?? {};
	const sectionComments =
		participantInfo.section_comments && typeof participantInfo.section_comments === "object"
			? (participantInfo.section_comments as Partial<Record<YeeDomainKey, string>>)
			: {};

	return (Object.entries(yeeDomainLabels) as [YeeDomainKey, string][]).map(([domainKey, label]) => {
		const questions = logicalQuestionsForSection(instrument, domainKey, label);
		const walkItems = questions.map(question => {
			const primaryAnswer = getPrimaryAnswer(question, submission.responses);
			const conditionAnswer = getConditionAnswer(question, submission.responses);
			return {
				prompt: normalizeVisibleQuestion(question.prompt),
				response: primaryAnswer ? selectedLabel(question.primaryOptions, primaryAnswer) : "",
				condition:
					question.followUpOptions.length > 0 && conditionAnswer
						? selectedLabel(question.followUpOptions, conditionAnswer)
						: "n/a"
			};
		});

		return { domainKey, label, items: walkItems, comment: sectionComments[domainKey] || "" };
	});
}
