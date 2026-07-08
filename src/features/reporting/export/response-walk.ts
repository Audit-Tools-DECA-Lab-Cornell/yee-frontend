/**
 * Structured instrument walk — the shared, low-level extraction of a submission's
 * item-level answers, grouped by domain. This is DATA extraction (which items
 * exist, which answer was recorded), not layout. Both the frozen CSV builder and
 * the PDF/XLSX row builders format from these groups, so the two presentations
 * can't disagree about the underlying answers while each keeps its own layout.
 *
 * The grouping/indexing mirrors the original `buildQuestionColumns` in
 * `yee-submission-report.tsx` exactly: matrix questions expand to one entry per
 * choice, condition items pair onto their presence item, and placeholder prompts
 * fall back to the item id. A golden CSV fixture locks the resulting byte output.
 */
import {
	filterItemsForDomain,
	type InstrumentItem,
	type InstrumentResponse
} from "@/features/yee-audit/api/yee-instrument";
import type { YeeSubmissionRecord } from "@/features/yee-audit/api/yee-audit-api";
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

function isPlaceholderQuestionText(value: string): boolean {
	const normalized = normalizeText(value).toLowerCase();
	return normalized === "" || normalized === "click to write the question text";
}

function getChoiceLabel(choice: { Display?: string } | undefined, fallback: string): string {
	return choice?.Display || fallback;
}

function answerLabels(item: InstrumentItem): string[] {
	return Object.values(item.answers || {}).map(answer => normalizeText(getChoiceLabel(answer, "")).toLowerCase());
}

function isConditionItem(item: InstrumentItem): boolean {
	if (item.item_kind) return item.item_kind === "condition";
	const labels = answerLabels(item);
	return (
		normalizeText(item.question_text).toLowerCase().includes("if yes") ||
		(labels.includes("poor") && labels.includes("acceptable") && labels.includes("great"))
	);
}

function getSelectedMatrixAnswer(
	itemId: string,
	choiceId: string,
	responses: Record<string, string | Record<string, string>>
): string {
	const currentValue = responses[itemId];
	if (typeof currentValue !== "object" || !currentValue) return "";
	return currentValue[choiceId] || "";
}

function getSelectedAnswerLabel(item: InstrumentItem, answerId: string | null | undefined): string {
	if (!answerId) return "";
	return getChoiceLabel(item.answers?.[answerId], answerId);
}

/** One recorded item — a question prompt, its answer, and any condition answer. */
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
		const items = filterItemsForDomain(instrument.scoring_items, label);
		const grouped = new Map<string, InstrumentItem[]>();
		for (const item of items) {
			const key = item.base_question_id || item.item_id;
			const next = grouped.get(key) ?? [];
			next.push(item);
			grouped.set(key, next);
		}

		const walkItems: ResponseWalkItem[] = [];
		Array.from(grouped.values()).forEach(groupItems => {
			const presenceItem = groupItems.find(item => !isConditionItem(item)) ?? groupItems[0];
			const conditionItem = groupItems.find(item => isConditionItem(item)) ?? null;
			const choices = Object.entries(presenceItem.choices || {});
			const hasMatrixAnswers = Object.keys(presenceItem.answers || {}).length > 0;

			if (hasMatrixAnswers) {
				choices.forEach(([choiceId, choice]) => {
					const responseAnswerId = getSelectedMatrixAnswer(presenceItem.item_id, choiceId, submission.responses);
					const conditionAnswerId = conditionItem
						? getSelectedMatrixAnswer(conditionItem.item_id, choiceId, submission.responses)
						: "";
					walkItems.push({
						prompt: normalizeVisibleQuestion(getChoiceLabel(choice, choiceId)),
						response: responseAnswerId ? getSelectedAnswerLabel(presenceItem, responseAnswerId) : "",
						condition: conditionItem
							? conditionAnswerId
								? getSelectedAnswerLabel(conditionItem, conditionAnswerId)
								: "n/a"
							: "n/a"
					});
				});
				return;
			}

			const currentValue = submission.responses[presenceItem.item_id];
			const selectedValue = typeof currentValue === "string" ? currentValue : "";
			const prompt =
				!isPlaceholderQuestionText(presenceItem.question_text) && presenceItem.question_text
					? normalizeVisibleQuestion(presenceItem.question_text)
					: normalizeVisibleQuestion(presenceItem.item_id);
			walkItems.push({
				prompt,
				response: selectedValue ? getChoiceLabel(presenceItem.choices?.[selectedValue], selectedValue) : "",
				condition: "n/a"
			});
		});

		return { domainKey, label, items: walkItems, comment: sectionComments[domainKey] || "" };
	});
}
