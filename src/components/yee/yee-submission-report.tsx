"use client";

import Link from "next/link";
import * as React from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { YeeScoreSummary } from "@/components/yee/yee-score-summary";
import { fetchInstrument, filterItemsForDomain, type InstrumentItem, type InstrumentResponse } from "@/lib/yee-instrument";
import { fetchSubmission, type YeeSubmissionRecord } from "@/lib/yee-audit-api";
import { yeeDomainLabels, type YeeDomainKey } from "@/lib/yee-audit-config";
import { yeeDomainThemes } from "@/lib/yee-domain-theme";
import { buildWeightedScorePreview } from "@/lib/yee-scoring";

function normalizeText(value: string) {
	return value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function ensureQuestionMark(value: string) {
	if (!value) return value;
	return /[?.!]$/.test(value) ? value : `${value}?`;
}

function normalizeVisibleQuestion(value: string) {
	return ensureQuestionMark(normalizeText(value));
}

function isPlaceholderQuestionText(value: string) {
	const normalized = normalizeText(value).toLowerCase();
	return normalized === "" || normalized === "click to write the question text";
}

function getChoiceLabel(choice: { Display?: string } | undefined, fallback: string) {
	return choice?.Display || fallback;
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

function getSelectedMatrixAnswer(
	itemId: string,
	choiceId: string,
	responses: Record<string, string | Record<string, string>>
) {
	const currentValue = responses[itemId];
	if (typeof currentValue !== "object" || !currentValue) return "";
	return currentValue[choiceId] || "";
}

function getSelectedAnswerLabel(item: InstrumentItem, answerId: string | null | undefined) {
	if (!answerId) return "";
	return getChoiceLabel(item.answers?.[answerId], answerId);
}

function buildQuestionColumns(
	submission: YeeSubmissionRecord,
	instrument: InstrumentResponse
) {
	const columns: Record<string, string> = {};
	const sectionComments =
		submission.participant_info.section_comments &&
		typeof submission.participant_info.section_comments === "object"
			? (submission.participant_info.section_comments as Partial<Record<YeeDomainKey, string>>)
			: {};
	for (const [domainKey, label] of Object.entries(yeeDomainLabels) as [YeeDomainKey, string][]) {
		const items = filterItemsForDomain(instrument.scoring_items, label);
		const grouped = new Map<string, InstrumentItem[]>();
		for (const item of items) {
			const key = item.base_question_id || item.item_id;
			const next = grouped.get(key) ?? [];
			next.push(item);
			grouped.set(key, next);
		}
		let questionIndex = 0;
		Array.from(grouped.values()).forEach(groupItems => {
			const presenceItem = groupItems.find(item => !isConditionItem(item)) ?? groupItems[0];
			const conditionItem = groupItems.find(item => isConditionItem(item)) ?? null;
			const choices = Object.entries(presenceItem.choices || {});
			const hasMatrixAnswers = Object.keys(presenceItem.answers || {}).length > 0;

			if (hasMatrixAnswers) {
				choices.forEach(([choiceId, choice]) => {
					questionIndex += 1;
					const responseAnswerId = getSelectedMatrixAnswer(presenceItem.item_id, choiceId, submission.responses);
					const conditionAnswerId = conditionItem
						? getSelectedMatrixAnswer(conditionItem.item_id, choiceId, submission.responses)
						: "";
					columns[`${label} Question ${questionIndex} Prompt`] = normalizeVisibleQuestion(
						getChoiceLabel(choice, choiceId)
					);
					columns[`${label} Question ${questionIndex} Response`] = responseAnswerId
						? getSelectedAnswerLabel(presenceItem, responseAnswerId)
						: "";
					columns[`${label} Question ${questionIndex} Condition`] = conditionItem
						? conditionAnswerId
							? getSelectedAnswerLabel(conditionItem, conditionAnswerId)
							: "n/a"
						: "n/a";
				});
				return;
			}

			questionIndex += 1;
			const currentValue = submission.responses[presenceItem.item_id];
			const selectedValue = typeof currentValue === "string" ? currentValue : "";
			const prompt =
				!isPlaceholderQuestionText(presenceItem.question_text) && presenceItem.question_text
					? normalizeVisibleQuestion(presenceItem.question_text)
					: normalizeVisibleQuestion(presenceItem.item_id);
			columns[`${label} Question ${questionIndex} Prompt`] = prompt;
			columns[`${label} Question ${questionIndex} Response`] = selectedValue
				? getChoiceLabel(presenceItem.choices?.[selectedValue], selectedValue)
				: "";
			columns[`${label} Question ${questionIndex} Condition`] = "n/a";
		});
		columns[`${label} Comments`] = sectionComments[domainKey] || "";
	}
	return columns;
}

async function downloadSingleSubmissionCsv(submission: YeeSubmissionRecord) {
	const instrument = await fetchInstrument().catch(() => null);
	const row: Record<string, string | number> = {
		"Auditor ID": submission.auditor_generated_id || submission.auditor_id,
		Place: submission.place_name || submission.place_id,
		"Place ID": submission.place_id,
		"Submitted At": submission.submitted_at,
		"Raw Score": submission.score.total_score
	};
	for (const [key, value] of Object.entries(submission.participant_info)) {
		if (key === "domain_weights" || key === "section_comments") continue;
		row[`Participant ${normalizeText(key.replace(/_/g, " "))}`] = typeof value === "object" ? JSON.stringify(value) : String(value ?? "");
	}
	if (instrument) {
		Object.assign(row, buildQuestionColumns(submission, instrument));
	}

	const headers = Object.keys(row);
	const csv = [
		headers.join(","),
		headers
			.map(header => `"${String(row[header] ?? "").replace(/"/g, "\"\"")}"`)
			.join(",")
	].join("\n");
	const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = `yee-submission-${submission.id}.csv`;
	anchor.click();
	URL.revokeObjectURL(url);
}

function normalizeWeights(raw: unknown) {
	if (!raw || typeof raw !== "object") {
		return {
			access: "",
			activitySpaces: "",
			amenities: "",
			experienceOfSpace: "",
			aestheticsAndCare: "",
			useAndUsability: ""
		};
	}

	return {
		access: String((raw as Record<string, unknown>).access ?? ""),
		activitySpaces: String((raw as Record<string, unknown>).activitySpaces ?? ""),
		amenities: String((raw as Record<string, unknown>).amenities ?? ""),
		experienceOfSpace: String((raw as Record<string, unknown>).experienceOfSpace ?? ""),
		aestheticsAndCare: String((raw as Record<string, unknown>).aestheticsAndCare ?? ""),
		useAndUsability: String((raw as Record<string, unknown>).useAndUsability ?? "")
	};
}

function formatWeightLabel(value: string) {
	switch (value) {
		case "3":
			return "Very important to me (3)";
		case "2":
			return "Somewhat important to me (2)";
		case "1":
			return "Not really important to me (1)";
		default:
			return "Not recorded";
	}
}

function getWeightBubbleClasses(value: string) {
	switch (value) {
		case "3":
			return "border-emerald-500 bg-emerald-100 text-emerald-950";
		case "2":
			return "border-lime-400 bg-lime-50 text-lime-900";
		case "1":
			return "border-slate-300 bg-white text-slate-800";
		default:
			return "border-slate-200 bg-white text-slate-700";
	}
}

export function YeeSubmissionReport({ submissionId }: { submissionId: string }) {
	const { session } = useAuth();
	const [submission, setSubmission] = React.useState<YeeSubmissionRecord | null>(null);
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState<string | null>(null);

	React.useEffect(() => {
		if (!session) return;
		let cancelled = false;
		const run = async () => {
			try {
				const record = await fetchSubmission(submissionId, session);
				if (!cancelled) setSubmission(record);
			} catch (err) {
				if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load submitted audit.");
			} finally {
				if (!cancelled) setLoading(false);
			}
		};
		void run();
		return () => {
			cancelled = true;
		};
	}, [session, submissionId]);

	React.useEffect(() => {
		if (!submission) return;
		const previousTitle = document.title;
		const placeName = (submission.place_name || submission.place_id || "Place").replace(/[\\/:*?"<>|]/g, "-").trim();
		const auditorId = (submission.auditor_generated_id || submission.auditor_id || "AUD").replace(/[\\/:*?"<>|]/g, "-").trim();
		document.title = `${placeName}-${auditorId}-Audit Report`;
		return () => {
			document.title = previousTitle;
		};
	}, [submission]);

	if (loading) {
		return <main className="mx-auto max-w-5xl p-6">Loading submitted audit...</main>;
	}

	if (error || !submission) {
		return <main className="mx-auto max-w-5xl p-6 text-red-700">{error || "Submitted audit not found."}</main>;
	}

	const preview = buildWeightedScorePreview(
		submission.score,
		normalizeWeights(submission.participant_info.domain_weights)
	);
	const normalizedWeights = normalizeWeights(submission.participant_info.domain_weights);
	const sectionComments =
		submission.participant_info.section_comments &&
		typeof submission.participant_info.section_comments === "object"
			? (submission.participant_info.section_comments as Partial<Record<YeeDomainKey, string>>)
			: {};
	const weightingComments =
		typeof submission.participant_info.weighting_comments === "string"
			? submission.participant_info.weighting_comments
			: "";
	const dashboardHref =
		session?.user.account_type === "MANAGER"
			? "/dashboard"
			: session?.user.account_type === "ADMIN"
				? "/admin"
				: "/my-dashboard";
	const auditsHref =
		session?.user.account_type === "MANAGER"
			? "/dashboard/audits"
			: session?.user.account_type === "ADMIN"
				? "/admin/audits"
				: "/my-dashboard/places";

	return (
		<main className="mx-auto max-w-5xl space-y-6 p-6">
			<style jsx global>{`
				@media print {
					* {
						-webkit-print-color-adjust: exact;
						print-color-adjust: exact;
					}

					.report-page-break {
						break-before: page;
						page-break-before: always;
					}

					.report-no-break {
						break-inside: avoid;
						page-break-inside: avoid;
					}

					.report-actions {
						display: none !important;
					}
				}
			`}</style>
			<Card className="rounded-[2rem] border-slate-200/80 bg-white shadow-sm">
				<CardHeader>
					<CardTitle className="text-3xl">Submitted audit results</CardTitle>
					<CardDescription>This is a locked, read-only report for the submitted YEE audit.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="grid gap-4 md:grid-cols-2">
						<div className="rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-700">
							<p className="font-medium text-slate-900">Submission details</p>
							<p>Place: {submission.place_name || submission.place_id}</p>
							<p>Auditor ID: {submission.auditor_generated_id || submission.auditor_id}</p>
							<p>Submitted at: {new Date(submission.submitted_at).toLocaleString()}</p>
							<p>Submission ID: {submission.id}</p>
						</div>
						<div className="rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-700">
							<p className="font-medium text-slate-900">Context</p>
							<p>Date: {String(submission.participant_info.audit_date || "Not recorded")}</p>
							<p>Visit frequency: {String(submission.participant_info.visit_frequency || "Not recorded")}</p>
							<p>Season: {String(submission.participant_info.season || "Not recorded")}</p>
							<p>Weather: {String(submission.participant_info.weather || "Not recorded")}</p>
						</div>
					</div>

					<div className="rounded-2xl border border-emerald-300 bg-emerald-100/80 p-4">
						<p className="text-sm font-medium text-emerald-950">Section weighting used in this audit</p>
						<p className="mt-2 text-sm leading-6 text-emerald-900/80">
							Youth Weighted values are calculated by normalizing the participant&apos;s section weights, computing the average score within each section, and then applying the normalized weight to that section average.
						</p>
						<div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
							{(Object.keys(yeeDomainLabels) as YeeDomainKey[]).map(domain => {
								const theme = yeeDomainThemes[domain];
								return (
									<div
										key={domain}
										className={`rounded-2xl border px-4 py-3 ${getWeightBubbleClasses(normalizedWeights[domain])}`}
										style={{
											borderColor: theme.strongHex,
											backgroundColor: theme.strongFillHex,
											color: theme.strongHex
										}}
									>
										<p className="text-sm font-medium" style={{ color: theme.strongHex }}>
											{yeeDomainLabels[domain]}
										</p>
										<p className="mt-1 text-xs" style={{ color: theme.strongHex }}>
											{formatWeightLabel(normalizedWeights[domain])}
										</p>
									</div>
								);
							})}
						</div>
					</div>

					<YeeScoreSummary
						preview={preview}
						title="Score results"
						description="Read-only raw scores and Youth Weighted averages computed from the submitted responses."
					/>

					<div className="grid gap-4 md:grid-cols-2 report-page-break report-no-break">
						<div className="rounded-2xl border border-slate-200 p-4">
							<p className="text-sm font-medium text-slate-900">Weighting comments</p>
							<p className="mt-2 text-sm text-slate-600">{weightingComments || "No weighting comments submitted."}</p>
						</div>
						<div className="rounded-2xl border border-slate-200 p-4">
							<p className="text-sm font-medium text-slate-900">Overall comments</p>
							<p className="mt-2 text-sm text-slate-600">{String(submission.participant_info.comments || "No comments submitted.")}</p>
						</div>
					</div>

					<div className="grid gap-4 md:grid-cols-2">
						{(Object.keys(yeeDomainLabels) as YeeDomainKey[]).map(domain => (
							<div key={domain} className="rounded-2xl border border-slate-200 p-4">
								<p className="text-sm font-medium text-slate-900">{yeeDomainLabels[domain]} comments</p>
								<p className="mt-2 text-sm text-slate-600">{sectionComments[domain] || "No section comments submitted."}</p>
							</div>
						))}
					</div>

					<div className="report-actions flex flex-wrap gap-3">
						<Button type="button" variant="outline" className="rounded-2xl" onClick={() => window.print()}>
							Print report
						</Button>
						<Button type="button" variant="outline" className="rounded-2xl" onClick={() => void downloadSingleSubmissionCsv(submission)}>
							Export data
						</Button>
						<Button asChild className="rounded-2xl bg-[#10231f] text-white hover:bg-[#17302c]">
							<Link href={auditsHref}>Back to My Audits</Link>
						</Button>
						<Button asChild variant="outline" className="rounded-2xl">
							<Link href={dashboardHref}>Back to Dashboard</Link>
						</Button>
					</div>
				</CardContent>
			</Card>
		</main>
	);
}
