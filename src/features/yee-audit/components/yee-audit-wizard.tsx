"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import * as React from "react";

import { useAuth } from "@/features/auth/components/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { YeeScoreSummary } from "@/features/yee-audit/components/yee-score-summary";
import { AuditSaveStatus } from "@/features/yee-audit/components/wizard/audit-save-status";
import type { SaveStatusState } from "@/features/yee-audit/components/wizard/audit-save-status";
import {
	fetchAuditState,
	fetchManagerAuditEditState,
	fetchSubmission,
	saveAuditDraft,
	updateManagerAuditEditState,
	type YeeAuditState,
	type YeeSubmissionRecord
} from "@/features/yee-audit/api/yee-audit-api";
import {
	createDefaultDraft,
	getDomainForStep,
	getNextStep,
	getPreviousStep,
	seasonOptions,
	yeeDomainLabels,
	yeeSteps,
	yeeWeightOptions,
	visitFrequencyOptions,
	weatherOptions,
	type YeeAuditDraft,
	type YeeDomainKey,
	type YeeScoreResult,
	type YeeStepNumber
} from "@/features/yee-audit/config/yee-audit-config";
import { getThemeByStep } from "@/features/yee-audit/config/yee-domain-theme";
import {
	fetchInstrument,
	filterItemsForDomain,
	findSectionMeta,
	type InstrumentItem,
	type InstrumentResponse
} from "@/features/yee-audit/api/yee-instrument";
import { fetchScorePreview } from "@/features/yee-audit/scoring/yee-scoring";
import { useAutosaveQueue } from "@/features/yee-audit/state/autosave-queue";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormSkeleton } from "@/components/ui/skeletons";

type ResponsesState = Record<string, string | Record<string, string>>;
type QuestionGroup = {
	baseQuestionId: string;
	items: InstrumentItem[];
};

function getChoiceLabel(choice: { Display?: string } | undefined, fallback: string): string {
	return choice?.Display || fallback;
}

function normalizeText(value: string) {
	return value
		.replace(/<[^>]+>/g, "")
		.replace(/\s+/g, " ")
		.trim();
}

function ensureQuestionMark(value: string) {
	if (!value) return value;
	return /[?.!]$/.test(value) ? value : `${value}?`;
}

function formatExampleText(value: string) {
	return value
		.replace(/\bexample:\s*/gi, "Ex: ")
		.replace(/\(example:\s*/gi, "(Ex: ")
		.replace(/\bex\s*:\s*/gi, "Ex: ");
}

function normalizeVisibleQuestion(value: string) {
	return ensureQuestionMark(formatExampleText(normalizeText(value)));
}

function isPlaceholderQuestionText(value: string) {
	const normalized = normalizeText(value).toLowerCase();
	return normalized === "" || normalized === "click to write the question text";
}

function hasAnsweredItem(item: InstrumentItem, responses: ResponsesState) {
	const currentValue = responses[item.item_id];
	const choices = Object.entries(item.choices || {});
	const answers = Object.entries(item.answers || {});

	if (choices.length === 0 && answers.length === 0) return true;
	if (answers.length > 0) {
		if (typeof currentValue !== "object" || !currentValue) return false;
		return choices.every(([choiceId]) => Boolean(currentValue[choiceId]));
	}

	return typeof currentValue === "string" && currentValue.length > 0;
}

function answerLabels(item: InstrumentItem) {
	return Object.values(item.answers || {}).map(answer => normalizeText(getChoiceLabel(answer, "")).toLowerCase());
}

function isConditionItem(item: InstrumentItem) {
	if (item.item_kind) return item.item_kind === "condition";
	const labels = answerLabels(item);
	return (
		normalizeText(item.question_text).toLowerCase().includes("if yes") ||
		(labels.includes("poor") && labels.includes("acceptable") && labels.includes("great"))
	);
}

function isPositiveAnswerLabel(label: string) {
	const normalized = normalizeText(label).toLowerCase();
	return normalized.startsWith("yes");
}

function getSelectedMatrixAnswer(itemId: string, choiceId: string, responses: ResponsesState) {
	const currentValue = responses[itemId];
	if (typeof currentValue !== "object" || !currentValue) return "";
	return currentValue[choiceId] || "";
}

function isRowPositive(item: InstrumentItem, choiceId: string, responses: ResponsesState) {
	const answerId = getSelectedMatrixAnswer(item.item_id, choiceId, responses);
	if (!answerId) return false;
	return isPositiveAnswerLabel(getChoiceLabel(item.answers?.[answerId], answerId));
}

function getOptionLabel(
	options: { value: string; label: string }[],
	value: string | null | undefined,
	fallback = "Not answered"
) {
	if (!value) return fallback;
	return options.find(option => option.value === value)?.label ?? value;
}

function normalizeSectionComments(raw: unknown): YeeAuditDraft["sectionComments"] {
	const empty = {
		access: "",
		activitySpaces: "",
		amenities: "",
		experienceOfSpace: "",
		aestheticsAndCare: "",
		useAndUsability: ""
	} satisfies YeeAuditDraft["sectionComments"];
	if (!raw || typeof raw !== "object") return empty;
	return {
		access: String((raw as Record<string, unknown>).access ?? ""),
		activitySpaces: String((raw as Record<string, unknown>).activitySpaces ?? ""),
		amenities: String((raw as Record<string, unknown>).amenities ?? ""),
		experienceOfSpace: String((raw as Record<string, unknown>).experienceOfSpace ?? ""),
		aestheticsAndCare: String((raw as Record<string, unknown>).aestheticsAndCare ?? ""),
		useAndUsability: String((raw as Record<string, unknown>).useAndUsability ?? "")
	};
}

function getSelectedAnswerLabel(item: InstrumentItem, answerId: string | null | undefined) {
	if (!answerId) return "";
	return getChoiceLabel(item.answers?.[answerId], answerId);
}

function getReviewQuestionTitle(group: QuestionGroup) {
	const presenceItem = group.items.find(item => !isConditionItem(item)) ?? group.items[0];
	if (
		presenceItem.choices &&
		Object.keys(presenceItem.choices).length > 1 &&
		isPlaceholderQuestionText(presenceItem.question_text)
	) {
		return "";
	}
	if (isPlaceholderQuestionText(presenceItem.question_text)) {
		return "";
	}
	return normalizeVisibleQuestion(presenceItem.question_text || presenceItem.item_id);
}

function getReviewAnswerRows(group: QuestionGroup, responses: ResponsesState) {
	const presenceItem = group.items.find(item => !isConditionItem(item)) ?? group.items[0];
	const conditionItem = group.items.find(item => isConditionItem(item)) ?? null;
	const choices = Object.entries(presenceItem.choices || {});
	const presenceAnswers = Object.entries(presenceItem.answers || {});
	const hasMatrixAnswers = presenceAnswers.length > 0;

	if (hasMatrixAnswers) {
		return choices
			.map(([choiceId, choice]) => {
				const presenceAnswerId = getSelectedMatrixAnswer(presenceItem.item_id, choiceId, responses);
				if (!presenceAnswerId) return null;
				const conditionAnswerId = conditionItem
					? getSelectedMatrixAnswer(conditionItem.item_id, choiceId, responses)
					: "";
				return {
					prompt: normalizeVisibleQuestion(getChoiceLabel(choice, choiceId)),
					response: getSelectedAnswerLabel(presenceItem, presenceAnswerId),
					condition:
						conditionItem && conditionAnswerId
							? getSelectedAnswerLabel(conditionItem, conditionAnswerId)
							: ""
				};
			})
			.filter((value): value is { prompt: string; response: string; condition: string } => Boolean(value));
	}

	const currentValue = responses[presenceItem.item_id];
	const singleValue = typeof currentValue === "string" ? currentValue : "";
	if (!singleValue) return [];
	return [
		{
			prompt:
				getReviewQuestionTitle(group) ||
				normalizeVisibleQuestion(presenceItem.question_text || presenceItem.item_id),
			response: getChoiceLabel(presenceItem.choices?.[singleValue], singleValue),
			condition: ""
		}
	];
}

function getMultiOptionLabels(
	options: { value: string; label: string }[],
	value: string | null | undefined,
	fallback = "Not answered"
) {
	if (!value) return fallback;
	const selectedValues = value.split("|").filter(Boolean);
	if (selectedValues.length === 0) return fallback;
	return selectedValues
		.map(selectedValue => options.find(option => option.value === selectedValue)?.label ?? selectedValue)
		.join(", ");
}

function getStepForDomainKey(domain: YeeDomainKey): YeeStepNumber {
	switch (domain) {
		case "access":
			return 3;
		case "activitySpaces":
			return 4;
		case "amenities":
			return 5;
		case "experienceOfSpace":
			return 6;
		case "aestheticsAndCare":
			return 7;
		case "useAndUsability":
			return 8;
	}
}

function groupInstrumentItems(items: InstrumentItem[]): QuestionGroup[] {
	const map = new Map<string, InstrumentItem[]>();
	for (const item of items) {
		const key = item.base_question_id || item.item_id;
		const next = map.get(key) ?? [];
		next.push(item);
		map.set(key, next);
	}
	return Array.from(map.entries()).map(([baseQuestionId, groupItems]) => ({
		baseQuestionId,
		items: groupItems.sort((left, right) => {
			if (isConditionItem(left) === isConditionItem(right)) return left.item_id.localeCompare(right.item_id);
			return isConditionItem(left) ? 1 : -1;
		})
	}));
}

function normalizeWeights(raw: unknown): YeeAuditDraft["weights"] {
	const empty = {
		access: "",
		activitySpaces: "",
		amenities: "",
		experienceOfSpace: "",
		aestheticsAndCare: "",
		useAndUsability: ""
	} satisfies YeeAuditDraft["weights"];
	if (!raw || typeof raw !== "object") return empty;
	return {
		access: String((raw as Record<string, unknown>).access ?? ""),
		activitySpaces: String((raw as Record<string, unknown>).activitySpaces ?? ""),
		amenities: String((raw as Record<string, unknown>).amenities ?? ""),
		experienceOfSpace: String((raw as Record<string, unknown>).experienceOfSpace ?? ""),
		aestheticsAndCare: String((raw as Record<string, unknown>).aestheticsAndCare ?? ""),
		useAndUsability: String((raw as Record<string, unknown>).useAndUsability ?? "")
	};
}

function getShortStepLabel(stepValue: YeeStepNumber) {
	switch (stepValue) {
		case 1:
			return "Context";
		case 2:
			return "Weighting";
		case 3:
			return "Access";
		case 4:
			return "Activity Spaces";
		case 5:
			return "Amenities";
		case 6:
			return "Experience";
		case 7:
			return "Aesthetics & Care";
		case 8:
			return "Use & Usability";
		case 9:
			return "Final Comments";
	}
}

function getSectionIntroCopy(domain: YeeDomainKey) {
	switch (domain) {
		case "access":
			return {
				heading: "Access",
				body: (
					<>
						This section asks about access to the park or space and the surrounding area. Do your best to
						look around the space and its entrances to answer the questions. If asked to rate the condition
						of a feature, consider whether it is <strong>poor</strong> (Ex: poorly maintained, unsafe,
						broken, or dirty), <strong>acceptable</strong> (Ex: clean, in good shape, well maintained, or
						relatively safe), or <strong>great</strong> (Ex: in really good shape, really well maintained,
						and feels very safe).
					</>
				)
			};
		case "activitySpaces":
			return {
				heading: "Activity Spaces",
				body: (
					<>
						This section asks you to evaluate opportunities and spaces for recreational and social
						activities. If asked to rate the condition of a feature, consider whether it is{" "}
						<strong>poor</strong> (Ex: poorly maintained, unsafe, broken, or dirty),{" "}
						<strong>acceptable</strong> (Ex: clean, in good shape, well maintained, or relatively safe), or{" "}
						<strong>great</strong> (Ex: in really good shape, really well maintained, and feels very safe).
					</>
				)
			};
		case "amenities":
			return {
				heading: "Amenities",
				body: (
					<>
						This section asks about the presence and condition of different amenities within the space. If
						asked to rate the condition of a feature, consider whether it is <strong>poor</strong> (Ex:
						poorly maintained, unsafe, broken, or dirty), <strong>acceptable</strong> (Ex: clean, in good
						shape, well maintained, or relatively safe), or <strong>great</strong> (Ex: in really good
						shape, really well maintained, and feels very safe).
					</>
				)
			};
		case "experienceOfSpace":
			return {
				heading: "Experience of Space",
				body: (
					<>
						This section asks about how you feel in or experience the space. Choose the most appropriate
						answer for each statement based on what you notice during your visit.
					</>
				)
			};
		case "aestheticsAndCare":
			return {
				heading: "Aesthetics & Care",
				body: (
					<>
						This section asks about how the space looks and how well it is cared for or maintained. If asked
						to rate the condition of a feature, consider whether it is <strong>poor</strong> (Ex: poorly
						maintained, unsafe, broken, or dirty), <strong>acceptable</strong> (Ex: clean, in good shape,
						well maintained, or relatively safe), or <strong>great</strong> (Ex: in really good shape,
						really well maintained, and feels very safe).
					</>
				)
			};
		case "useAndUsability":
			return {
				heading: "Use & Usability",
				body: (
					<>
						This section asks about how the space can be or is used. If asked to rate the condition of a
						feature, consider whether it is <strong>poor</strong> (Ex: poorly maintained, unsafe, broken, or
						dirty), <strong>acceptable</strong> (Ex: clean, in good shape, well maintained, or relatively
						safe), or <strong>great</strong> (Ex: in really good shape, really well maintained, and feels
						very safe).
					</>
				)
			};
	}
}

function getSurfacePalette(stepValue: YeeStepNumber) {
	switch (stepValue) {
		case 1:
			return {
				card: "border-sky-200/80 bg-[#f2f6fa]",
				inner: "border-sky-100 bg-white",
				selected:
					"border-sky-500 bg-[#dce8f4] text-slate-950 ring-1 ring-sky-200 shadow-[0_10px_22px_-18px_rgba(70,97,129,0.3)]",
				idle: "border-sky-200 bg-white text-slate-900 hover:border-sky-300 hover:bg-sky-50/70",
				instruction: "border-[#b8d0e5] bg-[#7f9cb8] text-white",
				progress: "border-sky-200/80 bg-sky-50/70",
				condition: "border-sky-300 bg-sky-100/75"
			};
		case 2:
			return {
				card: "border-orange-200/80 bg-[#fff9f5]",
				inner: "border-orange-100 bg-white",
				selected:
					"border-orange-500 bg-[#f4ddcd] text-[#6f3f1f] ring-1 ring-orange-200 shadow-[0_10px_22px_-18px_rgba(170,94,52,0.28)]",
				idle: "border-orange-300 bg-[#fffdfb] text-[#6f3f1f] hover:border-orange-400 hover:bg-[#fff4ed]",
				instruction: "border-[#efcfbb] bg-[#dea882] text-white",
				progress: "border-orange-200/80 bg-[#fff6ef]",
				condition: "border-orange-300 bg-[#fbe7da]"
			};
		case 9:
			return {
				card: "border-emerald-200/80 bg-[#eef7f1]",
				inner: "border-emerald-100 bg-white/90",
				selected:
					"border-emerald-600 bg-emerald-200 text-emerald-950 ring-1 ring-emerald-300 shadow-[0_10px_22px_-18px_rgba(6,78,59,0.35)]",
				idle: "border-emerald-200 bg-[#f4faf6] text-emerald-950 hover:border-emerald-300 hover:bg-emerald-100/90",
				instruction: "border-[#7ed6ad] bg-[#57b894] text-white",
				progress: "border-emerald-200/80 bg-emerald-50/80",
				condition: "border-emerald-300 bg-emerald-100/80"
			};
		case 3:
		case 4:
		case 5:
		case 6:
		case 7:
		case 8: {
			const theme = getThemeByStep(stepValue);
			if (theme) {
				return {
					card: theme.card,
					inner: "border-border bg-background/50",
					selected: `border-2 ${theme.selectedBorderClass} ${theme.selectedBgClass} ${theme.textClass}`,
					idle: theme.idleClass,
					instruction: theme.instruction,
					progress: theme.progress,
					condition: theme.condition
				};
			}
			return {
				card: "border-border bg-muted/30",
				inner: "border-border bg-background/50",
				selected: "border-2 border-[var(--yee-green-600)] bg-[var(--yee-green-50)] text-[var(--yee-green-900)]",
				idle: "border-border bg-background text-muted-foreground hover:bg-muted",
				instruction: "border-border bg-muted text-foreground",
				progress: "border-border bg-muted/50",
				condition: "border-border bg-muted"
			};
		}
	}
}

function getMatrixCardInstruction(domain: YeeDomainKey) {
	if (domain === "access") {
		return "Answer each item below. If the feature is present, the condition follow-up will appear right underneath it.";
	}
	return "Answer each item below. If the feature is present, the condition follow-up will appear right underneath it.";
}

function getSingleCardInstruction(domain: YeeDomainKey) {
	switch (domain) {
		case "access":
			return "Choose the most appropriate answer for each access item below.";
		case "activitySpaces":
			return "Please answer the following questions about activity spaces.";
		case "amenities":
			return "Choose the most appropriate answer for each amenities item below.";
		case "experienceOfSpace":
			return "Choose the most appropriate answer for each statement below.";
		case "aestheticsAndCare":
			return "Choose the most appropriate answer for each aesthetics and care item below.";
		case "useAndUsability":
			return "Choose the most appropriate answer for each use and usability item below.";
	}
}

function getDomainForBlock(block: string): YeeDomainKey | null {
	const normalized = block.toLowerCase();
	if (normalized.includes("access")) return "access";
	if (normalized.includes("activity spaces")) return "activitySpaces";
	if (normalized.includes("amenities")) return "amenities";
	if (normalized.includes("experience")) return "experienceOfSpace";
	if (normalized.includes("aesthetics")) return "aestheticsAndCare";
	if (normalized.includes("use & usability")) return "useAndUsability";
	return null;
}

function getWeightingPrompt(domain: YeeDomainKey) {
	switch (domain) {
		case "access":
			return "How important is to you that you can easily and safely get to these spaces?";
		case "activitySpaces":
			return "How important is it to you that these places have the spaces and/or equipment that allow you to do the activities you like (example: have spaces for sports/games, for hanging out with friends, for spending quiet time on your own, etc)?";
		case "amenities":
			return "How important is it to you that these places have amenities that make the space more comfortable and suitable (like bathrooms, wifi, garbage bins, places to buy food/drinks, seating for groups, shade etc)?";
		case "experienceOfSpace":
			return "How important is it to you that these places feel pleasant and safe to be in (example: feel peaceful, have lots of nature or nice views, feel safe and comfortable, where you won't be bothered or feel out of place, etc)?";
		case "aestheticsAndCare":
			return "How important is it to you that these places look nice and well cared for (example: have lots of greenery, have gardens or art to look at, are free from litter and graffiti, looks like someone is taking good care of it, etc)?";
		case "useAndUsability":
			return "How important is it to you that these places are suitable for many activities for youth and/or the community (example: allows for lots of different types of activities, has lights that allow for night use, is good for youth programming or dog walking, etc)?";
	}
}

function getIncompleteStepMessage(step: YeeStepNumber | undefined) {
	if (step === 1) {
		return "Please answer the visit frequency, season, and weather questions before continuing.";
	}
	if (step === 2) {
		return "Please answer all six importance weighting questions before continuing.";
	}
	if (step && step >= 3 && step <= 8) {
		return "Please finish the required questions on this section before continuing.";
	}
	return "Please complete the required answers before continuing.";
}

function getIncompleteSectionSteps(draft: YeeAuditDraft, responses: ResponsesState, instrument: InstrumentResponse) {
	return yeeSteps
		.filter(entry => entry.step !== 9)
		.filter(entry => !isStepCompleteForData(entry.step, draft, responses, instrument))
		.map(entry => ({
			step: entry.step,
			label: getShortStepLabel(entry.step)
		}));
}

function buildIncompleteSectionsMessage(
	draft: YeeAuditDraft,
	responses: ResponsesState,
	instrument: InstrumentResponse
) {
	const incompleteSections = getIncompleteSectionSteps(draft, responses, instrument);
	if (incompleteSections.length === 0) return "";
	if (incompleteSections.length === 1) {
		return `Please complete the ${incompleteSections[0].label} section before submitting this audit.`;
	}
	return `Please complete these sections before submitting this audit: ${incompleteSections
		.map(section => section.label)
		.join(", ")}.`;
}

function getPromptCountForItem(item: InstrumentItem) {
	const choices = Object.keys(item.choices || {});
	const answers = Object.keys(item.answers || {});
	if (answers.length > 0) return Math.max(choices.length, 1);
	return choices.length > 0 ? 1 : 0;
}

function getAnsweredPromptCountForItem(item: InstrumentItem, responses: ResponsesState) {
	const currentValue = responses[item.item_id];
	const choices = Object.entries(item.choices || {});
	const answers = Object.entries(item.answers || {});

	if (answers.length > 0) {
		if (typeof currentValue !== "object" || !currentValue) return 0;
		return choices.reduce((sum, [choiceId]) => (currentValue[choiceId] ? sum + 1 : sum), 0);
	}

	return typeof currentValue === "string" && currentValue.length > 0 ? 1 : 0;
}

function isStepCompleteForData(
	stepValue: YeeStepNumber,
	draft: YeeAuditDraft,
	responses: ResponsesState,
	instrument: InstrumentResponse
) {
	if (stepValue === 1) {
		return Boolean(draft.visitFrequency && draft.season && draft.weather.split("|").filter(Boolean).length > 0);
	}
	if (stepValue === 2) {
		return Object.values(draft.weights).every(Boolean);
	}
	if (stepValue === 9) {
		return true;
	}
	const domain = getDomainForStep(stepValue);
	if (!domain) return false;
	const groups = groupInstrumentItems(filterItemsForDomain(instrument.scoring_items, yeeDomainLabels[domain]));
	return groups.every(group => {
		if (group.items.length === 1) return hasAnsweredItem(group.items[0], responses);
		const presenceItem = group.items.find(item => !isConditionItem(item)) ?? group.items[0];
		const conditionItem = group.items.find(item => isConditionItem(item)) ?? null;
		const choiceIds = Object.keys(presenceItem.choices || {});
		return choiceIds.every(choiceId => {
			const presenceValue = getSelectedMatrixAnswer(presenceItem.item_id, choiceId, responses);
			if (!presenceValue) return false;
			if (!conditionItem || !isRowPositive(presenceItem, choiceId, responses)) return true;
			return Boolean(getSelectedMatrixAnswer(conditionItem.item_id, choiceId, responses));
		});
	});
}

function areAllRequiredSectionsComplete(
	draft: YeeAuditDraft,
	responses: ResponsesState,
	instrument: InstrumentResponse
) {
	return yeeSteps
		.filter(entry => entry.step !== 9)
		.every(entry => isStepCompleteForData(entry.step, draft, responses, instrument));
}

function buildParticipantInfo(draft: YeeAuditDraft) {
	return {
		auditor_id: draft.auditorId,
		auditor_name: draft.auditorName,
		participant_id: draft.participantId,
		place_id: draft.placeId,
		place_name: draft.placeName,
		audit_date: draft.auditDate,
		start_time: draft.startTime,
		finish_time: draft.finishTime,
		total_minutes: draft.totalMinutes,
		visit_frequency: draft.visitFrequency,
		season: draft.season,
		weather: draft.weather,
		domain_weights: draft.weights,
		weighting_comments: draft.weightingComments,
		comments: draft.comments,
		section_comments: draft.sectionComments
	};
}

function draftFromAuditState(placeId: string, state: YeeAuditState): YeeAuditDraft {
	const participantInfo = state.participant_info ?? {};
	const weights = normalizeWeights(participantInfo.domain_weights);
	const sectionComments = normalizeSectionComments(participantInfo.section_comments);
	const baseDraft = createDefaultDraft(placeId);
	return {
		...baseDraft,
		placeId,
		placeName:
			state.place_name ||
			(typeof participantInfo.place_name === "string" && participantInfo.place_name
				? participantInfo.place_name
				: baseDraft.placeName),
		auditorId: state.auditor_generated_id || baseDraft.auditorId,
		auditorName:
			typeof participantInfo.auditor_name === "string" && participantInfo.auditor_name
				? participantInfo.auditor_name
				: baseDraft.auditorName,
		participantId:
			typeof participantInfo.participant_id === "string"
				? participantInfo.participant_id
				: baseDraft.participantId,
		auditDate:
			typeof participantInfo.audit_date === "string" && participantInfo.audit_date
				? participantInfo.audit_date
				: baseDraft.auditDate,
		startTime:
			typeof participantInfo.start_time === "string" && participantInfo.start_time
				? participantInfo.start_time
				: baseDraft.startTime,
		finishTime: typeof participantInfo.finish_time === "string" ? participantInfo.finish_time : "",
		totalMinutes: Number(participantInfo.total_minutes ?? 0) || 0,
		visitFrequency: typeof participantInfo.visit_frequency === "string" ? participantInfo.visit_frequency : "",
		season: typeof participantInfo.season === "string" ? participantInfo.season : "",
		weather: typeof participantInfo.weather === "string" ? participantInfo.weather : "",
		weights,
		weightingComments:
			typeof participantInfo.weighting_comments === "string" ? participantInfo.weighting_comments : "",
		responses: state.responses ?? {},
		comments: typeof participantInfo.comments === "string" ? participantInfo.comments : "",
		sectionComments,
		submittedAt: state.submitted_at,
		lastResult: state.submission_id
			? {
					id: state.submission_id,
					totalScore: state.score?.total_score ?? 0
				}
			: null,
		scorePreview: state.score
	};
}

function draftFromStoredRecord(
	placeId: string,
	record: {
		place_id?: string;
		place_name: string | null;
		auditor_generated_id: string | null;
		submitted_at: string | null;
		participant_info: Record<string, unknown>;
		responses: Record<string, string | Record<string, string>>;
		score: YeeScoreResult;
		submission_id?: string | null;
		id?: string;
	}
): YeeAuditDraft {
	const participantInfo = record.participant_info ?? {};
	const weights = normalizeWeights(participantInfo.domain_weights);
	const sectionComments = normalizeSectionComments(participantInfo.section_comments);
	const baseDraft = createDefaultDraft(placeId);
	const scorePreview = record.score;
	return {
		...baseDraft,
		placeId:
			record.place_id ||
			(typeof participantInfo.place_id === "string" && participantInfo.place_id
				? participantInfo.place_id
				: placeId),
		placeName:
			record.place_name ||
			(typeof participantInfo.place_name === "string" && participantInfo.place_name
				? participantInfo.place_name
				: baseDraft.placeName),
		auditorId: record.auditor_generated_id || baseDraft.auditorId,
		auditorName:
			typeof participantInfo.auditor_name === "string" && participantInfo.auditor_name
				? participantInfo.auditor_name
				: baseDraft.auditorName,
		participantId:
			typeof participantInfo.participant_id === "string"
				? participantInfo.participant_id
				: baseDraft.participantId,
		auditDate:
			typeof participantInfo.audit_date === "string" && participantInfo.audit_date
				? participantInfo.audit_date
				: baseDraft.auditDate,
		startTime:
			typeof participantInfo.start_time === "string" && participantInfo.start_time
				? participantInfo.start_time
				: baseDraft.startTime,
		finishTime: typeof participantInfo.finish_time === "string" ? participantInfo.finish_time : "",
		totalMinutes: Number(participantInfo.total_minutes ?? 0) || 0,
		visitFrequency: typeof participantInfo.visit_frequency === "string" ? participantInfo.visit_frequency : "",
		season: typeof participantInfo.season === "string" ? participantInfo.season : "",
		weather: typeof participantInfo.weather === "string" ? participantInfo.weather : "",
		weights,
		weightingComments:
			typeof participantInfo.weighting_comments === "string" ? participantInfo.weighting_comments : "",
		responses: record.responses ?? {},
		comments: typeof participantInfo.comments === "string" ? participantInfo.comments : "",
		sectionComments,
		submittedAt: record.submitted_at,
		lastResult:
			record.submission_id || record.id
				? {
						id: record.submission_id || record.id || "",
						totalScore: record.score.total_score
					}
				: null,
		scorePreview
	};
}

function OptionCards({
	name,
	options,
	value,
	onChange,
	readOnly = false,
	columns = 3,
	palette = getSurfacePalette(1)
}: {
	name: string;
	options: { value: string; label: string }[];
	value: string;
	onChange: (value: string) => void;
	readOnly?: boolean;
	columns?: 1 | 2 | 3;
	palette?: ReturnType<typeof getSurfacePalette>;
}) {
	const gridClass = columns === 1 ? "grid-cols-1" : columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3";
	return (
		<div className={`grid gap-2 ${gridClass}`}>
			{options.map(option => (
				<label
					key={`${name}-${option.value}`}
					className={`rounded-md border px-4 py-3 text-sm transition ${
						readOnly ? "cursor-default" : "cursor-pointer"
					} ${value === option.value ? `border-2 ${palette.selected}` : `border ${palette.idle}`}`}>
					<input
						type="radio"
						name={name}
						value={option.value}
						checked={value === option.value}
						onChange={() => onChange(option.value)}
						className="sr-only"
						disabled={readOnly}
					/>
					<span className="font-medium">{option.label}</span>
				</label>
			))}
		</div>
	);
}

function MultiSelectCards({
	name,
	options,
	value,
	onChange,
	palette = getSurfacePalette(1)
}: {
	name: string;
	options: { value: string; label: string }[];
	value: string[];
	onChange: (next: string[]) => void;
	palette?: ReturnType<typeof getSurfacePalette>;
}) {
	return (
		<div className="grid gap-2 sm:grid-cols-3">
			{options.map(option => {
				const checked = value.includes(option.value);
				return (
					<label
						key={`${name}-${option.value}`}
						className={`cursor-pointer rounded-md border px-4 py-3 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] transition ${
							checked ? palette.selected : palette.idle
						}`}>
						<input
							type="checkbox"
							name={name}
							value={option.value}
							checked={checked}
							onChange={() =>
								onChange(
									checked ? value.filter(entry => entry !== option.value) : [...value, option.value]
								)
							}
							className="sr-only"
						/>
						<span className="font-medium">{option.label}</span>
					</label>
				);
			})}
		</div>
	);
}

function InstrumentQuestionCard({
	item,
	responses,
	setResponses,
	palette
}: {
	item: InstrumentItem;
	responses: ResponsesState;
	setResponses: React.Dispatch<React.SetStateAction<ResponsesState>>;
	palette: ReturnType<typeof getSurfacePalette>;
}) {
	const choices = Object.entries(item.choices || {});
	const answers = Object.entries(item.answers || {});
	const currentValue = responses[item.item_id];

	function updateSingleResponse(itemId: string, choiceId: string) {
		setResponses(prev => ({ ...prev, [itemId]: choiceId }));
	}

	function updateMatrixResponse(itemId: string, rowId: string, answerId: string) {
		setResponses(prev => {
			const existing = prev[itemId];
			const matrix = typeof existing === "object" && existing ? { ...existing } : {};
			matrix[rowId] = answerId;
			return { ...prev, [itemId]: matrix };
		});
	}

	if (choices.length === 0 && answers.length === 0) {
		return (
			<Card className={`rounded-md border shadow-[0_12px_35px_-24px_rgba(16,35,31,0.45)] ${palette.card}`}>
				<CardContent className="py-6 text-sm leading-7 text-slate-600">
					{normalizeText(item.question_text)}
				</CardContent>
			</Card>
		);
	}

	if (answers.length > 0) {
		const title = isPlaceholderQuestionText(item.question_text)
			? getSingleCardInstruction(getDomainForBlock(item.block) ?? "access")
			: normalizeVisibleQuestion(item.question_text || item.item_id);
		return (
			<Card className={`rounded-md border shadow-[0_18px_40px_-30px_rgba(16,35,31,0.55)] ${palette.card}`}>
				<CardHeader className="pb-3">
					<CardTitle className="text-base font-semibold">{title}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{choices.map(([choiceId, choice]) => {
						const selected =
							typeof currentValue === "object" && currentValue ? currentValue[choiceId] || "" : "";

						return (
							<div
								key={`${item.item_id}-${choiceId}`}
								className={`space-y-3 rounded-[1.35rem] border p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ${palette.inner}`}>
								<p className="text-sm font-medium text-slate-900">
									{normalizeVisibleQuestion(getChoiceLabel(choice, choiceId))}
								</p>
								<OptionCards
									name={`${item.item_id}-${choiceId}`}
									value={selected}
									onChange={value => updateMatrixResponse(item.item_id, choiceId, value)}
									options={answers.map(([answerId, answer]) => ({
										value: answerId,
										label: getChoiceLabel(answer, answerId)
									}))}
									palette={palette}
								/>
							</div>
						);
					})}
				</CardContent>
			</Card>
		);
	}

	const title = isPlaceholderQuestionText(item.question_text)
		? getSingleCardInstruction(getDomainForBlock(item.block) ?? "access")
		: normalizeVisibleQuestion(item.question_text || item.item_id);

	return (
		<Card className={`rounded-md border shadow-[0_18px_40px_-30px_rgba(16,35,31,0.55)] ${palette.card}`}>
			<CardHeader className="pb-3">
				<CardTitle className="text-base font-semibold">{title}</CardTitle>
			</CardHeader>
			<CardContent>
				<OptionCards
					name={item.item_id}
					value={typeof currentValue === "string" ? currentValue : ""}
					onChange={value => updateSingleResponse(item.item_id, value)}
					options={choices.map(([choiceId, choice]) => ({
						value: choiceId,
						label: getChoiceLabel(choice, choiceId)
					}))}
					palette={palette}
				/>
			</CardContent>
		</Card>
	);
}

function InstrumentQuestionGroupCard({
	group,
	responses,
	setResponses,
	palette
}: {
	group: QuestionGroup;
	responses: ResponsesState;
	setResponses: React.Dispatch<React.SetStateAction<ResponsesState>>;
	palette: ReturnType<typeof getSurfacePalette>;
}) {
	if (group.items.length === 1) {
		return (
			<InstrumentQuestionCard
				item={group.items[0]}
				responses={responses}
				setResponses={setResponses}
				palette={palette}
			/>
		);
	}

	const presenceItem = group.items.find(item => !isConditionItem(item)) ?? group.items[0];
	const conditionItem = group.items.find(item => isConditionItem(item)) ?? null;
	const choices = Object.entries(presenceItem.choices || {});
	const presenceAnswers = Object.entries(presenceItem.answers || {});
	const conditionAnswers = Object.entries(conditionItem?.answers || {});

	function updateMatrixResponse(itemId: string, rowId: string, answerId: string) {
		setResponses(prev => {
			const existing = prev[itemId];
			const matrix = typeof existing === "object" && existing ? { ...existing } : {};
			matrix[rowId] = answerId;
			return { ...prev, [itemId]: matrix };
		});
	}

	return (
		<Card className={`rounded-md border shadow-[0_18px_40px_-30px_rgba(16,35,31,0.55)] ${palette.card}`}>
			<CardHeader className="pb-3">
				<CardTitle className="text-base font-semibold">
					{getMatrixCardInstruction(getDomainForBlock(presenceItem.block) ?? "access")}
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{choices.map(([choiceId, choice]) => {
					const selectedPresence = getSelectedMatrixAnswer(presenceItem.item_id, choiceId, responses);
					const showCondition = conditionItem ? isRowPositive(presenceItem, choiceId, responses) : false;
					const selectedCondition = conditionItem
						? getSelectedMatrixAnswer(conditionItem.item_id, choiceId, responses)
						: "";
					return (
						<div
							key={`${group.baseQuestionId}-${choiceId}`}
							className={`space-y-3 rounded-[1.35rem] border p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ${palette.inner}`}>
							<p className="text-sm font-medium text-slate-900">
								{ensureQuestionMark(getChoiceLabel(choice, choiceId))}
							</p>
							<OptionCards
								name={`${presenceItem.item_id}-${choiceId}`}
								value={selectedPresence}
								onChange={value => updateMatrixResponse(presenceItem.item_id, choiceId, value)}
								options={presenceAnswers.map(([answerId, answer]) => ({
									value: answerId,
									label: getChoiceLabel(answer, answerId)
								}))}
								palette={palette}
							/>
							{conditionItem && showCondition ? (
								<div className={`space-y-2 rounded-md border p-4 ${palette.condition}`}>
									<p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-800">
										Condition
									</p>
									<OptionCards
										name={`${conditionItem.item_id}-${choiceId}`}
										value={selectedCondition}
										onChange={value => updateMatrixResponse(conditionItem.item_id, choiceId, value)}
										options={conditionAnswers.map(([answerId, answer]) => ({
											value: answerId,
											label: getChoiceLabel(answer, answerId)
										}))}
										palette={palette}
									/>
								</div>
							) : null}
						</div>
					);
				})}
			</CardContent>
		</Card>
	);
}

export function YeeAuditWizard({
	placeId,
	mode,
	step,
	variant = "default",
	auditId,
	basePath,
	exitHref = "/auditor"
}: {
	placeId: string;
	mode: "step" | "review" | "submitted";
	step?: YeeStepNumber;
	variant?: "default" | "manager-edit";
	auditId?: string;
	basePath?: string;
	exitHref?: string;
}) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { session } = useAuth();
	const [instrument, setInstrument] = React.useState<InstrumentResponse | null>(null);
	const [draft, setDraft] = React.useState<YeeAuditDraft>(() => createDefaultDraft(placeId));
	const [responses, setResponses] = React.useState<ResponsesState>({});
	const [loading, setLoading] = React.useState(true);
	const [submitting, setSubmitting] = React.useState(false);
	const [previewLoading, setPreviewLoading] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);
	const hydratedRef = React.useRef(false);

	// Confirm dialog state - replaces all window.confirm calls.
	type ConfirmState = {
		open: boolean;
		title: string;
		description: string;
		confirmLabel?: string;
		variant: "default" | "destructive";
		onConfirm: () => void | Promise<void>;
	};
	const [confirmState, setConfirmState] = React.useState<ConfirmState>({
		open: false,
		title: "",
		description: "",
		variant: "default",
		onConfirm: () => undefined
	});

	const openConfirm = React.useCallback((opts: Omit<ConfirmState, "open">) => {
		setConfirmState({ ...opts, open: true });
	}, []);
	const lastPersistedSnapshot = React.useRef<string | null>(null);
	const managerSubmissionId = variant === "manager-edit" ? searchParams.get("submissionId") : null;

	// Serialised snapshot type threaded through the autosave queue.
	type DraftPayload = {
		participant_info: Record<string, unknown>;
		responses: ResponsesState;
	};

	const buildManagerEditHref = React.useCallback(
		(path: string) => {
			if (!managerSubmissionId) return path;
			return `${path}?submissionId=${encodeURIComponent(managerSubmissionId)}`;
		},
		[managerSubmissionId]
	);

	React.useEffect(() => {
		async function loadInstrument() {
			try {
				const data = await fetchInstrument();
				setInstrument(data);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Failed to load instrument.");
			}
		}

		void loadInstrument();
	}, []);

	React.useEffect(() => {
		if (!session) return;
		let cancelled = false;

		const loadAuditState = async () => {
			try {
				setLoading(true);
				setError(null);
				let nextDraft: YeeAuditDraft;
				if (variant === "manager-edit") {
					if (!auditId) {
						throw new Error("Manager audit ID is missing.");
					}
					if (managerSubmissionId) {
						const submission = await fetchSubmission(managerSubmissionId);
						if (cancelled) return;
						nextDraft = draftFromStoredRecord(placeId, {
							...submission,
							place_id: submission.place_id
						});
					} else {
						const state = await fetchManagerAuditEditState(auditId);
						if (cancelled) return;
						nextDraft = draftFromStoredRecord(placeId, state);
					}
				} else {
					const state = await fetchAuditState(placeId);
					if (cancelled) return;
					if (mode !== "submitted" && state.status === "SUBMITTED" && state.submission_id) {
						router.replace(`/yee/submissions/${state.submission_id}`);
						return;
					}
					nextDraft = draftFromAuditState(placeId, state);
				}
				setDraft(nextDraft);
				setResponses(nextDraft.responses);
				lastPersistedSnapshot.current = JSON.stringify({
					participant_info: buildParticipantInfo(nextDraft),
					responses: nextDraft.responses
				});
				hydratedRef.current = true;
			} catch (err) {
				if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load audit state.");
			} finally {
				if (!cancelled) setLoading(false);
			}
		};

		void loadAuditState();
		return () => {
			cancelled = true;
		};
	}, [auditId, managerSubmissionId, mode, placeId, router, session, variant]);

	// Keep a ref to the latest draft so saveDraftFn reads it at call-time, not at closure time.
	const draftRef = React.useRef(draft);
	React.useEffect(() => {
		draftRef.current = draft;
	}, [draft]);

	// Keep a ref to the latest session so it's always current inside the queue.
	const sessionRef = React.useRef(session);
	React.useEffect(() => {
		sessionRef.current = session;
	}, [session]);

	// Build the save function that the autosave queue will call sequentially.
	const saveDraftFn = React.useCallback(
		async (payload: DraftPayload) => {
			if (!sessionRef.current) return;
			const currentDraft = draftRef.current;
			if (variant === "manager-edit") {
				if (!auditId) throw new Error("Manager audit ID is missing.");
				await updateManagerAuditEditState(auditId, {
					submission_id: currentDraft.lastResult?.id ?? null,
					...payload,
					resubmit: false
				});
			} else {
				await saveAuditDraft(placeId, payload);
			}
			lastPersistedSnapshot.current = JSON.stringify(payload);
		},
		[auditId, placeId, variant]
	);

	const {
		saveStatus: autosaveStatus,
		lastSaveError: autosaveError,
		enqueue: enqueueSave
	} = useAutosaveQueue<DraftPayload>(saveDraftFn);

	// Derive a synchronous `persistCurrentDraft` for navigation guards that need
	// to flush before redirecting. It enqueues into the same queue so ordering
	// is still safe.
	const persistCurrentDraft = React.useCallback(
		async (currentDraft: YeeAuditDraft, currentResponses: ResponsesState) => {
			if (!session || !hydratedRef.current || mode === "submitted") return;
			const payload: DraftPayload = {
				participant_info: buildParticipantInfo(currentDraft),
				responses: currentResponses
			};
			const snapshot = JSON.stringify(payload);
			if (snapshot === lastPersistedSnapshot.current) return;
			enqueueSave(payload);
		},
		[enqueueSave, mode, session]
	);

	// Debounced autosave: enqueue 350 ms after any draft/response change.
	React.useEffect(() => {
		if (!session || !hydratedRef.current || mode === "submitted") return;
		const timer = window.setTimeout(() => {
			const payload: DraftPayload = {
				participant_info: buildParticipantInfo(draft),
				responses
			};
			const snapshot = JSON.stringify(payload);
			if (snapshot !== lastPersistedSnapshot.current) {
				enqueueSave(payload);
			}
		}, 350);
		return () => window.clearTimeout(timer);
	}, [draft, enqueueSave, mode, responses, session]);

	// Surface autosave errors to the existing error state. Applied during
	// render (not in an effect) to avoid a cascading re-render.
	const [prevAutosaveError, setPrevAutosaveError] = React.useState<string | null>(null);
	if (autosaveError !== prevAutosaveError) {
		setPrevAutosaveError(autosaveError);
		if (autosaveError) {
			setError(autosaveError);
		}
	}

	const persisting = autosaveStatus === "saving";

	const stepDetails = step ? yeeSteps.find(item => item.step === step) : null;
	const domainKey = step ? getDomainForStep(step) : null;
	const domainItems = React.useMemo(
		() =>
			instrument && domainKey ? filterItemsForDomain(instrument.scoring_items, yeeDomainLabels[domainKey]) : [],
		[domainKey, instrument]
	);
	const sectionMeta = React.useMemo(
		() => (instrument && domainKey ? findSectionMeta(instrument, yeeDomainLabels[domainKey]) : null),
		[domainKey, instrument]
	);
	const domainGroups = React.useMemo(() => groupInstrumentItems(domainItems), [domainItems]);
	const weatherSelections = React.useMemo(() => draft.weather.split("|").filter(Boolean), [draft.weather]);
	const stepPalette = getSurfacePalette(step ?? 1);

	const answeredDomainItems = domainGroups.reduce((sum, group) => {
		if (group.items.length === 1) return sum + getAnsweredPromptCountForItem(group.items[0], responses);
		const presenceItem = group.items.find(item => !isConditionItem(item)) ?? group.items[0];
		const conditionItem = group.items.find(item => isConditionItem(item)) ?? null;
		const choices = Object.keys(presenceItem.choices || {});
		return (
			sum +
			choices.reduce((rowSum, choiceId) => {
				const presenceValue = getSelectedMatrixAnswer(presenceItem.item_id, choiceId, responses);
				if (!presenceValue) return rowSum;
				if (!conditionItem || !isRowPositive(presenceItem, choiceId, responses)) return rowSum + 1;
				return getSelectedMatrixAnswer(conditionItem.item_id, choiceId, responses) ? rowSum + 1 : rowSum;
			}, 0)
		);
	}, 0);
	const requiredDomainItems = domainGroups.reduce((sum, group) => {
		if (group.items.length === 1) return sum + getPromptCountForItem(group.items[0]);
		const presenceItem = group.items.find(item => !isConditionItem(item)) ?? group.items[0];
		return sum + Math.max(Object.keys(presenceItem.choices || {}).length, 1);
	}, 0);

	const stepIsComplete = step && instrument ? isStepCompleteForData(step, draft, responses, instrument) : false;

	function updateDraft<K extends keyof YeeAuditDraft>(key: K, value: YeeAuditDraft[K]) {
		setDraft(prev => ({ ...prev, [key]: value }));
	}

	async function goToStep(nextStep: YeeStepNumber | null) {
		if (!nextStep) return;
		if (step && nextStep > step && !stepIsComplete) {
			const message = getIncompleteStepMessage(step);
			openConfirm({
				title: "Section not complete",
				description: `${message} Do you still want to move to the next page?`,
				variant: "default",
				onConfirm: async () => {
					setError(null);
					await persistCurrentDraft({ ...draft, responses }, responses);
					router.push(
						variant === "manager-edit" && basePath
							? buildManagerEditHref(`${basePath}/page/${nextStep}`)
							: `/yee/audit/${placeId}/page/${nextStep}`
					);
				}
			});
			return;
		}
		try {
			setError(null);
			await persistCurrentDraft({ ...draft, responses }, responses);
			if (step && nextStep > step) {
				posthog.capture("audit_step_advanced", {
					from_step: step,
					to_step: nextStep,
					place_id: placeId,
					step_label: getShortStepLabel(step)
				});
			}
			router.push(
				variant === "manager-edit" && basePath
					? buildManagerEditHref(`${basePath}/page/${nextStep}`)
					: `/yee/audit/${placeId}/page/${nextStep}`
			);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to save draft before moving to the next step.");
		}
	}

	async function openReview() {
		try {
			setError(null);
			if (!instrument) {
				setError("The YEE survey instrument is still loading. Please try again in a moment.");
				return;
			}
			if (!areAllRequiredSectionsComplete(draft, responses, instrument)) {
				const message = buildIncompleteSectionsMessage(draft, responses, instrument);
				setError(message);
				const firstIncompleteStep = getIncompleteSectionSteps(draft, responses, instrument)[0]?.step ?? null;
				openConfirm({
					title: "Audit incomplete",
					description: `${message} Would you like to go to the first incomplete section now?`,
					variant: "default",
					onConfirm: () => {
						if (firstIncompleteStep) {
							router.push(
								variant === "manager-edit" && basePath
									? buildManagerEditHref(`${basePath}/page/${firstIncompleteStep}`)
									: `/yee/audit/${placeId}/page/${firstIncompleteStep}`
							);
						}
					}
				});
				return;
			}
			await persistCurrentDraft({ ...draft, responses }, responses);
			posthog.capture("audit_review_opened", { place_id: placeId });
			router.push(
				variant === "manager-edit" && basePath
					? buildManagerEditHref(`${basePath}/review`)
					: `/yee/audit/${placeId}/review`
			);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to save draft before opening review.");
		}
	}

	const refreshScorePreview = React.useCallback(async () => {
		try {
			setPreviewLoading(true);
			setError(null);
			const preview = await fetchScorePreview(draft.placeId, buildParticipantInfo(draft), responses);
			setDraft(prev => ({ ...prev, scorePreview: preview }));
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to generate score preview.");
		} finally {
			setPreviewLoading(false);
		}
	}, [draft, responses]);

	React.useEffect(() => {
		if (mode !== "review") return;
		if (draft.scorePreview) return;
		if (!hydratedRef.current) return;
		void refreshScorePreview();
	}, [draft.scorePreview, mode, refreshScorePreview]);

	function submitAudit() {
		if (!instrument) {
			setError("The YEE survey instrument is still loading. Please try again in a moment.");
			return;
		}
		if (!areAllRequiredSectionsComplete(draft, responses, instrument)) {
			const message = buildIncompleteSectionsMessage(draft, responses, instrument);
			setError(message);
			const firstIncompleteStep = getIncompleteSectionSteps(draft, responses, instrument)[0]?.step ?? null;
			openConfirm({
				title: "Audit incomplete",
				description: `${message} Would you like to go to the first incomplete section now?`,
				variant: "default",
				onConfirm: () => {
					if (firstIncompleteStep) {
						router.push(
							variant === "manager-edit" && basePath
								? buildManagerEditHref(`${basePath}/page/${firstIncompleteStep}`)
								: `/yee/audit/${placeId}/page/${firstIncompleteStep}`
						);
					}
				}
			});
			return;
		}
		// Use destructive variant - submission is irreversible.
		openConfirm({
			title: "Submit audit",
			description: "Submit this audit now? After submission, you will not be able to edit the audit.",
			variant: "destructive",
			confirmLabel: "Submit",
			onConfirm: async () => {
				await doSubmitAudit();
			}
		});
	}

	async function doSubmitAudit() {
		setSubmitting(true);
		setError(null);
		try {
			const now = new Date();
			const finishTime = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
			const totalMinutes =
				draft.totalMinutes ||
				Math.max(
					1,
					Math.round((now.getTime() - new Date(`${draft.auditDate}T${draft.startTime}`).getTime()) / 60000) ||
						0
				);
			const submissionDraft = { ...draft, finishTime, totalMinutes };
			const participantInfo = buildParticipantInfo(submissionDraft);

			if (variant === "manager-edit") {
				if (!session || !auditId) {
					throw new Error("Manager audit editing is not available right now.");
				}
				const data = await updateManagerAuditEditState(auditId, {
					submission_id: draft.lastResult?.id ?? null,
					participant_info: participantInfo,
					responses,
					resubmit: true
				});
				setDraft({
					...submissionDraft,
					submittedAt: data.submitted_at,
					lastResult: data.submission_id
						? { id: data.submission_id, totalScore: data.score.total_score }
						: submissionDraft.lastResult,
					scorePreview: data.score
				});
				router.push(data.submission_id ? `/yee/submissions/${data.submission_id}` : "/manager/audits");
				return;
			}

			const payload = {
				place_id: draft.placeId,
				participant_info: participantInfo,
				responses
			};
			const response = await fetch("/api/yee/audits", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload)
			});
			const bodyText = await response.text();
			const data = bodyText ? (JSON.parse(bodyText) as Record<string, unknown>) : {};
			if (!response.ok) {
				const detail =
					typeof data.detail === "string"
						? data.detail
						: typeof data.error === "string"
							? data.error
							: `Submit failed (${response.status}).`;
				throw new Error(detail);
			}
			const scorePayload = typeof data.score === "object" && data.score ? (data.score as YeeScoreResult) : null;
			const submittedAt = typeof data.submitted_at === "string" ? data.submitted_at : now.toISOString();
			const nextDraft = {
				...submissionDraft,
				submittedAt,
				lastResult:
					typeof data.id === "string"
						? {
								id: data.id,
								totalScore: typeof scorePayload?.total_score === "number" ? scorePayload.total_score : 0
							}
						: draft.lastResult,
				scorePreview: scorePayload ?? draft.scorePreview
			};
			setDraft(nextDraft);
			posthog.capture("audit_submitted", {
				place_id: placeId,
				total_score: scorePayload?.total_score ?? null,
				total_minutes: submissionDraft.totalMinutes
			});
			router.push(`/yee/audit/${placeId}/submitted?submissionId=${encodeURIComponent(String(data.id))}`);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to submit audit.");
		} finally {
			setSubmitting(false);
		}
	}

	if (loading || !instrument) {
		return (
			<main className="mx-auto max-w-5xl p-6">
				<div className="space-y-4 animate-pulse">
					<div className="h-6 w-48 rounded-sm bg-muted" />
					<div className="h-4 w-full max-w-lg rounded-sm bg-muted" />
					<div className="h-4 w-full max-w-sm rounded-sm bg-muted" />
				</div>
			</main>
		);
	}

	if (error && !instrument) {
		return (
			<main className="mx-auto max-w-5xl p-6">
				<div
					className="rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
					role="alert">
					{error}
				</div>
			</main>
		);
	}

	if (mode === "submitted") {
		const submissionId = searchParams.get("submissionId") || draft.lastResult?.id || null;
		return (
			<SubmittedAuditConfirmation
				placeId={placeId}
				submissionId={submissionId}
				fallbackDraft={draft}
				error={error}
			/>
		);
	}

	const wizardSaveStatus: SaveStatusState =
		autosaveStatus === "saving"
			? "saving"
			: autosaveStatus === "idle" && autosaveError
				? "error"
				: autosaveStatus === "idle" && !autosaveError
					? "saved"
					: "idle";

	if (mode === "review") {
		const reviewSections = (Object.keys(yeeDomainLabels) as Array<keyof typeof yeeDomainLabels>).map(domain => ({
			domain,
			label: yeeDomainLabels[domain],
			step: getStepForDomainKey(domain),
			theme: getThemeByStep(getStepForDomainKey(domain)),
			groups: groupInstrumentItems(filterItemsForDomain(instrument.scoring_items, yeeDomainLabels[domain]))
				.map(group => ({
					group,
					title: getReviewQuestionTitle(group),
					rows: getReviewAnswerRows(group, responses)
				}))
				.filter(entry => entry.rows.length > 0)
		}));

		return (
			<>
				<main className="mx-auto max-w-5xl space-y-6 p-6">
					<Card>
						<CardHeader>
							<CardTitle className="text-2xl">Review and submit</CardTitle>
							<CardDescription>
								Review the saved answers for {draft.placeName || "this place"} before final submission.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="grid gap-4 md:grid-cols-2">
								<div className="rounded-md border border-border bg-muted/40 p-4 text-sm leading-7 text-foreground">
									<p className="font-medium text-foreground">Audit metadata</p>
									<p>Place: {draft.placeName || "Not recorded"}</p>
									<p>Generated auditor ID: {draft.auditorId}</p>
									<p>Participant ID: {draft.participantId || "Not provided"}</p>
									<p>Date: {draft.auditDate || "Not answered"}</p>
									<p>Start time: {draft.startTime || "Not answered"}</p>
									<p>Finish time: {draft.finishTime || "Will be recorded on submit"}</p>
									<p>Total minutes: {draft.totalMinutes || "Will be calculated on submit"}</p>
									<p>
										Visit frequency: {getOptionLabel(visitFrequencyOptions, draft.visitFrequency)}
									</p>
									<p>Season: {getOptionLabel(seasonOptions, draft.season)}</p>
									<p>Weather: {getMultiOptionLabels(weatherOptions, draft.weather)}</p>
								</div>
								<div className="rounded-md border border-border bg-muted/40 p-4 text-sm text-foreground">
									<p className="font-medium text-foreground">Youth-Weighted Importance of Sections</p>
									<div className="mt-3 space-y-3">
										{(Object.keys(yeeDomainLabels) as YeeDomainKey[]).map(key => {
											const theme = getThemeByStep(getStepForDomainKey(key));
											return (
												<div
													key={key}
													className="flex flex-col gap-2 rounded-md border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
													style={{
														backgroundColor: theme?.lightHex ?? "#f8fafc",
														borderColor: theme?.strongFillHex ?? "#cbd5e1"
													}}>
													<p
														className="font-semibold"
														style={{ color: theme?.strongHex ?? "#0f172a" }}>
														{yeeDomainLabels[key]}
													</p>
													<span
														className="inline-flex max-w-full rounded-full border px-3 py-1 text-sm font-semibold"
														style={{
															backgroundColor: theme?.strongFillHex ?? "#e2e8f0",
															borderColor: theme?.strongHex ?? "#94a3b8",
															color: theme?.strongHex ?? "#0f172a"
														}}>
														{getOptionLabel(yeeWeightOptions, draft.weights[key])}
													</span>
												</div>
											);
										})}
									</div>
									<div className="mt-4 rounded-md border border-dashed border-border bg-background p-3 leading-7">
										<p className="font-medium text-foreground">Weighting comments</p>
										<p className="mt-2">
											{draft.weightingComments || "No weighting comments added."}
										</p>
									</div>
								</div>
							</div>
							<div className="rounded-md border border-border bg-muted/40 p-4">
								<p className="text-sm font-medium text-foreground">Audit overview</p>
								<p className="mt-2 text-sm text-slate-600">
									Choose any section below to jump back into that part of the audit and edit it before
									submission.
								</p>
								<div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
									{reviewSections.map(section => (
										<button
											key={`jump-${section.domain}`}
											type="button"
											onClick={() => void goToStep(section.step)}
											className={`rounded-md border px-4 py-4 text-left transition hover:opacity-90 ${section.theme?.card ?? "border-border bg-muted/30"}`}>
											<p
												className={`font-semibold text-sm ${section.theme?.textClass ?? "text-foreground"}`}>
												{section.label}
											</p>
											<p className="mt-1.5 text-xs text-muted-foreground">
												{section.groups.length} answered question group
												{section.groups.length === 1 ? "" : "s"}
											</p>
										</button>
									))}
								</div>
							</div>
							<div className="space-y-4">
								{reviewSections.map(section => (
									<Card key={section.domain} elevation="flat" className={section.theme?.card ?? ""}>
										<CardHeader className="pb-3">
											<CardTitle
												className={`text-base ${section.theme?.textClass ?? "text-foreground"}`}>
												{section.label}
											</CardTitle>
											<CardDescription>
												{section.groups.length > 0
													? `${section.groups.length} answered question group${section.groups.length === 1 ? "" : "s"} saved for review.`
													: "No saved answers yet for this section."}
											</CardDescription>
										</CardHeader>
										<CardContent className="space-y-4">
											{section.groups.map(({ group, title, rows }) => (
												<div
													key={group.baseQuestionId}
													className="rounded-md border border-border bg-card p-4">
													{title ? (
														<p className="text-sm font-semibold text-foreground">{title}</p>
													) : null}
													<div
														className={`space-y-4 text-sm text-muted-foreground ${title ? "mt-3" : ""}`}>
														{rows.map((row, index) => (
															<div
																key={`${group.baseQuestionId}-${index}`}
																className="space-y-2">
																<p className="font-medium text-foreground">
																	{row.prompt}
																</p>
																<div className="pl-4">
																	<span
																		className={`inline-flex rounded-full border px-3 py-0.5 text-xs font-semibold ${section.theme?.condition ?? "border-border bg-muted text-foreground"}`}>
																		{row.response}
																	</span>
																	{row.condition ? (
																		<div className="mt-2 pl-4">
																			<p className="text-xs font-medium text-muted-foreground">
																				Condition
																			</p>
																			<span
																				className={`mt-1.5 inline-flex rounded-full border px-3 py-0.5 text-xs font-semibold ${section.theme?.condition ?? "border-border bg-muted text-foreground"}`}>
																				{row.condition}
																			</span>
																		</div>
																	) : null}
																</div>
															</div>
														))}
													</div>
												</div>
											))}
											<div className="rounded-md border border-dashed border-border bg-background p-4 text-sm text-muted-foreground">
												<p className="font-medium text-foreground">{section.label} comments</p>
												<p className="mt-2">
													{draft.sectionComments[section.domain] ||
														"No section comments added."}
												</p>
											</div>
										</CardContent>
									</Card>
								))}
							</div>
							<div className="rounded-md border border-border p-4">
								<p className="text-sm font-medium text-foreground">Overall comments</p>
								<p className="mt-2 text-sm text-muted-foreground">
									{draft.comments || "No comments added."}
								</p>
							</div>
							{draft.scorePreview ? (
								<YeeScoreSummary
									score={draft.scorePreview}
									title="Score preview"
									description="This preview is based on the saved draft answers and shows both raw scores and Youth Weighted average views."
								/>
							) : (
								<Card elevation="flat">
									<CardContent className="py-6 text-sm text-muted-foreground">
										{previewLoading
											? "Generating score preview..."
											: "Score preview has not been generated yet."}
									</CardContent>
								</Card>
							)}
							<div className="flex flex-wrap gap-3">
								<Button asChild variant="outline">
									<Link
										href={
											variant === "manager-edit" && basePath
												? buildManagerEditHref(`${basePath}/page/1`)
												: `/yee/audit/${placeId}/page/1`
										}>
										Edit audit
									</Link>
								</Button>
								<Button
									type="button"
									variant="outline"
									isLoading={previewLoading}
									onClick={() => void refreshScorePreview()}>
									{previewLoading ? "Recalculating..." : "Recalculate score preview"}
								</Button>
								<Button type="button" isLoading={submitting} onClick={() => void submitAudit()}>
									{submitting ? "Submitting..." : "Submit audit"}
								</Button>
							</div>
							<p className="text-xs text-muted-foreground">
								Use &ldquo;Recalculate score preview&rdquo; after changing answers or section weights.
							</p>
							<div className="flex items-center gap-2">
								<AuditSaveStatus status={wizardSaveStatus} />
								{persisting ? (
									<span className="text-xs text-muted-foreground">Saving latest answers...</span>
								) : null}
							</div>
							{error ? (
								<p
									role="alert"
									aria-live="polite"
									className="rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
									{error}
								</p>
							) : null}
						</CardContent>
					</Card>
				</main>
				<ConfirmDialog
					open={confirmState.open}
					onOpenChange={open => setConfirmState(prev => ({ ...prev, open }))}
					title={confirmState.title}
					description={confirmState.description}
					variant={confirmState.variant}
					onConfirm={confirmState.onConfirm}
				/>
			</>
		);
	}

	return (
		<>
			<main className="mx-auto max-w-5xl space-y-6 p-6">
				<header className="space-y-3">
					<div className="flex flex-wrap items-center justify-between gap-2">
						<div className="flex flex-wrap items-center gap-2">
							<Badge variant="success" dot>
								{draft.auditorId}
							</Badge>
							<Badge variant="secondary">Step {step} of 9</Badge>
							<Badge variant="secondary">{draft.placeName || "Selected place"}</Badge>
						</div>
						<AuditSaveStatus status={wizardSaveStatus} />
					</div>
					<h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
						{stepDetails?.title}
					</h1>
					{stepDetails?.description ? (
						<p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
							{stepDetails.description}
						</p>
					) : null}
				</header>

				<div
					className="grid gap-1.5 sm:grid-cols-3 lg:grid-cols-5"
					role="navigation"
					aria-label="Audit step navigation">
					{yeeSteps.map(entry => (
						<button
							key={entry.step}
							type="button"
							onClick={() => void goToStep(entry.step)}
							disabled={step === entry.step}
							aria-current={step === entry.step ? "step" : undefined}
							className={`rounded-md border px-3 py-2.5 text-left text-xs font-medium transition-colors ${
								step === entry.step
									? "border-[var(--yee-green-600)] bg-[var(--yee-green-100)] text-[var(--yee-green-900)]"
									: "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
							}`}>
							<span className="block font-semibold">{getShortStepLabel(entry.step)}</span>
						</button>
					))}
				</div>

				{step === 1 ? (
					<Card>
						<CardHeader>
							<CardTitle>Visit details</CardTitle>
							<CardDescription>
								Record the visit context for {draft.placeName || "this place"} before moving into
								importance weighting and domain questions.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="grid gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="auditor-id">Generated auditor ID</Label>
									<Input id="auditor-id" value={draft.auditorId} readOnly />
								</div>
								<div className="space-y-2">
									<Label htmlFor="audit-date">Audit date</Label>
									<Input
										id="audit-date"
										type="date"
										value={draft.auditDate}
										onChange={event => updateDraft("auditDate", event.target.value)}
									/>
								</div>
							</div>
							<div className="space-y-2">
								<Label htmlFor="participant-id">Participant ID</Label>
								<Input
									id="participant-id"
									value={draft.participantId}
									onChange={event => updateDraft("participantId", event.target.value)}
									placeholder="Optional"
								/>
								<p className="text-xs text-muted-foreground">
									Optional — links this audit to a study or workshop participant.
								</p>
							</div>
							<div className="space-y-3">
								<Label>
									How often have you been to / visited this space in the last 6 months? (choose the
									response that fits best)
								</Label>
								<OptionCards
									name="visit-frequency"
									value={draft.visitFrequency}
									onChange={value => updateDraft("visitFrequency", value)}
									options={visitFrequencyOptions}
									columns={1}
									palette={stepPalette}
								/>
							</div>
							<div className="space-y-3">
								<Label>What is the current season?</Label>
								<OptionCards
									name="season"
									value={draft.season}
									onChange={value => updateDraft("season", value)}
									options={seasonOptions}
									columns={1}
									palette={stepPalette}
								/>
							</div>
							<div className="space-y-3">
								<Label>What is the weather like today? (choose all that apply)</Label>
								<MultiSelectCards
									name="weather"
									value={weatherSelections}
									onChange={values =>
										updateDraft(
											"weather",
											weatherOptions
												.filter(option => values.includes(option.value))
												.map(option => option.value)
												.join("|")
										)
									}
									options={weatherOptions}
									palette={stepPalette}
								/>
							</div>
						</CardContent>
					</Card>
				) : null}

				{step === 2 ? (
					<div className="space-y-4">
						<Card className={`rounded-md border shadow-sm ${stepPalette.instruction}`}>
							<CardContent className="py-5 text-sm leading-7 text-white">
								<p className="font-medium text-white">
									Please start by telling us how important each of the following issues are to you -
									especially about the play/recreation and green spaces in your community or
									neighborhood
								</p>
								<p className="mt-2 text-white/90">
									These answers are also used later to calculate Youth Weighted averages alongside the
									raw section scores for {draft.placeName || "this place"}.
								</p>
							</CardContent>
						</Card>
						{Object.entries(yeeDomainLabels).map(([key, label]) => (
							<Card
								key={key}
								className={`rounded-md shadow-sm ${
									getSurfacePalette(
										key === "access"
											? 3
											: key === "activitySpaces"
												? 4
												: key === "amenities"
													? 5
													: key === "experienceOfSpace"
														? 6
														: key === "aestheticsAndCare"
															? 7
															: 8
									).card
								}`}>
								<CardHeader>
									<CardTitle className="text-lg font-semibold">{label}</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<p className="text-sm font-medium text-slate-900">
										{ensureQuestionMark(formatExampleText(getWeightingPrompt(key as YeeDomainKey)))}
									</p>
									<OptionCards
										name={`weight-${key}`}
										value={draft.weights[key as keyof typeof draft.weights]}
										onChange={value =>
											setDraft(prev => ({
												...prev,
												weights: {
													...prev.weights,
													[key]: value
												}
											}))
										}
										options={yeeWeightOptions}
										palette={getSurfacePalette(
											key === "access"
												? 3
												: key === "activitySpaces"
													? 4
													: key === "amenities"
														? 5
														: key === "experienceOfSpace"
															? 6
															: key === "aestheticsAndCare"
																? 7
																: 8
										)}
									/>
								</CardContent>
							</Card>
						))}
						<Card className="rounded-md border-slate-200/80 bg-white shadow-sm">
							<CardHeader>
								<CardTitle>Optional comments for importance weighting</CardTitle>
								<CardDescription>
									Add any notes about how you answered the importance weighting section.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<Textarea
									value={draft.weightingComments}
									onChange={event => updateDraft("weightingComments", event.target.value)}
									placeholder="Optional notes about your weighting choices..."
									className="min-h-28"
								/>
							</CardContent>
						</Card>
					</div>
				) : null}

				{step && step >= 3 && step <= 8 ? (
					<div className="space-y-4">
						{domainKey ? (
							<Card className={`rounded-md border shadow-sm ${stepPalette.instruction}`}>
								<CardContent className="py-5 text-sm leading-7 text-white">
									<p className="text-lg font-semibold text-white">
										{getSectionIntroCopy(domainKey).heading}
									</p>
									<div className="mt-2">{getSectionIntroCopy(domainKey).body}</div>
								</CardContent>
							</Card>
						) : null}
						{domainGroups.map(group => (
							<InstrumentQuestionGroupCard
								key={group.baseQuestionId}
								group={group}
								responses={responses}
								setResponses={setResponses}
								palette={stepPalette}
							/>
						))}
						{domainKey ? (
							<Card className="rounded-md border-slate-200/80 bg-white shadow-sm">
								<CardHeader>
									<CardTitle>{yeeDomainLabels[domainKey]} comments</CardTitle>
									<CardDescription>
										{sectionMeta?.comment_prompt ||
											`Add any optional notes for the ${yeeDomainLabels[domainKey]} section.`}
									</CardDescription>
								</CardHeader>
								<CardContent>
									<Textarea
										value={draft.sectionComments[domainKey]}
										onChange={event =>
											setDraft(prev => ({
												...prev,
												sectionComments: {
													...prev.sectionComments,
													[domainKey]: event.target.value
												}
											}))
										}
										placeholder={
											sectionMeta?.comment_prompt ||
											`Optional notes about ${yeeDomainLabels[domainKey].toLowerCase()} in this place...`
										}
										className="min-h-28"
									/>
								</CardContent>
							</Card>
						) : null}
						<Card className={`rounded-md border shadow-sm ${stepPalette.progress}`}>
							<CardContent className="flex flex-wrap items-center justify-between gap-3 py-5 text-sm text-slate-600">
								<span>
									Section progress: {answeredDomainItems} of {requiredDomainItems} questions answered
								</span>
								<span>
									{requiredDomainItems === 0
										? "Informational section"
										: stepIsComplete
											? "Complete"
											: "In progress"}
								</span>
							</CardContent>
						</Card>
					</div>
				) : null}

				{step === 9 ? (
					<Card className="rounded-md border-slate-200/80 bg-white shadow-sm">
						<CardHeader>
							<CardTitle>Final optional comments</CardTitle>
							<CardDescription>
								Add any overall notes you want included before the review screen.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Textarea
								value={draft.comments}
								onChange={event => updateDraft("comments", event.target.value)}
								placeholder="Share any additional thoughts about the space..."
								className="min-h-32"
							/>
						</CardContent>
					</Card>
				) : null}

				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="flex gap-3">
						<Button
							type="button"
							variant="outline"
							onClick={() => void goToStep(getPreviousStep(step!))}
							disabled={!step || !getPreviousStep(step)}>
							Back
						</Button>
						<Button
							type="button"
							variant="ghost"
							onClick={async () => {
								try {
									if (variant === "manager-edit") {
										if (!session || !auditId) {
											throw new Error("Manager audit editing is not available right now.");
										}
										await updateManagerAuditEditState(auditId, {
											submission_id: draft.lastResult?.id ?? null,
											participant_info: buildParticipantInfo(draft),
											responses,
											resubmit: false
										});
									} else {
										await persistCurrentDraft(draft, responses);
									}
									posthog.capture("audit_saved_and_exited", {
										place_id: placeId,
										current_step: step ?? null,
										variant
									});
									router.push(exitHref);
								} catch (err) {
									setError(
										err instanceof Error ? err.message : "Failed to save draft before exiting."
									);
								}
							}}>
							{variant === "manager-edit" ? "Save changes and exit" : "Save and exit"}
						</Button>
					</div>
					{step && step < 9 ? (
						<Button type="button" className="" onClick={() => void goToStep(getNextStep(step))}>
							Next
						</Button>
					) : (
						<Button type="button" className="" onClick={() => void openReview()}>
							{variant === "manager-edit" ? "Review Audit Changes" : "Review Audit"}
						</Button>
					)}
				</div>
				{!stepIsComplete ? <p className="text-sm text-amber-700">{getIncompleteStepMessage(step)}</p> : null}
				{error ? <p className="text-sm text-red-700">{error}</p> : null}
			</main>
			<ConfirmDialog
				open={confirmState.open}
				onOpenChange={open => setConfirmState(prev => ({ ...prev, open }))}
				title={confirmState.title}
				description={confirmState.description}
				variant={confirmState.variant}
				onConfirm={confirmState.onConfirm}
			/>
		</>
	);
}

function SubmittedAuditConfirmation({
	placeId,
	submissionId,
	fallbackDraft,
	error
}: {
	placeId: string;
	submissionId: string | null;
	fallbackDraft: YeeAuditDraft;
	error: string | null;
}) {
	const { session } = useAuth();
	const [submission, setSubmission] = React.useState<YeeSubmissionRecord | null>(null);
	const [loading, setLoading] = React.useState(true);
	const [loadError, setLoadError] = React.useState<string | null>(error);

	// Without a session or submission id there is nothing to fetch — settle the
	// loading flag during render instead of in the effect.
	if ((!session || !submissionId) && loading) {
		setLoading(false);
	}

	React.useEffect(() => {
		if (!session || !submissionId) {
			return;
		}
		let cancelled = false;
		const run = async () => {
			try {
				const record = await fetchSubmission(submissionId);
				if (!cancelled) setSubmission(record);
			} catch (err) {
				if (!cancelled) setLoadError(err instanceof Error ? err.message : "Failed to load submitted audit.");
			} finally {
				if (!cancelled) setLoading(false);
			}
		};
		void run();
		return () => {
			cancelled = true;
		};
	}, [session, submissionId]);

	const submittedAt = submission?.submitted_at || fallbackDraft.submittedAt;
	const totalScore = submission?.score.total_score ?? fallbackDraft.lastResult?.totalScore ?? 0;

	return (
		<main className="mx-auto max-w-4xl space-y-6 p-6">
			<Card className="rounded-md border-slate-200/80 bg-white shadow-sm">
				<CardHeader>
					<CardTitle className="text-3xl">Audit submitted</CardTitle>
					<CardDescription>
						This audit is now locked. Use the read-only results page to review scores and metadata.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4 text-sm leading-7 text-slate-600">
					<p>Place: {submission?.place_name || placeId}</p>
					<p>Auditor ID: {submission?.auditor_generated_id || fallbackDraft.auditorId}</p>
					<p>
						Submitted at:{" "}
						{submittedAt ? new Date(submittedAt).toLocaleString() : "Submission timestamp unavailable"}
					</p>
					<div className="rounded-md bg-emerald-50 p-4 text-emerald-800">
						<p className="font-medium">
							Submission ID: {submission?.id || fallbackDraft.lastResult?.id || "Unavailable"}
						</p>
						<p className="mt-1">Total score: {totalScore}</p>
					</div>
					<div className="flex flex-wrap gap-3">
						<Button asChild>
							<Link href="/auditor">Back to dashboard</Link>
						</Button>
						{submissionId ? (
							<Button asChild variant="outline">
								<Link href={`/yee/submissions/${submissionId}`}>Open read-only results</Link>
							</Button>
						) : null}
					</div>
					{loading ? <FormSkeleton rows={4} /> : null}
					{loadError ? <p className="text-red-700">{loadError}</p> : null}
				</CardContent>
			</Card>
		</main>
	);
}
