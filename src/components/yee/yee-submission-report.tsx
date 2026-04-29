"use client";

import Link from "next/link";
import * as React from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { YeeScoreSummary } from "@/components/yee/yee-score-summary";
import { fetchSubmission, type YeeSubmissionRecord } from "@/lib/yee-audit-api";
import { yeeDomainLabels, type YeeDomainKey } from "@/lib/yee-audit-config";
import { buildWeightedScorePreview } from "@/lib/yee-scoring";

function downloadSingleSubmissionCsv(submission: YeeSubmissionRecord) {
	const row: Record<string, string | number> = {
		audit_id: submission.id,
		auditor_generated_id: submission.auditor_generated_id || submission.auditor_id,
		place_id: submission.place_id,
		place_name: submission.place_name || submission.place_id,
		submitted_at: submission.submitted_at,
		total_raw_score: submission.score.total_score
	};
	for (const [key, value] of Object.entries(submission.participant_info)) {
		row[`participant_${key}`] = typeof value === "object" ? JSON.stringify(value) : String(value ?? "");
	}
	for (const [key, value] of Object.entries(submission.responses)) {
		row[key] = typeof value === "object" ? JSON.stringify(value) : String(value ?? "");
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
	const sectionComments =
		submission.participant_info.section_comments &&
		typeof submission.participant_info.section_comments === "object"
			? (submission.participant_info.section_comments as Partial<Record<YeeDomainKey, string>>)
			: {};
	const weightingComments =
		typeof submission.participant_info.weighting_comments === "string"
			? submission.participant_info.weighting_comments
			: "";

	return (
		<main className="mx-auto max-w-5xl space-y-6 p-6">
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

					<YeeScoreSummary
						preview={preview}
						title="Score results"
						description="Read-only raw and Youth Weighted scores computed from the submitted responses."
					/>

					<div className="grid gap-4 md:grid-cols-2">
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

					<div className="flex flex-wrap gap-3">
						<Button type="button" variant="outline" className="rounded-2xl" onClick={() => window.print()}>
							Print report
						</Button>
						<Button type="button" variant="outline" className="rounded-2xl" onClick={() => downloadSingleSubmissionCsv(submission)}>
							Export data
						</Button>
						<Button asChild className="rounded-2xl bg-[#10231f] text-white hover:bg-[#17302c]">
							<Link href="/my-dashboard/places">Back to My Audits</Link>
						</Button>
						<Button asChild variant="outline" className="rounded-2xl">
							<Link href="/my-dashboard">Back to dashboard</Link>
						</Button>
					</div>
				</CardContent>
			</Card>
		</main>
	);
}
