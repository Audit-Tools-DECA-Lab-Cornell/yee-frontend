"use client";

import Link from "next/link";
import * as React from "react";
import { ArrowLeft, LayoutDashboard, Lock, Printer } from "lucide-react";

import { useAuth } from "@/features/auth/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardHero } from "@/components/ui/dashboard-hero";
import { Skeleton } from "@/components/ui/skeleton";
import { ExportMenuButton } from "@/features/reporting/components/export-menu-button";
import { YeeScoreSummary } from "@/features/yee-audit/components/yee-score-summary";
import { fetchInstrument } from "@/features/yee-audit/api/yee-instrument";
import { fetchSubmission, type YeeSubmissionRecord } from "@/features/yee-audit/api/yee-audit-api";
import { yeeDomainLabels, type YeeDomainKey } from "@/features/yee-audit/config/yee-audit-config";
import { yeeDomainThemes } from "@/features/yee-audit/config/yee-domain-theme";
import type { ReportDocumentFormat } from "@/features/reporting/export/types";

function formatSubmittedAt(value: string) {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
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
			return "Very important";
		case "2":
			return "Somewhat important";
		case "1":
			return "Not really important";
		default:
			return "Not recorded";
	}
}

/** Three-segment strength indicator for a participant's section weight (1–3). */
function WeightScale({ value }: { value: string }) {
	const level = Number(value) || 0;
	return (
		<span className="flex items-center gap-1" aria-hidden>
			{[1, 2, 3].map(segment => (
				<span
					key={segment}
					className={`h-1.5 w-5 rounded-full ${
						segment <= level ? "bg-[var(--yee-green-600)]" : "bg-slate-200"
					}`}
				/>
			))}
		</span>
	);
}

function MetaField({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
	const recorded = value && value !== "Not recorded";
	return (
		<div className="min-w-0">
			<dt className="text-[12px] font-bold uppercase tracking-[0.14em] text-foreground">{label}</dt>
			<dd
				className={`mt-1 text-sm ${
					recorded ? "font-medium text-muted-foreground" : "text-muted-foreground/80"
				} ${mono ? "font-mono text-xs leading-5 break-all" : ""}`}>
				{recorded ? value : "Not recorded"}
			</dd>
		</div>
	);
}

function CommentRow({
	label,
	value,
	emptyText,
	dotColor
}: {
	label: string;
	value: string;
	emptyText: string;
	dotColor?: string;
}) {
	return (
		<div className="grid gap-1 py-3.5 first:pt-0 last:pb-0 sm:grid-cols-[13rem_1fr] sm:gap-6 report-no-break">
			<dt className="flex items-center gap-2.5 text-sm font-medium text-foreground">
				{dotColor ? (
					<span
						aria-hidden
						className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
						style={{ backgroundColor: dotColor }}
					/>
				) : null}
				{label}
			</dt>
			<dd
				className={`text-sm leading-6 ${value ? "text-foreground/90" : "text-muted-foreground/70"} sm:pl-0 ${dotColor ? "pl-5" : ""}`}>
				{value || emptyText}
			</dd>
		</div>
	);
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
				const record = await fetchSubmission(submissionId);
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
		const placeName = (submission.place_name || submission.place_id || "Place")
			.replace(/[\\/:*?"<>|]/g, "-")
			.trim();
		const auditorId = (submission.auditor_generated_id || submission.auditor_id || "AUD")
			.replace(/[\\/:*?"<>|]/g, "-")
			.trim();
		document.title = `${placeName}-${auditorId}-Audit Report`;
		return () => {
			document.title = previousTitle;
		};
	}, [submission]);

	if (loading) {
		return (
			<div className="space-y-6" aria-busy="true" aria-label="Loading submitted audit">
				<div className="space-y-3">
					<Skeleton className="h-4 w-40 rounded-full" />
					<Skeleton className="h-8 w-72 rounded-sm" />
					<Skeleton className="h-4 w-96 max-w-full rounded-full" />
				</div>
				<Skeleton className="h-36 w-full rounded-md" />
				<Skeleton className="h-64 w-full rounded-md" />
				<Skeleton className="h-96 w-full rounded-md" />
			</div>
		);
	}

	if (error || !submission) {
		return (
			<div className="flex justify-center">
				<Card className="mt-12 w-full max-w-md rounded-md text-center">
					<CardContent className="flex flex-col items-center gap-4 py-10">
						<span className="flex h-11 w-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
							<Lock className="h-5 w-5" aria-hidden />
						</span>
						<div className="space-y-1">
							<p className="text-base font-semibold text-foreground">Unable to load this report</p>
							<p className="text-sm leading-6 text-muted-foreground">
								{error || "Submitted audit not found."}
							</p>
						</div>
						<Button asChild variant="outline" className="mt-2 rounded-sm">
							<Link href="/auditor">
								<ArrowLeft className="h-4 w-4" aria-hidden />
								Back to dashboard
							</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	// A partial/incomplete submission payload (e.g. during backend rollout) can omit
	// participant_info entirely; default it so the report renders instead of throwing.
	const participantInfo: Record<string, unknown> = submission.participant_info ?? {};
	const normalizedWeights = normalizeWeights(participantInfo.domain_weights);
	const sectionComments =
		participantInfo.section_comments && typeof participantInfo.section_comments === "object"
			? (participantInfo.section_comments as Partial<Record<YeeDomainKey, string>>)
			: {};
	const weightingComments =
		typeof participantInfo.weighting_comments === "string" ? participantInfo.weighting_comments : "";
	const dashboardHref =
		session?.user.account_type === "MANAGER"
			? "/manager"
			: session?.user.account_type === "ADMIN"
				? "/admin"
				: "/auditor";
	const auditsHref =
		session?.user.account_type === "MANAGER"
			? "/manager/audits"
			: session?.user.account_type === "ADMIN"
				? "/admin/audits"
				: "/auditor/places";

	const placeName = submission.place_name || submission.place_id;
	const auditorLabel = submission.auditor_generated_id || submission.auditor_id;

	// R1 export: fetch the instrument (for the responses section) and hand the
	// submission to the export layer. Loaded via dynamic import so jsPDF/xlsx stay
	// out of the report bundle until an export is actually requested.
	const submissionRecord = submission; // non-null past the guards above
	async function handleExport(format: ReportDocumentFormat) {
		const [{ exportAudit }, instrument] = await Promise.all([
			import("@/features/reporting/export"),
			fetchInstrument().catch(() => null)
		]);
		await exportAudit({ submission: submissionRecord, instrument }, format);
	}

	const exportOptions = [
		{ format: "pdf" as const, label: "PDF", description: "Branded, chart-bearing report" },
		{ format: "xlsx" as const, label: "Excel", description: "Multi-sheet analysis workbook" },
		{ format: "csv" as const, label: "CSV", description: "Flat single-row data" }
	];

	return (
		<div className="space-y-6">
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

					.report-print-stack {
						display: block !important;
					}

					.report-print-stack > * {
						break-inside: avoid;
						page-break-inside: avoid;
						margin-bottom: 1rem;
					}

					.report-actions {
						display: none !important;
					}
				}
			`}</style>
			{/* Report header — the brand DashboardHero (dotted bg + YEE watermark). */}
			<div className="space-y-3">
				<Link
					href={auditsHref}
					className="report-actions inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
					<ArrowLeft className="h-3.5 w-3.5" aria-hidden />
					Back to my audits
				</Link>
				<DashboardHero
					size="compact"
					title={placeName}
					meta={
						<span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white">
							<Lock className="h-3 w-3" aria-hidden />
							Read-only report
						</span>
					}
					subtitle={
						<>
							Submitted YEE audit by <span className="font-medium text-white">{auditorLabel}</span> on{" "}
							{formatSubmittedAt(submission.submitted_at)}. Scores and comments are locked as recorded.
						</>
					}
					actions={
						<div className="report-actions flex flex-wrap items-center gap-2">
							<Button
								type="button"
								variant="outline"
								className="rounded-sm bg-white text-foreground hover:bg-emerald-50"
								onClick={() => window.print()}>
								<Printer className="h-4 w-4" aria-hidden />
								Print
							</Button>
							<ExportMenuButton
								label="Export"
								className="rounded-sm bg-white text-foreground hover:bg-emerald-50"
								options={exportOptions}
								onExport={handleExport}
							/>
						</div>
					}
				/>
			</div>

			{/* Submission overview */}
			<Card className="rounded-md">
				<CardHeader className="border-b [.border-b]:pb-5">
					<CardTitle className="text-lg tracking-tight">Submission overview</CardTitle>
					<CardDescription>Identification and visit context captured with this audit.</CardDescription>
				</CardHeader>
				<CardContent className="">
					<dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4 report-print-stack">
						<MetaField label="Place" value={placeName} />
						<MetaField label="Auditor ID" value={auditorLabel} />
						<MetaField label="Participant ID" value={String(participantInfo.participant_id || "")} />
						<MetaField label="Submitted" value={formatSubmittedAt(submission.submitted_at)} />
						<MetaField label="Audit date" value={String(participantInfo.audit_date || "")} />
						<MetaField label="Visit frequency" value={String(participantInfo.visit_frequency || "")} />
						<MetaField label="Season" value={String(participantInfo.season || "")} />
						<MetaField label="Weather" value={String(participantInfo.weather || "")} />
					</dl>
				</CardContent>
			</Card>

			{/* Section weighting */}
			<Card className="rounded-md">
				<CardHeader className="border-b [.border-b]:pb-5">
					<CardTitle className="text-lg tracking-tight">Section weighting</CardTitle>
					<CardDescription>
						Youth-Weighted values normalize the participant&apos;s section weights, average the scores
						within each section, and apply the normalized weight to that section average.
					</CardDescription>
				</CardHeader>
				<CardContent className="">
					<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 report-print-stack">
						{(Object.keys(yeeDomainLabels) as YeeDomainKey[]).map(domain => {
							const theme = yeeDomainThemes[domain];
							const weight = normalizedWeights[domain];
							return (
								<div
									key={domain}
									className="flex items-start justify-between gap-3 rounded-sm border border-border bg-card px-4 py-3.5 report-no-break">
									<div className="min-w-0">
										<p className="flex items-center gap-2.5 text-sm font-medium text-foreground">
											<span
												aria-hidden
												className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
												style={{ backgroundColor: theme.strongHex }}
											/>
											{yeeDomainLabels[domain]}
										</p>
										<p
											className={`mt-1.5 pl-5 text-xs leading-5 ${
												weight ? "text-muted-foreground" : "text-muted-foreground/70"
											}`}>
											{formatWeightLabel(weight)}
											{weight ? ` · ${weight}/3` : ""}
										</p>
									</div>
									<div className="pt-1">
										<WeightScale value={weight} />
									</div>
								</div>
							);
						})}
					</div>
					{weightingComments ? (
						<div className="mt-4 rounded-sm border border-border bg-muted/30 px-4 py-3.5 report-no-break">
							<p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
								Weighting comments
							</p>
							<p className="mt-1.5 text-sm leading-6 text-foreground/90">{weightingComments}</p>
						</div>
					) : null}
				</CardContent>
			</Card>

			<YeeScoreSummary
				score={submission.score}
				title="Score results"
				description="Read-only raw scores and Youth-Weighted averages computed from the submitted responses."
			/>

			{/* Auditor comments */}
			<Card className="rounded-md report-page-break">
				<CardHeader className="border-b [.border-b]:pb-5">
					<CardTitle className="text-lg tracking-tight">Auditor comments</CardTitle>
					<CardDescription>Narrative observations recorded alongside the scored responses.</CardDescription>
				</CardHeader>
				<CardContent className="">
					<dl className="divide-y divide-border/60">
						<CommentRow
							label="Overall"
							value={String(participantInfo.comments || "")}
							emptyText="No overall comments submitted."
						/>
						{!weightingComments ? (
							<CommentRow label="Weighting" value="" emptyText="No weighting comments submitted." />
						) : null}
						{(Object.keys(yeeDomainLabels) as YeeDomainKey[]).map(domain => (
							<CommentRow
								key={domain}
								label={yeeDomainLabels[domain]}
								value={sectionComments[domain] || ""}
								emptyText="No section comments submitted."
								dotColor={yeeDomainThemes[domain].strongHex}
							/>
						))}
					</dl>
				</CardContent>
			</Card>

			{/* Footer actions */}
			<div className="report-actions flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
				<div className="flex flex-wrap gap-2">
					<Button type="button" variant="outline" className="rounded-sm" onClick={() => window.print()}>
						<Printer className="h-4 w-4" aria-hidden />
						Print report
					</Button>
					<ExportMenuButton
						label="Export"
						className="rounded-sm"
						options={exportOptions}
						onExport={handleExport}
					/>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button asChild variant="outline" className="rounded-sm">
						<Link href={dashboardHref}>
							<LayoutDashboard className="h-4 w-4" aria-hidden />
							Dashboard
						</Link>
					</Button>
					<Button asChild className="rounded-sm">
						<Link href={auditsHref}>
							<ArrowLeft className="h-4 w-4" aria-hidden />
							Back to my audits
						</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
