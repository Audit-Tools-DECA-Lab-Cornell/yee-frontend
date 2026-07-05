"use client";

import Link from "next/link";
import * as React from "react";

import { AuditorAuditHistory } from "@/features/auditor/components/auditor-audit-history";
import { useAuditorAuditData } from "@/features/auditor/hooks/use-auditor-audit-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScoreCell } from "@/components/ui/score-cell";

export function AuditorOverview() {
	const { places, auditStates, submittedCount, draftCount, loading, error } = useAuditorAuditData();
	const continueAuditHref = "/auditor/places";

	if (loading) {
		return (
			<main className="mx-auto max-w-5xl p-6 text-sm text-muted-foreground">Loading auditor dashboard...</main>
		);
	}

	if (error) {
		return <main className="mx-auto max-w-5xl p-6 text-sm text-rose-600">{error}</main>;
	}

	return (
		<div className="space-y-6">
			<section className="overflow-hidden rounded-lg border border-emerald-200/60 bg-linear-to-br from-[#10231f] via-[#17302c] to-[#21483b] text-white shadow-xl shadow-emerald-950/10">
				<div className="px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
					<div>
						<Badge className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-white hover:bg-white/10">
							Assigned fieldwork
						</Badge>
						<h1 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
							Complete audits for the places assigned to you.
						</h1>
						<p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-50/80 sm:text-base">
							Use this space to start new audits, continue audits in progress, and review your submitted
							work by place name.
						</p>
						<div className="mt-6 flex flex-wrap gap-3">
							<Button asChild className="rounded-md bg-white text-foreground hover:bg-emerald-50">
								<Link href="/auditor/places">View My Audits</Link>
							</Button>
							<Button
								asChild
								variant="outline"
								className="rounded-md border-white/15 bg-white/6 text-white hover:bg-white/10 hover:text-white">
								<Link href="/yee/introduction">Start New Audit</Link>
							</Button>
							<Button
								asChild
								variant="outline"
								className="rounded-md border-white/15 bg-white/6 text-white hover:bg-white/10 hover:text-white">
								<Link href={continueAuditHref}>Continue Audits in Progress</Link>
							</Button>
						</div>
						<div className="mt-8 space-y-4">
							<p className="text-sm font-medium text-emerald-50/80">My field snapshot</p>
							<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
								<Link
									href="/auditor/places"
									className="min-w-0 rounded-md border border-emerald-200/20 bg-linear-to-br from-white/18 to-white/8 p-4 backdrop-blur-sm transition hover:border-emerald-200/35 hover:bg-white/16">
									<p className="break-words text-sm text-emerald-50/70">Assigned places</p>
									<p className="mt-2 break-words text-3xl font-semibold">{places.length}</p>
									<p className="mt-3 text-xs font-medium text-emerald-100">Open</p>
								</Link>
								<Link
									href="/auditor/places"
									className="min-w-0 rounded-md border border-sky-200/20 bg-linear-to-br from-white/18 to-white/8 p-4 backdrop-blur-sm transition hover:border-sky-200/35 hover:bg-white/16">
									<p className="break-words text-sm text-emerald-50/70">Submitted audits</p>
									<p className="mt-2 break-words text-3xl font-semibold">{submittedCount}</p>
									<p className="mt-3 text-xs font-medium text-emerald-100">Open</p>
								</Link>
								<Link
									href={continueAuditHref}
									className="min-w-0 rounded-md border border-violet-200/20 bg-linear-to-br from-white/18 to-white/8 p-4 backdrop-blur-sm transition hover:border-violet-200/35 hover:bg-white/16">
									<p className="break-words text-sm text-emerald-50/70">Audits in progress</p>
									<p className="mt-2 break-words text-3xl font-semibold">{draftCount}</p>
									<p className="mt-3 text-xs font-medium text-emerald-100">Open</p>
								</Link>
								<LatestSubmittedScores places={places} auditStates={auditStates} />
							</div>
						</div>
					</div>
				</div>
			</section>

			<section>
				<AuditorAuditHistory
					title="Assigned Places"
					description="Review audit status and the latest Raw Score and Youth Weighted average for each assigned place."
				/>
			</section>
		</div>
	);
}

function LatestSubmittedScores({
	places,
	auditStates
}: {
	places: ReturnType<typeof useAuditorAuditData>["places"];
	auditStates: ReturnType<typeof useAuditorAuditData>["auditStates"];
}) {
	const latestSubmitted = React.useMemo(() => {
		return (
			places
				.map(place => ({ place, state: auditStates[place.id] }))
				.filter(entry => entry.state?.status === "SUBMITTED" && entry.state.score)
				.sort((left, right) => {
					const leftTime = left.state?.submitted_at ? new Date(left.state.submitted_at).getTime() : 0;
					const rightTime = right.state?.submitted_at ? new Date(right.state.submitted_at).getTime() : 0;
					return rightTime - leftTime;
				})[0] ?? null
		);
	}, [auditStates, places]);

	if (!latestSubmitted?.state?.score) {
		return (
			<Link
				href="/auditor/places"
				className="min-w-0 rounded-md border border-amber-200/20 bg-linear-to-br from-white/18 to-white/8 p-4 backdrop-blur-sm transition hover:border-amber-200/35 hover:bg-white/16">
				<p className="text-sm text-emerald-50/70">Latest submitted scores</p>
				<p className="mt-2 text-sm text-emerald-50/85">
					A Raw Score and Youth Weighted average will appear here after your first submitted audit.
				</p>
				<p className="mt-3 text-xs font-medium text-emerald-100">Open</p>
			</Link>
		);
	}

	const score = latestSubmitted.state.score;

	return (
		<Link
			href={
				latestSubmitted.state.submission_id
					? `/yee/submissions/${latestSubmitted.state.submission_id}`
					: "/auditor/places"
			}
			className="min-w-0 rounded-md border border-amber-200/20 bg-linear-to-br from-white/18 to-white/8 p-4 backdrop-blur-sm transition hover:border-amber-200/35 hover:bg-white/16">
			<p className="text-sm text-emerald-50/70">Latest submitted scores</p>
			<p className="mt-2 text-sm text-emerald-50/85">{latestSubmitted.place.name}</p>
			<ScoreCell
				className="mt-3 font-medium text-white"
				tone="inverse"
				raw={score.total_raw_score}
				rawMax={score.total_raw_maximum}
				weighted={score.total_weighted_score}
				weightedMax={score.total_weighted_maximum}
			/>
			<p className="mt-3 text-xs font-medium text-emerald-100">Open</p>
		</Link>
	);
}
