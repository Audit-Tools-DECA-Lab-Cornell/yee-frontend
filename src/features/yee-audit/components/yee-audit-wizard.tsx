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
import { getThemeByStep, yeeDomainThemes } from "@/features/yee-audit/config/yee-domain-theme";
import {
	fetchInstrument,
	findSectionMeta,
	resolveFinalCommentsPrompt,
	resolveWeightingDescription,
	resolveWeightingDomainPrompt,
	resolveWeightingOptions,
	resolveWeightingTitle,
	type InstrumentStamp,
	type InstrumentResponse
} from "@/features/yee-audit/api/yee-instrument";
import {
	getConditionAnswer,
	getPrimaryAnswer,
	isLogicalQuestionAnswered,
	isLogicalQuestionComplete,
	logicalQuestionsForSection,
	shouldShowLogicalFollowUp,
	type InstrumentLogicalQuestion
} from "@/features/yee-audit/api/yee-logical-questions";
import { fetchScorePreview } from "@/features/yee-audit/scoring/yee-scoring";
import { useAutosaveQueue } from "@/features/yee-audit/state/autosave-queue";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormSkeleton } from "@/components/ui/skeletons";

type ResponsesState = Record<string, string | Record<string, string>>;

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

function logicalOptionLabel(options: { id: string; label: string }[], answerId: string): string {
	return options.find(option => option.id === answerId)?.label ?? answerId;
}

function getReviewAnswer(question: InstrumentLogicalQuestion, responses: ResponsesState) {
	const primaryAnswerId = getPrimaryAnswer(question, responses);
	if (!primaryAnswerId) return null;
	const conditionAnswerId = getConditionAnswer(question, responses);
	return {
		prompt: normalizeVisibleQuestion(question.prompt),
		response: logicalOptionLabel(question.primaryOptions, primaryAnswerId),
		condition: conditionAnswerId ? logicalOptionLabel(question.followUpOptions, conditionAnswerId) : ""
	};
}

function readInstrumentStamp(record: {
	instrument_key?: string | null;
	instrument_version?: string | null;
}): InstrumentStamp | null {
	return record.instrument_key && record.instrument_version
		? { instrumentKey: record.instrument_key, instrumentVersion: record.instrument_version }
		: null;
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

/**
 * Surface treatment for one wizard step.
 *
 * Domain steps (3-8) wear that domain's colours, straight from `yeeDomainThemes`
 * — the only place a domain colour is ever chosen. Every other step (context,
 * weighting, final comments) stays on the brand-neutral base, matching how
 * yee-mobile's `getSurveyPalette()` treats its non-domain steps: the colour on
 * screen means "which domain am I in", so spending hues on the steps that have
 * no domain would make that signal meaningless.
 */
const neutralSurfacePalette = {
	card: "border-border bg-muted/30",
	inner: "border-border bg-background/50",
	selected: "border-2 border-[var(--yee-green-600)] bg-[var(--yee-green-50)] text-[var(--yee-green-900)]",
	idle: "border-border bg-background text-foreground hover:bg-muted",
	instruction: "border-border bg-muted text-foreground",
	progress: "border-border bg-muted/50",
	condition: "border-border bg-muted"
} as const;

function getSurfacePalette(stepValue: YeeStepNumber) {
	const theme = getThemeByStep(stepValue);
	if (!theme) return neutralSurfacePalette;
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

/**
 * Wording used only when the instrument does not supply a prompt for this
 * domain. The instrument is the source of truth — see
 * `resolveWeightingDomainPrompt`; this keeps older versions rendering.
 */
function getFallbackWeightingPrompt(domain: YeeDomainKey) {
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
	const questions = logicalQuestionsForSection(instrument, domain, yeeDomainLabels[domain]);
	return questions.every(question => isLogicalQuestionComplete(question, responses));
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

function InstrumentLogicalQuestionCard({
	question,
	responses,
	setResponses,
	palette
}: {
	question: InstrumentLogicalQuestion;
	responses: ResponsesState;
	setResponses: React.Dispatch<React.SetStateAction<ResponsesState>>;
	palette: ReturnType<typeof getSurfacePalette>;
}) {
	const selectedPrimary = getPrimaryAnswer(question, responses);
	const selectedCondition = getConditionAnswer(question, responses);
	const showFollowUp = shouldShowLogicalFollowUp(question, responses);

	function updatePrimary(answerId: string) {
		setResponses(prev => {
			if (question.binding.mode === "single") {
				return { ...prev, [question.binding.presenceItemId]: answerId };
			}
			const existing = prev[question.binding.presenceItemId];
			const matrix = typeof existing === "object" && existing ? { ...existing } : {};
			matrix[question.binding.choiceId] = answerId;
			return { ...prev, [question.binding.presenceItemId]: matrix };
		});
	}

	function updateCondition(answerId: string) {
		const binding = question.binding;
		if (binding.mode !== "matrix" || binding.conditionItemId === null) return;
		setResponses(prev => {
			const existing = prev[binding.conditionItemId!];
			const matrix = typeof existing === "object" && existing ? { ...existing } : {};
			matrix[binding.choiceId] = answerId;
			return { ...prev, [binding.conditionItemId!]: matrix };
		});
	}

	return (
		<Card className={`rounded-md border shadow-[0_18px_40px_-30px_rgba(16,35,31,0.55)] ${palette.card}`}>
			<CardHeader className="pb-3">
				<CardTitle className="text-base font-semibold">{normalizeVisibleQuestion(question.prompt)}</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<OptionCards
					name={question.key}
					value={selectedPrimary}
					onChange={updatePrimary}
					options={question.primaryOptions.map(option => ({ value: option.id, label: option.label }))}
					palette={palette}
				/>
				{showFollowUp && question.followUpPrompt ? (
					<div className={`space-y-2 rounded-md border p-4 ${palette.condition}`}>
						<p className="text-sm font-medium text-foreground">{question.followUpPrompt}</p>
						{question.conditionRequiredWhenShown ? (
							<p className="text-xs text-muted-foreground">Required when shown</p>
						) : null}
						<OptionCards
							name={`${question.key}-condition`}
							value={selectedCondition}
							onChange={updateCondition}
							options={question.followUpOptions.map(option => ({
								value: option.id,
								label: option.label
							}))}
							palette={palette}
						/>
					</div>
				) : null}
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
	const [instrumentStamp, setInstrumentStamp] = React.useState<InstrumentStamp | null | undefined>(undefined);
	// Auditor-facing copy authored in the instrument and editable from the admin
	// Audit Copy tab, with a fallback for instrument versions that predate each
	// key. Resolve every string exactly once here and use these values at every
	// render site — the questionnaire and the review screen must never resolve
	// the same string independently, or they drift apart.
	const weightingOptions = resolveWeightingOptions(instrument, yeeWeightOptions);
	const weightingTitle = resolveWeightingTitle(instrument, "Youth-Weighted Importance");
	const weightingDescription = resolveWeightingDescription(
		instrument,
		"Please start by telling us how important each of the following issues are to you - especially about the play/recreation and green spaces in your community or neighborhood"
	);
	const weightingDomainPrompts = Object.fromEntries(
		(Object.keys(yeeDomainLabels) as YeeDomainKey[]).map(key => [
			key,
			resolveWeightingDomainPrompt(instrument, key, getFallbackWeightingPrompt(key))
		])
	) as Record<YeeDomainKey, string>;
	const finalCommentsPrompt = resolveFinalCommentsPrompt(instrument, "Final optional comments");
	const [draft, setDraft] = React.useState<YeeAuditDraft>(() => createDefaultDraft(placeId));
	const [responses, setResponses] = React.useState<ResponsesState>({});
	const [loading, setLoading] = React.useState(true);
	const [submitting, setSubmitting] = React.useState(false);
	const [previewLoading, setPreviewLoading] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);
	const hydratedRef = React.useRef(false);
	const instrumentStampFields = React.useMemo(
		() =>
			instrumentStamp
				? {
						instrument_key: instrumentStamp.instrumentKey,
						instrument_version: instrumentStamp.instrumentVersion
					}
				: {},
		[instrumentStamp]
	);

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

	const openConfirm = React.useCallback(
		(opts: Omit<ConfirmState, "open">) => {
			setConfirmState({ ...opts, open: true });
		},
		[setConfirmState]
	);
	const lastPersistedSnapshot = React.useRef<string | null>(null);
	const managerSubmissionId = variant === "manager-edit" ? searchParams.get("submissionId") : null;

	// Serialised snapshot type threaded through the autosave queue.
	type DraftPayload = {
		participant_info: Record<string, unknown>;
		responses: ResponsesState;
		instrument_key?: string;
		instrument_version?: string;
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
			if (instrumentStamp === undefined) return;
			try {
				const data = await fetchInstrument(instrumentStamp);
				setInstrument(data);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Failed to load instrument.");
			}
		}

		void loadInstrument();
	}, [instrumentStamp]);

	React.useEffect(() => {
		if (!session) return;
		let cancelled = false;

		const loadAuditState = async () => {
			try {
				setLoading(true);
				setError(null);
				let nextDraft: YeeAuditDraft;
				let nextStamp: InstrumentStamp | null;
				if (variant === "manager-edit") {
					if (!auditId) {
						throw new Error("Manager audit ID is missing.");
					}
					if (managerSubmissionId) {
						const submission = await fetchSubmission(managerSubmissionId);
						if (cancelled) return;
						nextStamp = readInstrumentStamp(submission);
						nextDraft = draftFromStoredRecord(placeId, {
							...submission,
							place_id: submission.place_id
						});
					} else {
						const state = await fetchManagerAuditEditState(auditId);
						if (cancelled) return;
						nextStamp = readInstrumentStamp(state);
						nextDraft = draftFromStoredRecord(placeId, state);
					}
				} else {
					const state = await fetchAuditState(placeId);
					if (cancelled) return;
					nextStamp = readInstrumentStamp(state);
					if (mode !== "submitted" && state.status === "SUBMITTED" && state.submission_id) {
						router.replace(`/yee/submissions/${state.submission_id}`);
						return;
					}
					nextDraft = draftFromAuditState(placeId, state);
				}
				setInstrumentStamp(nextStamp);
				setDraft(nextDraft);
				setResponses(nextDraft.responses);
				lastPersistedSnapshot.current = JSON.stringify({
					participant_info: buildParticipantInfo(nextDraft),
					responses: nextDraft.responses,
					...(nextStamp
						? { instrument_key: nextStamp.instrumentKey, instrument_version: nextStamp.instrumentVersion }
						: {})
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
				responses: currentResponses,
				...instrumentStampFields
			};
			const snapshot = JSON.stringify(payload);
			if (snapshot === lastPersistedSnapshot.current) return;
			enqueueSave(payload);
		},
		[enqueueSave, instrumentStampFields, mode, session]
	);

	// Debounced autosave: enqueue 350 ms after any draft/response change.
	React.useEffect(() => {
		if (!session || !hydratedRef.current || mode === "submitted") return;
		const timer = window.setTimeout(() => {
			const payload: DraftPayload = {
				participant_info: buildParticipantInfo(draft),
				responses,
				...instrumentStampFields
			};
			const snapshot = JSON.stringify(payload);
			if (snapshot !== lastPersistedSnapshot.current) {
				enqueueSave(payload);
			}
		}, 350);
		return () => window.clearTimeout(timer);
	}, [draft, enqueueSave, instrumentStampFields, mode, responses, session]);

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
	const domainQuestions = React.useMemo(
		() =>
			instrument && domainKey
				? logicalQuestionsForSection(instrument, domainKey, yeeDomainLabels[domainKey])
				: [],
		[domainKey, instrument]
	);
	const sectionMeta = React.useMemo(
		() => (instrument && domainKey ? findSectionMeta(instrument, yeeDomainLabels[domainKey]) : null),
		[domainKey, instrument]
	);
	const weatherSelections = React.useMemo(() => draft.weather.split("|").filter(Boolean), [draft.weather]);
	const stepPalette = getSurfacePalette(step ?? 1);

	const answeredDomainItems = domainQuestions.filter(question =>
		isLogicalQuestionAnswered(question, responses)
	).length;
	const requiredDomainItems = domainQuestions.length;
	const requiredFollowUpsRemaining = domainQuestions.filter(
		question =>
			shouldShowLogicalFollowUp(question, responses) &&
			question.conditionRequiredWhenShown &&
			!getConditionAnswer(question, responses)
	).length;

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
			const preview = await fetchScorePreview(
				draft.placeId,
				buildParticipantInfo(draft),
				responses,
				instrumentStamp ?? null
			);
			setDraft(prev => ({ ...prev, scorePreview: preview }));
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to generate score preview.");
		} finally {
			setPreviewLoading(false);
		}
	}, [draft, instrumentStamp, responses, setPreviewLoading, setError, setDraft]);

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
				responses,
				...instrumentStampFields
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
			questions: logicalQuestionsForSection(instrument, domain, yeeDomainLabels[domain])
				.map(question => ({ question, answer: getReviewAnswer(question, responses) }))
				.filter(
					(
						entry
					): entry is {
						question: InstrumentLogicalQuestion;
						answer: NonNullable<ReturnType<typeof getReviewAnswer>>;
					} => entry.answer !== null
				)
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
									<p className="font-medium text-foreground">{weightingTitle}</p>
									<div className="mt-3 space-y-3">
										{(Object.keys(yeeDomainLabels) as YeeDomainKey[]).map(key => {
											const theme = yeeDomainThemes[key];
											return (
												<div
													key={key}
													className="flex flex-col gap-2 rounded-md border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
													style={{
														backgroundColor: theme.lightHex,
														borderColor: theme.strongHex
													}}>
													<p className="font-semibold" style={{ color: theme.textHex }}>
														{yeeDomainLabels[key]}
													</p>
													<span
														className="inline-flex max-w-full rounded-full border px-3 py-1 text-sm font-semibold"
														style={{
															backgroundColor: theme.lightHex,
															borderColor: theme.strongHex,
															color: theme.textHex
														}}>
														{getOptionLabel(weightingOptions, draft.weights[key])}
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
								<p className="mt-2 text-sm text-muted-foreground">
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
												{section.questions.length} answered question
												{section.questions.length === 1 ? "" : "s"}
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
												{section.questions.length > 0
													? `${section.questions.length} answered question${section.questions.length === 1 ? "" : "s"} saved for review.`
													: "No saved answers yet for this section."}
											</CardDescription>
										</CardHeader>
										<CardContent className="space-y-4">
											{section.questions.map(({ question, answer }) => (
												<div
													key={question.key}
													className="rounded-md border border-border bg-card p-4">
													<p className="font-medium text-foreground">{answer.prompt}</p>
													<div className="pl-4">
														<span
															className={`inline-flex rounded-full border px-3 py-0.5 text-xs font-semibold ${section.theme?.condition ?? "border-border bg-muted text-foreground"}`}>
															{answer.response}
														</span>
														{answer.condition ? (
															<div className="mt-2 pl-4">
																<p className="text-xs font-medium text-muted-foreground">
																	{question.followUpPrompt}
																</p>
																<span
																	className={`mt-1.5 inline-flex rounded-full border px-3 py-0.5 text-xs font-semibold ${section.theme?.condition ?? "border-border bg-muted text-foreground"}`}>
																	{answer.condition}
																</span>
															</div>
														) : null}
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
								<p className="text-sm font-medium text-foreground">{finalCommentsPrompt}</p>
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
									? "border-(--yee-green-600) bg-(--yee-green-100) text-(--yee-green-900)"
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
							<CardContent className="py-5 text-sm leading-7">
								<p className="text-base font-semibold">{weightingTitle}</p>
								<p className="mt-2 font-medium">{formatExampleText(weightingDescription)}</p>
								<p className="mt-2 opacity-90">
									These answers are also used later to calculate Youth Weighted averages alongside the
									raw section scores for {draft.placeName || "this place"}.
								</p>
							</CardContent>
						</Card>
						{Object.entries(yeeDomainLabels).map(([key, label]) => {
							// The weighting step is not itself a domain, but each card in it IS
							// one, so it wears the colours that domain will have on its own step.
							const domainKey = key as YeeDomainKey;
							const domainTheme = yeeDomainThemes[domainKey];
							const domainPalette = getSurfacePalette(getStepForDomainKey(domainKey));
							return (
								<Card key={key} className={`rounded-md shadow-sm ${domainPalette.card}`}>
									<CardHeader>
										<CardTitle
											className="text-lg font-semibold"
											style={{ color: domainTheme.textHex }}>
											{label}
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4">
										<p className="text-sm font-medium text-foreground">
											{ensureQuestionMark(
												formatExampleText(weightingDomainPrompts[key as YeeDomainKey])
											)}
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
											options={weightingOptions}
											palette={domainPalette}
										/>
									</CardContent>
								</Card>
							);
						})}
						<Card className="rounded-md border-border bg-card shadow-sm">
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
								<CardContent className="py-5 text-sm leading-7">
									<p className="text-lg font-semibold">{getSectionIntroCopy(domainKey).heading}</p>
									<div className="mt-2">{getSectionIntroCopy(domainKey).body}</div>
								</CardContent>
							</Card>
						) : null}
						{domainQuestions.map(question => (
							<InstrumentLogicalQuestionCard
								key={question.key}
								question={question}
								responses={responses}
								setResponses={setResponses}
								palette={stepPalette}
							/>
						))}
						{domainKey ? (
							<Card className="rounded-md border-border bg-card shadow-sm">
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
							<CardContent className="flex flex-wrap items-center justify-between gap-3 py-5 text-sm text-muted-foreground">
								<span>
									Section progress: {answeredDomainItems} of {requiredDomainItems} questions answered
								</span>
								{requiredFollowUpsRemaining > 0 ? (
									<span>
										{requiredFollowUpsRemaining} required follow-up
										{requiredFollowUpsRemaining === 1 ? "" : "s"} still needed
									</span>
								) : null}
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
					<Card className="rounded-md border-border bg-card shadow-sm">
						<CardHeader>
							<CardTitle>{finalCommentsPrompt}</CardTitle>
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
				{!stepIsComplete ? <p className="text-sm text-score-mid">{getIncompleteStepMessage(step)}</p> : null}
				{error ? <p className="text-sm text-destructive">{error}</p> : null}
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
			<Card className="rounded-md border-border bg-card shadow-sm">
				<CardHeader>
					<CardTitle className="text-3xl">Audit submitted</CardTitle>
					<CardDescription>
						This audit is now locked. Use the read-only results page to review scores and metadata.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
					<p>Place: {submission?.place_name || placeId}</p>
					<p>Auditor ID: {submission?.auditor_generated_id || fallbackDraft.auditorId}</p>
					<p>
						Submitted at:{" "}
						{submittedAt ? new Date(submittedAt).toLocaleString() : "Submission timestamp unavailable"}
					</p>
					<div className="rounded-md bg-score-high-bg p-4 text-score-high">
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
					{loadError ? <p className="text-destructive">{loadError}</p> : null}
				</CardContent>
			</Card>
		</main>
	);
}
