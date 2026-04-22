"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { YeeScoreSummary } from "@/components/yee/yee-score-summary";
import {
	fetchAuditState,
	fetchSubmission,
	saveAuditDraft,
	type YeeAuditState,
	type YeeSubmissionRecord
} from "@/lib/yee-audit-api";
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
	type YeeStepNumber
} from "@/lib/yee-audit-config";
import {
	fetchInstrument,
	filterItemsForDomain,
	findSectionMeta,
	type InstrumentItem,
	type InstrumentResponse
} from "@/lib/yee-instrument";
import { buildWeightedScorePreview, fetchScorePreview } from "@/lib/yee-scoring";

type ResponsesState = Record<string, string | Record<string, string>>;
type QuestionGroup = {
	baseQuestionId: string;
	items: InstrumentItem[];
};

function getChoiceLabel(choice: { Display?: string } | undefined, fallback: string): string {
	return choice?.Display || fallback;
}

function normalizeText(value: string) {
	return value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function ensureQuestionMark(value: string) {
	if (!value) return value;
	return /[?.!]$/.test(value) ? value : `${value}?`;
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

function getItemAnswerSummary(item: InstrumentItem, responses: ResponsesState) {
	const currentValue = responses[item.item_id];
	const choices = Object.entries(item.choices || {});
	const answers = Object.entries(item.answers || {});

	if (!currentValue) return [];

	if (answers.length > 0) {
		if (typeof currentValue !== "object") return [];
		return choices
			.map(([choiceId, choice]) => {
				const answerId = currentValue[choiceId];
				if (!answerId) return null;
				const answerLabel = getChoiceLabel(item.answers?.[answerId], answerId);
				return `${getChoiceLabel(choice, choiceId)}: ${answerLabel}`;
			})
			.filter((value): value is string => Boolean(value));
	}

	if (typeof currentValue !== "string") return [];
	return [getChoiceLabel(item.choices?.[currentValue], currentValue)];
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

function buildParticipantInfo(draft: YeeAuditDraft) {
	return {
		auditor_id: draft.auditorId,
		auditor_name: draft.auditorName,
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
			(typeof participantInfo.place_name === "string" && participantInfo.place_name ? participantInfo.place_name : baseDraft.placeName),
		auditorId: state.auditor_generated_id || baseDraft.auditorId,
		auditorName:
			typeof participantInfo.auditor_name === "string" && participantInfo.auditor_name
				? participantInfo.auditor_name
				: baseDraft.auditorName,
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
		scorePreview: state.score ? buildWeightedScorePreview(state.score, weights) : null
	};
}

function OptionCards({
	name,
	options,
	value,
	onChange,
	readOnly = false
}: {
	name: string;
	options: { value: string; label: string }[];
	value: string;
	onChange: (value: string) => void;
	readOnly?: boolean;
}) {
	return (
		<div className="grid gap-2 sm:grid-cols-3">
			{options.map(option => (
				<label
					key={`${name}-${option.value}`}
					className={`rounded-2xl border p-4 text-sm transition ${
						readOnly ? "cursor-default" : "cursor-pointer"
					} ${
						value === option.value
							? "border-emerald-500 bg-emerald-50 text-emerald-800"
							: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
					}`}>
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
	onChange
}: {
	name: string;
	options: { value: string; label: string }[];
	value: string[];
	onChange: (next: string[]) => void;
}) {
	return (
		<div className="grid gap-2 sm:grid-cols-3">
			{options.map(option => {
				const checked = value.includes(option.value);
				return (
					<label
						key={`${name}-${option.value}`}
						className={`cursor-pointer rounded-2xl border p-4 text-sm transition ${
							checked
								? "border-emerald-500 bg-emerald-50 text-emerald-800"
								: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
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
	setResponses
}: {
	item: InstrumentItem;
	responses: ResponsesState;
	setResponses: React.Dispatch<React.SetStateAction<ResponsesState>>;
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
			<Card className="rounded-[1.5rem] border-slate-200/80 bg-[#fffdf8] shadow-sm">
				<CardContent className="py-6 text-sm leading-7 text-slate-600">{normalizeText(item.question_text)}</CardContent>
			</Card>
		);
	}

	if (answers.length > 0) {
		return (
			<Card className="rounded-[1.5rem] border-slate-200/80 bg-white shadow-sm">
				<CardHeader>
					<CardTitle className="text-base">{normalizeText(item.question_text || item.item_id)}</CardTitle>
					<CardDescription>{item.block}</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{choices.map(([choiceId, choice]) => {
						const selected =
							typeof currentValue === "object" && currentValue ? currentValue[choiceId] || "" : "";

						return (
							<div key={`${item.item_id}-${choiceId}`} className="space-y-3 rounded-2xl border border-slate-200 p-4">
								<p className="text-sm font-medium text-slate-900">{getChoiceLabel(choice, choiceId)}</p>
								<OptionCards
									name={`${item.item_id}-${choiceId}`}
									value={selected}
									onChange={value => updateMatrixResponse(item.item_id, choiceId, value)}
									options={answers.map(([answerId, answer]) => ({
										value: answerId,
										label: getChoiceLabel(answer, answerId)
									}))}
								/>
							</div>
						);
					})}
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="rounded-[1.5rem] border-slate-200/80 bg-white shadow-sm">
			<CardHeader>
				<CardTitle className="text-base">{normalizeText(item.question_text || item.item_id)}</CardTitle>
				<CardDescription>{item.block}</CardDescription>
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
				/>
			</CardContent>
		</Card>
	);
}

function InstrumentQuestionGroupCard({
	group,
	responses,
	setResponses
}: {
	group: QuestionGroup;
	responses: ResponsesState;
	setResponses: React.Dispatch<React.SetStateAction<ResponsesState>>;
}) {
	if (group.items.length === 1) {
		return <InstrumentQuestionCard item={group.items[0]} responses={responses} setResponses={setResponses} />;
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
		<Card className="rounded-[1.5rem] border-slate-200/80 bg-[#f7fbf8] shadow-sm">
			<CardHeader>
				<CardTitle className="text-base">{presenceItem.block}</CardTitle>
				<CardDescription>
					Answer each item below. If the feature is present, the condition follow-up will appear right underneath it.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{choices.map(([choiceId, choice]) => {
					const selectedPresence = getSelectedMatrixAnswer(presenceItem.item_id, choiceId, responses);
					const showCondition = conditionItem ? isRowPositive(presenceItem, choiceId, responses) : false;
					const selectedCondition = conditionItem ? getSelectedMatrixAnswer(conditionItem.item_id, choiceId, responses) : "";
					return (
						<div key={`${group.baseQuestionId}-${choiceId}`} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
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
							/>
							{conditionItem && showCondition ? (
								<div className="space-y-2 rounded-2xl bg-emerald-50/70 p-4">
									<p className="text-xs font-medium uppercase tracking-[0.16em] text-emerald-800">Condition</p>
									<OptionCards
										name={`${conditionItem.item_id}-${choiceId}`}
										value={selectedCondition}
										onChange={value => updateMatrixResponse(conditionItem.item_id, choiceId, value)}
										options={conditionAnswers.map(([answerId, answer]) => ({
											value: answerId,
											label: getChoiceLabel(answer, answerId)
										}))}
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
	step
}: {
	placeId: string;
	mode: "step" | "review" | "submitted";
	step?: YeeStepNumber;
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
	const [persisting, setPersisting] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);
	const hydratedRef = React.useRef(false);
	const lastPersistedSnapshot = React.useRef<string | null>(null);

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
				const state = await fetchAuditState(placeId, session);
				if (cancelled) return;
				if (mode !== "submitted" && state.status === "SUBMITTED" && state.submission_id) {
					router.replace(`/yee/submissions/${state.submission_id}`);
					return;
				}
				const nextDraft = draftFromAuditState(placeId, state);
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
	}, [mode, placeId, router, session]);

	const persistCurrentDraft = React.useCallback(
		async (currentDraft: YeeAuditDraft, currentResponses: ResponsesState) => {
			if (!session || !hydratedRef.current || mode === "submitted") return;
			const payload = {
				participant_info: buildParticipantInfo(currentDraft),
				responses: currentResponses
			};
			const snapshot = JSON.stringify(payload);
			if (snapshot === lastPersistedSnapshot.current) return;
			setPersisting(true);
			try {
				await saveAuditDraft(placeId, session, payload);
				lastPersistedSnapshot.current = snapshot;
			} finally {
				setPersisting(false);
			}
		},
		[mode, placeId, session]
	);

	React.useEffect(() => {
		if (!session || !hydratedRef.current || mode === "submitted") return;
		const timer = window.setTimeout(() => {
			void persistCurrentDraft(draft, responses).catch(err => {
				setError(err instanceof Error ? err.message : "Failed to save draft.");
			});
		}, 350);
		return () => window.clearTimeout(timer);
	}, [draft, mode, persistCurrentDraft, responses, session]);

	const stepDetails = step ? yeeSteps.find(item => item.step === step) : null;
	const domainKey = step ? getDomainForStep(step) : null;
	const domainItems = React.useMemo(
		() => (instrument && domainKey ? filterItemsForDomain(instrument.scoring_items, yeeDomainLabels[domainKey]) : []),
		[domainKey, instrument]
	);
	const sectionMeta = React.useMemo(
		() => (instrument && domainKey ? findSectionMeta(instrument, yeeDomainLabels[domainKey]) : null),
		[domainKey, instrument]
	);
	const domainGroups = React.useMemo(() => groupInstrumentItems(domainItems), [domainItems]);
	const weatherSelections = React.useMemo(() => draft.weather.split("|").filter(Boolean), [draft.weather]);

	const answeredDomainItems = domainGroups.filter(group => {
		if (group.items.length === 1) return hasAnsweredItem(group.items[0], responses);
		const presenceItem = group.items.find(item => !isConditionItem(item)) ?? group.items[0];
		const conditionItem = group.items.find(item => isConditionItem(item)) ?? null;
		const choices = Object.keys(presenceItem.choices || {});
		return choices.every(choiceId => {
			const presenceValue = getSelectedMatrixAnswer(presenceItem.item_id, choiceId, responses);
			if (!presenceValue) return false;
			if (!conditionItem || !isRowPositive(presenceItem, choiceId, responses)) return true;
			return Boolean(getSelectedMatrixAnswer(conditionItem.item_id, choiceId, responses));
		});
	}).length;
	const requiredDomainItems = domainGroups.length;

	const stepIsComplete =
		step === 1
			? Boolean(draft.visitFrequency && draft.season && weatherSelections.length > 0)
			: step === 2
				? Object.values(draft.weights).every(Boolean)
				: step
					? domainGroups.every(group => {
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
						})
					: false;

	function updateDraft<K extends keyof YeeAuditDraft>(key: K, value: YeeAuditDraft[K]) {
		setDraft(prev => ({ ...prev, [key]: value }));
	}

	async function goToStep(nextStep: YeeStepNumber | null) {
		if (!nextStep) return;
		try {
			await persistCurrentDraft({ ...draft, responses }, responses);
			router.push(`/yee/audit/${placeId}/page/${nextStep}`);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to save draft before moving to the next step.");
		}
	}

	async function openReview() {
		try {
			await persistCurrentDraft({ ...draft, responses }, responses);
			router.push(`/yee/audit/${placeId}/review`);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to save draft before opening review.");
		}
	}

	const refreshScorePreview = React.useCallback(async () => {
		try {
			setPreviewLoading(true);
			setError(null);
			const backendScore = await fetchScorePreview(placeId, buildParticipantInfo(draft), responses);
			const preview = buildWeightedScorePreview(backendScore, draft.weights);
			setDraft(prev => ({ ...prev, scorePreview: preview }));
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to generate score preview.");
		} finally {
			setPreviewLoading(false);
		}
	}, [draft, placeId, responses]);

	React.useEffect(() => {
		if (mode !== "review") return;
		if (draft.scorePreview) return;
		if (!hydratedRef.current) return;
		void refreshScorePreview();
	}, [draft.scorePreview, mode, refreshScorePreview]);

	async function submitAudit() {
		try {
			setSubmitting(true);
			setError(null);
			const now = new Date();
			const finishTime = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
			const totalMinutes =
				draft.totalMinutes ||
				Math.max(
					1,
					Math.round((now.getTime() - new Date(`${draft.auditDate}T${draft.startTime}`).getTime()) / 60000) || 0
				);
			const submissionDraft = {
				...draft,
				finishTime,
				totalMinutes
			};
			const payload = {
				place_id: placeId,
				participant_info: buildParticipantInfo(submissionDraft),
				responses
			};
			const response = await fetch("/api/yee/audits", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					...(session ? { Authorization: `Bearer ${session.accessToken}` } : {})
				},
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
			const scorePayload =
				typeof data.score === "object" && data.score ? (data.score as Record<string, unknown>) : null;
			const submittedAt = typeof data.submitted_at === "string" ? data.submitted_at : now.toISOString();
			const preview =
				scorePayload
					? buildWeightedScorePreview(scorePayload as Parameters<typeof buildWeightedScorePreview>[0], submissionDraft.weights)
					: draft.scorePreview;
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
				scorePreview: preview
			};
			setDraft(nextDraft);
			router.push(`/yee/audit/${placeId}/submitted?submissionId=${encodeURIComponent(String(data.id))}`);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to submit audit.");
		} finally {
			setSubmitting(false);
		}
	}

	if (loading || !instrument) {
		return <main className="mx-auto max-w-5xl p-6">Loading YEE audit flow...</main>;
	}

	if (error && !instrument) {
		return <main className="mx-auto max-w-5xl p-6 text-red-700">{error}</main>;
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

	if (mode === "review") {
		const reviewSections = (Object.keys(yeeDomainLabels) as Array<keyof typeof yeeDomainLabels>).map(domain => ({
			domain,
			label: yeeDomainLabels[domain],
			items: filterItemsForDomain(instrument.scoring_items, yeeDomainLabels[domain]).filter(item => hasAnsweredItem(item, responses))
		}));

		return (
			<main className="mx-auto max-w-5xl space-y-6 p-6">
				<Card className="rounded-[2rem] border-slate-200/80 bg-white shadow-sm">
					<CardHeader>
						<CardTitle className="text-3xl">Review and submit</CardTitle>
						<CardDescription>Review the saved answers for {draft.placeName || "this place"} before final submission.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="grid gap-4 md:grid-cols-2">
							<div className="rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-700">
								<p className="font-medium text-slate-900">Audit metadata</p>
								<p>Place: {draft.placeName || "Not recorded"}</p>
								<p>Generated auditor ID: {draft.auditorId}</p>
								<p>Date: {draft.auditDate || "Not answered"}</p>
								<p>Start time: {draft.startTime || "Not answered"}</p>
								<p>Visit frequency: {getOptionLabel(visitFrequencyOptions, draft.visitFrequency)}</p>
								<p>Season: {getOptionLabel(seasonOptions, draft.season)}</p>
								<p>Weather: {getMultiOptionLabels(weatherOptions, draft.weather)}</p>
							</div>
							<div className="rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-700">
								<p className="font-medium text-slate-900">Importance weighting</p>
								{Object.entries(draft.weights).map(([key, value]) => (
									<p key={key}>
										{yeeDomainLabels[key as keyof typeof draft.weights]}: {getOptionLabel(yeeWeightOptions, value)}
									</p>
								))}
							</div>
						</div>
						<div className="space-y-4">
							{reviewSections.map(section => (
								<Card key={section.domain} className="rounded-[1.5rem] border-slate-200/80 bg-[#f7fbf8] shadow-sm">
									<CardHeader className="pb-3">
										<CardTitle className="text-lg">{section.label}</CardTitle>
										<CardDescription>
											{section.items.length > 0
												? `${section.items.length} answered items saved for review.`
												: "No saved answers yet for this section."}
										</CardDescription>
									</CardHeader>
									<CardContent className="space-y-4">
										{section.items.map(item => (
											<div key={item.item_id} className="rounded-2xl border border-slate-200 bg-white p-4">
												<p className="text-sm font-medium text-slate-900">{normalizeText(item.question_text || item.item_id)}</p>
												<div className="mt-2 space-y-1 text-sm text-slate-600">
													{getItemAnswerSummary(item, responses).map(answer => (
														<p key={`${item.item_id}-${answer}`}>{answer}</p>
													))}
												</div>
											</div>
										))}
										<div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-600">
											<p className="font-medium text-slate-900">Section comments</p>
											<p className="mt-2">{draft.sectionComments[section.domain] || "No section comments added."}</p>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
						<div className="rounded-2xl border border-slate-200 p-4">
							<p className="text-sm font-medium text-slate-900">Overall comments</p>
							<p className="mt-2 text-sm text-slate-600">{draft.comments || "No comments added."}</p>
						</div>
						{draft.scorePreview ? (
							<YeeScoreSummary
								preview={draft.scorePreview}
								title="Score preview"
								description="This preview is based on the saved draft answers and shows both raw and youth-weighted score views."
							/>
						) : (
							<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
								<CardContent className="py-6 text-sm text-slate-600">
									{previewLoading ? "Generating score preview..." : "Score preview has not been generated yet."}
								</CardContent>
							</Card>
						)}
						<div className="flex flex-wrap gap-3">
							<Button asChild variant="outline" className="rounded-2xl">
								<Link href={`/yee/audit/${placeId}/page/8`}>Back to final section</Link>
							</Button>
							<Button variant="outline" className="rounded-2xl" onClick={() => void refreshScorePreview()} disabled={previewLoading}>
								{previewLoading ? "Refreshing..." : "Refresh Score Preview"}
							</Button>
							<Button className="rounded-2xl bg-[#10231f] text-white hover:bg-[#17302c]" onClick={() => void submitAudit()} disabled={submitting}>
								{submitting ? "Submitting..." : "Submit Audit"}
							</Button>
						</div>
						<p className="text-xs text-slate-500">{persisting ? "Saving your latest answers..." : "All answers saved."}</p>
						{error ? <p className="text-sm text-red-700">{error}</p> : null}
					</CardContent>
				</Card>
			</main>
		);
	}

	return (
		<main className="mx-auto max-w-5xl space-y-6 p-6">
			<header className="space-y-3">
				<div className="flex flex-wrap items-center gap-2">
					<Badge className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700 hover:bg-emerald-100">{draft.auditorId}</Badge>
					<Badge variant="secondary" className="rounded-full bg-slate-100 text-slate-700 hover:bg-slate-100">
						Step {step} of 8
					</Badge>
					<Badge variant="secondary" className="rounded-full bg-sky-100 text-sky-700 hover:bg-sky-100">
						{persisting ? "Saving answers..." : "Progress saved automatically"}
					</Badge>
				</div>
				<h1 className="text-3xl font-semibold tracking-tight text-slate-950">{stepDetails?.title}</h1>
				<p className="max-w-3xl text-sm leading-7 text-slate-600">{stepDetails?.description}</p>
				{draft.placeName ? <p className="text-sm font-medium text-emerald-800">Place: {draft.placeName}</p> : null}
			</header>

			<div className="grid gap-2 sm:grid-cols-4 lg:grid-cols-8">
				{yeeSteps.map(entry => (
					<Link
						key={entry.step}
						href={`/yee/audit/${placeId}/page/${entry.step}`}
						className={`rounded-2xl border px-3 py-2 text-center text-sm ${
							step === entry.step ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-600"
						}`}>
						{entry.step}
					</Link>
				))}
			</div>

			{step === 1 ? (
				<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
					<CardHeader>
						<CardTitle>Visit details</CardTitle>
						<CardDescription>
							Record the visit context for {draft.placeName || "this place"} before moving into importance weighting and domain questions.
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
								<Input id="audit-date" type="date" value={draft.auditDate} onChange={event => updateDraft("auditDate", event.target.value)} />
							</div>
							<div className="space-y-2">
								<Label htmlFor="start-time">Start time</Label>
								<Input id="start-time" value={draft.startTime} onChange={event => updateDraft("startTime", event.target.value)} />
							</div>
							<div className="space-y-2">
								<Label htmlFor="finish-time">Finish time</Label>
								<Input id="finish-time" value={draft.finishTime || "Recorded on submit"} readOnly />
							</div>
							<div className="space-y-2">
								<Label htmlFor="total-minutes">Total minutes</Label>
								<Input
									id="total-minutes"
									type="number"
									value={draft.totalMinutes ? String(draft.totalMinutes) : ""}
									placeholder="Minutes spent on audit"
									onChange={event => updateDraft("totalMinutes", Number(event.target.value) || 0)}
								/>
							</div>
						</div>
						<div className="space-y-3">
							<Label>How often have you been to / visited this space in the last 6 months? (choose the response that fits best)</Label>
							<OptionCards
								name="visit-frequency"
								value={draft.visitFrequency}
								onChange={value => updateDraft("visitFrequency", value)}
								options={visitFrequencyOptions}
							/>
						</div>
						<div className="space-y-3">
							<Label>What is the current season?</Label>
							<OptionCards name="season" value={draft.season} onChange={value => updateDraft("season", value)} options={seasonOptions} />
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
							/>
						</div>
					</CardContent>
				</Card>
			) : null}

			{step === 2 ? (
				<div className="space-y-4">
					<Card className="rounded-[1.5rem] border-slate-200/80 bg-[#f4fbf6] shadow-sm">
						<CardContent className="py-5 text-sm leading-7 text-slate-700">
							<p className="font-medium text-slate-900">How important is each domain to you in {draft.placeName || "this place"}?</p>
							<p className="mt-2">
								Your answers on this page are used later to calculate youth-weighted scores alongside the raw section scores.
							</p>
						</CardContent>
					</Card>
					{Object.entries(yeeDomainLabels).map(([key, label]) => (
						<Card key={key} className="rounded-[1.5rem] border-slate-200/80 bg-white shadow-sm">
							<CardHeader>
								<CardTitle>{label}</CardTitle>
								<CardDescription>
									{key === "access"
										? "ACCESS: How important is to you that you can easily and safely get to these spaces?"
										: key === "activitySpaces"
											? "ACTIVITY SPACES: How important is it to you that these places have the spaces and/or equipment that allow you to do the activities you like?"
											: key === "amenities"
												? "AMENITIES: How important is it to you that these places have amenities that make the space more comfortable and suitable?"
												: key === "experienceOfSpace"
													? "EXPERIENCE OF THE SPACE: How important is it to you that these places feel pleasant and safe to be in?"
													: key === "aestheticsAndCare"
														? "AESTHETICS & CARE: How important is it to you that these places look nice and well cared for?"
														: "USE & USABILITY: How important is it to you that these places are suitable for many activities for youth and/or the community?"}
								</CardDescription>
							</CardHeader>
							<CardContent>
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
								/>
							</CardContent>
						</Card>
					))}
				</div>
			) : null}

			{step && step >= 3 && step <= 8 ? (
				<div className="space-y-4">
					<Card className="rounded-[1.5rem] border-slate-200/80 bg-[#f4fbf6] shadow-sm">
						<CardContent className="flex flex-wrap items-center justify-between gap-3 py-5 text-sm text-slate-600">
							<span>
								Section progress: {answeredDomainItems} of {requiredDomainItems} questions answered
							</span>
							<span>{requiredDomainItems === 0 ? "Informational section" : stepIsComplete ? "Section complete" : "Section in progress"}</span>
						</CardContent>
					</Card>
					{domainKey ? (
						<Card className="rounded-[1.5rem] border-slate-200/80 bg-[#eef8f2] shadow-sm">
							<CardContent className="py-5 text-sm leading-7 text-slate-700">
								<p className="font-medium text-slate-900">{sectionMeta?.title || yeeDomainLabels[domainKey]}</p>
								<p
									className="mt-2"
									dangerouslySetInnerHTML={{
										__html:
											sectionMeta?.intro_text ||
											`Answer each question for ${draft.placeName || "this place"}. Your answers stay saved as you move backward and forward through the audit.`
									}}
								/>
							</CardContent>
						</Card>
					) : null}
					{domainGroups.map(group => (
						<InstrumentQuestionGroupCard
							key={group.baseQuestionId}
							group={group}
							responses={responses}
							setResponses={setResponses}
						/>
					))}
					{domainKey ? (
						<Card className="rounded-[1.5rem] border-slate-200/80 bg-white shadow-sm">
							<CardHeader>
								<CardTitle>Section comments</CardTitle>
								<CardDescription>
									{sectionMeta?.comment_prompt || `Add any optional notes for the ${yeeDomainLabels[domainKey]} section.`}
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
									placeholder={sectionMeta?.comment_prompt || `Optional notes about ${yeeDomainLabels[domainKey].toLowerCase()} in this place...`}
									className="min-h-28"
								/>
							</CardContent>
						</Card>
					) : null}
				</div>
			) : null}

			{step === 8 ? (
				<Card className="rounded-[1.5rem] border-slate-200/80 bg-white shadow-sm">
					<CardHeader>
						<CardTitle>Optional comments</CardTitle>
						<CardDescription>Add any final notes before the review screen.</CardDescription>
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
					<Button variant="outline" className="rounded-2xl" onClick={() => void goToStep(getPreviousStep(step!))} disabled={!step || !getPreviousStep(step)}>
						Back
					</Button>
					<Button
						variant="ghost"
						className="rounded-2xl"
						onClick={async () => {
							try {
								await persistCurrentDraft(draft, responses);
								router.push("/my-dashboard");
							} catch (err) {
								setError(err instanceof Error ? err.message : "Failed to save draft before exiting.");
							}
						}}>
						Save and exit
					</Button>
				</div>
				{step && step < 8 ? (
					<Button
						className="rounded-2xl bg-[#10231f] text-white hover:bg-[#17302c]"
						onClick={() => void goToStep(getNextStep(step))}
						disabled={!stepIsComplete}>
						Next
					</Button>
				) : (
					<Button
						className="rounded-2xl bg-[#10231f] text-white hover:bg-[#17302c]"
						onClick={() => void openReview()}
						disabled={!stepIsComplete}>
						Review Audit
					</Button>
				)}
			</div>
			{!stepIsComplete ? (
				<p className="text-sm text-amber-700">Complete the required answers on this step before continuing.</p>
			) : null}
			{error ? <p className="text-sm text-red-700">{error}</p> : null}
		</main>
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

	React.useEffect(() => {
		if (!session || !submissionId) {
			setLoading(false);
			return;
		}
		let cancelled = false;
		const run = async () => {
			try {
				const record = await fetchSubmission(submissionId, session);
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
			<Card className="rounded-[2rem] border-slate-200/80 bg-white shadow-sm">
				<CardHeader>
					<CardTitle className="text-3xl">Audit submitted</CardTitle>
					<CardDescription>This audit is now locked. Use the read-only results page to review scores and metadata.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4 text-sm leading-7 text-slate-600">
					<p>Place: {submission?.place_name || placeId}</p>
					<p>Auditor ID: {submission?.auditor_generated_id || fallbackDraft.auditorId}</p>
					<p>Submitted at: {submittedAt ? new Date(submittedAt).toLocaleString() : "Submission timestamp unavailable"}</p>
					<div className="rounded-2xl bg-emerald-50 p-4 text-emerald-800">
						<p className="font-medium">Submission ID: {submission?.id || fallbackDraft.lastResult?.id || "Unavailable"}</p>
						<p className="mt-1">Total score: {totalScore}</p>
					</div>
					<div className="flex flex-wrap gap-3">
						<Button asChild className="rounded-2xl bg-[#10231f] text-white hover:bg-[#17302c]">
							<Link href="/my-dashboard">Back to dashboard</Link>
						</Button>
						{submissionId ? (
							<Button asChild variant="outline" className="rounded-2xl">
								<Link href={`/yee/submissions/${submissionId}`}>Open read-only results</Link>
							</Button>
						) : null}
					</div>
					{loading ? <p>Loading submitted audit details...</p> : null}
					{loadError ? <p className="text-red-700">{loadError}</p> : null}
				</CardContent>
			</Card>
		</main>
	);
}
