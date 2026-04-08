"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
	createDefaultDraft,
	getDomainForStep,
	getDraftStorageKey,
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

function OptionCards({
	name,
	options,
	value,
	onChange
}: {
	name: string;
	options: { value: string; label: string }[];
	value: string;
	onChange: (value: string) => void;
}) {
	return (
		<div className="grid gap-2 sm:grid-cols-3">
			{options.map(option => (
				<label
					key={`${name}-${option.value}`}
					className={`cursor-pointer rounded-2xl border p-4 text-sm transition ${
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
	const { session } = useAuth();
	const [instrument, setInstrument] = React.useState<InstrumentResponse | null>(null);
	const [draft, setDraft] = React.useState<YeeAuditDraft>(() => createDefaultDraft(placeId));
	const [responses, setResponses] = React.useState<ResponsesState>({});
	const [loading, setLoading] = React.useState(true);
	const [submitting, setSubmitting] = React.useState(false);
	const [previewLoading, setPreviewLoading] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);

	React.useEffect(() => {
		const key = getDraftStorageKey(placeId);
		const saved = window.localStorage.getItem(key);
		if (saved) {
			try {
				const parsed = JSON.parse(saved) as YeeAuditDraft;
				setDraft(parsed);
				setResponses(parsed.responses || {});
			} catch {
				window.localStorage.removeItem(key);
			}
		}
	}, [placeId]);

	React.useEffect(() => {
		if (!session) return;
		setDraft(prev => ({
			...prev,
			auditorId: session.user.id,
			auditorName: session.user.name ?? session.user.email
		}));
	}, [session]);

	React.useEffect(() => {
		window.localStorage.setItem(getDraftStorageKey(placeId), JSON.stringify({ ...draft, responses }));
	}, [draft, placeId, responses]);

	React.useEffect(() => {
		async function loadInstrument() {
			try {
				setLoading(true);
				setError(null);
				const data = await fetchInstrument();
				setInstrument(data);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Failed to load instrument.");
			} finally {
				setLoading(false);
			}
		}

		void loadInstrument();
	}, []);

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

	function goToStep(nextStep: YeeStepNumber | null) {
		if (!nextStep) return;
		router.push(`/yee/audit/${placeId}/page/${nextStep}`);
	}

	async function submitAudit() {
		try {
			setSubmitting(true);
			setError(null);
			const now = new Date();
			const finishTime = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
			const submissionDraft = {
				...draft,
				finishTime,
				totalMinutes: draft.totalMinutes || 15
			};
			const payload = {
				place_id: placeId,
				participant_info: {
					auditor_id: submissionDraft.auditorId,
					auditor_name: submissionDraft.auditorName,
					place_id: placeId,
					audit_date: submissionDraft.auditDate,
					start_time: submissionDraft.startTime,
					finish_time: finishTime,
					total_minutes: submissionDraft.totalMinutes,
					visit_frequency: submissionDraft.visitFrequency,
					season: submissionDraft.season,
					weather: submissionDraft.weather,
					domain_weights: submissionDraft.weights,
					comments: submissionDraft.comments
				},
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
			if (!response.ok) {
				const body = await response.text();
				throw new Error(`Submit failed (${response.status}): ${body}`);
			}
			const data = (await response.json()) as { id: string; score?: { total_score?: number } };
			const nextDraft = {
				...submissionDraft,
				submittedAt: now.toISOString(),
				lastResult: {
					id: data.id,
					totalScore: data.score?.total_score ?? 0
				},
				scorePreview: draft.scorePreview
			};
			setDraft(nextDraft);
			router.push(`/yee/audit/${placeId}/submitted`);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to submit audit.");
		} finally {
			setSubmitting(false);
		}
	}

	const refreshScorePreview = React.useCallback(async () => {
		try {
			setPreviewLoading(true);
			setError(null);
			const backendScore = await fetchScorePreview(responses);
			const preview = buildWeightedScorePreview(backendScore, draft.weights);
			setDraft(prev => ({ ...prev, scorePreview: preview }));
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to generate score preview.");
		} finally {
			setPreviewLoading(false);
		}
	}, [draft.weights, responses]);

	React.useEffect(() => {
		if (mode !== "review") return;
		if (draft.scorePreview) return;
		void refreshScorePreview();
	}, [mode, draft.scorePreview, refreshScorePreview]);

	if (loading) return <main className="mx-auto max-w-5xl p-6">Loading YEE instrument...</main>;
	if (error && !instrument) return <main className="mx-auto max-w-5xl p-6 text-red-700">{error}</main>;

	if (mode === "submitted") {
		return (
			<main className="mx-auto max-w-4xl space-y-6 p-6">
				<Card className="rounded-[2rem] border-slate-200/80 bg-white shadow-sm">
					<CardHeader>
						<CardTitle className="text-3xl">Audit submitted</CardTitle>
						<CardDescription>This route confirms the YEE submission for the selected place.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4 text-sm leading-7 text-slate-600">
						<p>Place: {placeId}</p>
						<p>Auditor ID: {draft.auditorId}</p>
						<p>Submitted at: {draft.submittedAt ? new Date(draft.submittedAt).toLocaleString() : "Not yet submitted"}</p>
						{draft.lastResult ? (
							<div className="rounded-2xl bg-emerald-50 p-4 text-emerald-800">
								<p className="font-medium">Submission ID: {draft.lastResult.id}</p>
								<p className="mt-1">Total score: {draft.lastResult.totalScore}</p>
							</div>
						) : null}
						{draft.scorePreview ? (
							<YeeScoreSummary
								preview={draft.scorePreview}
								title="Submitted score summary"
								description="Raw domain and youth-weighted YEE scores captured for this audit."
							/>
						) : null}
						<div className="flex flex-wrap gap-3">
							<Button asChild className="rounded-2xl bg-[#10231f] text-white hover:bg-[#17302c]">
								<Link href="/my-dashboard">Back to dashboard</Link>
							</Button>
							<Button asChild variant="outline" className="rounded-2xl">
								<Link href={`/yee/audit/${placeId}/review`}>Open review page</Link>
							</Button>
						</div>
					</CardContent>
				</Card>
			</main>
		);
	}

	if (mode === "review") {
		return (
			<main className="mx-auto max-w-5xl space-y-6 p-6">
				<Card className="rounded-[2rem] border-slate-200/80 bg-white shadow-sm">
					<CardHeader>
						<CardTitle className="text-3xl">Review and submit</CardTitle>
						<CardDescription>Check metadata and comments before final submission.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="grid gap-4 md:grid-cols-2">
							<div className="rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-700">
								<p className="font-medium text-slate-900">Audit metadata</p>
								<p>Auditor ID: {draft.auditorId}</p>
								<p>Date: {draft.auditDate}</p>
								<p>Start time: {draft.startTime}</p>
								<p>Visit frequency: {draft.visitFrequency || "Not answered"}</p>
								<p>Season: {draft.season || "Not answered"}</p>
								<p>Weather: {draft.weather || "Not answered"}</p>
							</div>
							<div className="rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-700">
								<p className="font-medium text-slate-900">Importance weighting</p>
								{Object.entries(draft.weights).map(([key, value]) => (
									<p key={key}>
										{yeeDomainLabels[key as keyof typeof draft.weights]}: {value || "Not answered"}
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
								description="This preview shows raw domain scores, weighted domain scores, and total weighted score."
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
					<Badge className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700 hover:bg-emerald-100">Place {placeId}</Badge>
					<Badge variant="secondary" className="rounded-full bg-slate-100 text-slate-700 hover:bg-slate-100">
						Step {step} of 8
					</Badge>
					<Badge variant="secondary" className="rounded-full bg-sky-100 text-sky-700 hover:bg-sky-100">
						Draft saved automatically
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
						<CardDescription>These fields create the audit draft metadata and capture the required high-level context.</CardDescription>
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
							<Input id="total-minutes" value={draft.totalMinutes ? `${draft.totalMinutes} minutes` : "Calculated on submit"} readOnly />
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
					<Button variant="outline" className="rounded-2xl" onClick={() => goToStep(getPreviousStep(step!))} disabled={!step || !getPreviousStep(step)}>
						Back
					</Button>
					<Button variant="ghost" asChild className="rounded-2xl">
						<Link href="/my-dashboard">Save and exit</Link>
					</Button>
				</div>
				{step && step < 8 ? (
					<Button
						className="rounded-2xl bg-[#10231f] text-white hover:bg-[#17302c]"
						onClick={() => goToStep(getNextStep(step))}
						disabled={!stepIsComplete}>
						Next
					</Button>
				) : (
					<Button
						className="rounded-2xl bg-[#10231f] text-white hover:bg-[#17302c]"
						onClick={() => router.push(`/yee/audit/${placeId}/review`)}
						disabled={!stepIsComplete}>
						Review Audit
					</Button>
				)}
			</div>
			{!stepIsComplete ? (
				<p className="text-sm text-amber-700">Complete the required answers on this step before continuing.</p>
			) : null}
		</main>
	);
}
