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
import { fetchInstrument, filterItemsForDomain, type InstrumentItem, type InstrumentResponse } from "@/lib/yee-instrument";
import { buildWeightedScorePreview, fetchScorePreview } from "@/lib/yee-scoring";

type ResponsesState = Record<string, string | Record<string, string>>;

function getChoiceLabel(choice: { Display?: string } | undefined, fallback: string): string {
	return choice?.Display || fallback;
}

function normalizeText(value: string) {
	return value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
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

function getOptionLabel(
	options: { value: string; label: string }[],
	value: string | null | undefined,
	fallback = "Not answered"
) {
	if (!value) return fallback;
	return options.find(option => option.value === value)?.label ?? value;
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
		audit_date: draft.auditDate,
		start_time: draft.startTime,
		finish_time: draft.finishTime,
		total_minutes: draft.totalMinutes,
		visit_frequency: draft.visitFrequency,
		season: draft.season,
		weather: draft.weather,
		domain_weights: draft.weights,
		comments: draft.comments
	};
}

function draftFromAuditState(placeId: string, state: YeeAuditState): YeeAuditDraft {
	const participantInfo = state.participant_info ?? {};
	const weights = normalizeWeights(participantInfo.domain_weights);
	const baseDraft = createDefaultDraft(placeId);
	return {
		...baseDraft,
		placeId,
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
	const domainItems =
		instrument && domainKey ? filterItemsForDomain(instrument.scoring_items, yeeDomainLabels[domainKey]) : [];
	const answeredDomainItems = domainItems.filter(item => hasAnsweredItem(item, responses)).length;
	const requiredDomainItems = domainItems.length;

	const stepIsComplete =
		step === 1
			? Boolean(draft.visitFrequency && draft.season && draft.weather)
			: step === 2
				? Object.values(draft.weights).every(Boolean)
				: step
					? domainItems.every(item => hasAnsweredItem(item, responses))
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
			const backendScore = await fetchScorePreview(placeId, responses);
			const preview = buildWeightedScorePreview(backendScore, draft.weights);
			setDraft(prev => ({ ...prev, scorePreview: preview }));
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to generate score preview.");
		} finally {
			setPreviewLoading(false);
		}
	}, [draft.weights, placeId, responses]);

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
		return (
			<main className="mx-auto max-w-5xl space-y-6 p-6">
				<Card className="rounded-[2rem] border-slate-200/80 bg-white shadow-sm">
					<CardHeader>
						<CardTitle className="text-3xl">Review and submit</CardTitle>
						<CardDescription>Review the saved draft from the backend before final submission.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="grid gap-4 md:grid-cols-2">
							<div className="rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-700">
								<p className="font-medium text-slate-900">Audit metadata</p>
								<p>Generated auditor ID: {draft.auditorId}</p>
								<p>Date: {draft.auditDate || "Not answered"}</p>
								<p>Start time: {draft.startTime || "Not answered"}</p>
								<p>Visit frequency: {getOptionLabel(visitFrequencyOptions, draft.visitFrequency)}</p>
								<p>Season: {getOptionLabel(seasonOptions, draft.season)}</p>
								<p>Weather: {getOptionLabel(weatherOptions, draft.weather)}</p>
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
						<div className="rounded-2xl border border-slate-200 p-4">
							<p className="text-sm font-medium text-slate-900">Optional comments</p>
							<p className="mt-2 text-sm text-slate-600">{draft.comments || "No comments added."}</p>
						</div>
						{draft.scorePreview ? (
							<YeeScoreSummary
								preview={draft.scorePreview}
								title="Score preview"
								description="This preview is computed from the saved backend draft, using raw and youth-weighted scores."
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
						<p className="text-xs text-slate-500">{persisting ? "Saving draft..." : "Draft synced with backend."}</p>
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
						{persisting ? "Saving to backend..." : "Backend draft active"}
					</Badge>
				</div>
				<h1 className="text-3xl font-semibold tracking-tight text-slate-950">{stepDetails?.title}</h1>
				<p className="max-w-3xl text-sm leading-7 text-slate-600">{stepDetails?.description}</p>
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
						<CardDescription>These fields are saved to the backend draft and carried into review and submission.</CardDescription>
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
							<Label>How often have you visited this space in the last 6 months?</Label>
							<OptionCards
								name="visit-frequency"
								value={draft.visitFrequency}
								onChange={value => updateDraft("visitFrequency", value)}
								options={visitFrequencyOptions}
							/>
						</div>
						<div className="space-y-3">
							<Label>Current season</Label>
							<OptionCards name="season" value={draft.season} onChange={value => updateDraft("season", value)} options={seasonOptions} />
						</div>
						<div className="space-y-3">
							<Label>Weather today</Label>
							<OptionCards name="weather" value={draft.weather} onChange={value => updateDraft("weather", value)} options={weatherOptions} />
						</div>
					</CardContent>
				</Card>
			) : null}

			{step === 2 ? (
				<div className="space-y-4">
					{Object.entries(yeeDomainLabels).map(([key, label]) => (
						<Card key={key} className="rounded-[1.5rem] border-slate-200/80 bg-white shadow-sm">
							<CardHeader>
								<CardTitle>{label}</CardTitle>
								<CardDescription>How important is this domain to you in this space?</CardDescription>
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
					<Card className="rounded-[1.5rem] border-slate-200/80 bg-[#fffdf8] shadow-sm">
						<CardContent className="flex flex-wrap items-center justify-between gap-3 py-5 text-sm text-slate-600">
							<span>
								Question progress: {answeredDomainItems} of {requiredDomainItems} answered
							</span>
							<span>{requiredDomainItems === 0 ? "Informational section" : stepIsComplete ? "Section complete" : "Section in progress"}</span>
						</CardContent>
					</Card>
					{domainItems.map(item => (
						<InstrumentQuestionCard key={item.item_id} item={item} responses={responses} setResponses={setResponses} />
					))}
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
