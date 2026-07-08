"use client";

import Link from "next/link";
import * as React from "react";

import { AuditorAuditHistory } from "@/features/auditor/components/auditor-audit-history";
import { useAuditorAuditData } from "@/features/auditor/hooks/use-auditor-audit-data";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/ui/skeletons";
import { DashboardHero } from "@/components/ui/dashboard-hero";
import { ScoreCell } from "@/components/ui/score-cell";
import { cn } from "@/lib/utils";

export function AuditorOverview() {
	const { places, auditStates, submittedCount, draftCount, loading, error } = useAuditorAuditData();
	const continueAuditHref = "/auditor/places";

	if (loading) {
		return <TableSkeleton aria-label="Loading auditor dashboard…" />;
	}

	if (error) {
		return <main className="mx-auto max-w-5xl p-6 text-sm text-rose-600">{error}</main>;
	}

	return (
		<div className="space-y-6">
			<DashboardHero
				badge="Assigned fieldwork"
				title="Complete audits for the places assigned to you."
				subtitle="Use this space to start new audits, continue audits in progress, and review your submitted work by place name."
				statsLabel="My field snapshot"
				actions={
					<>
						<Button asChild className="bg-white text-foreground hover:bg-emerald-50">
							<Link href="/auditor/places">View My Audits</Link>
						</Button>
						<Button
							asChild
							variant="outline"
							className="border-white/15 bg-white/6 text-white hover:bg-white/10 hover:text-white">
							<Link href="/yee/introduction">Start New Audit</Link>
						</Button>
						<Button
							asChild
							variant="outline"
							className="border-white/15 bg-white/6 text-white hover:bg-white/10 hover:text-white">
							<Link href={continueAuditHref}>Continue Audits in Progress</Link>
						</Button>
					</>
				}
				stats={[
					{ label: "Assigned places", value: places.length, href: "/auditor/places" },
					{ label: "Submitted audits", value: submittedCount, href: "/auditor/places" },
					{ label: "Audits in progress", value: draftCount, href: continueAuditHref }
				]}>
				<LatestSubmittedScores places={places} auditStates={auditStates} />
			</DashboardHero>

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

	const tileClass =
		"min-w-0 rounded-md border border-white/15 bg-linear-to-br from-white/[0.18] to-white/[0.07] p-4 backdrop-blur-sm transition hover:border-white/30 hover:bg-white/[0.16]";

	if (!latestSubmitted?.state?.score) {
		return (
			<Link
				href="/auditor/places"
				className={cn("block transition hover:border-white/30 hover:bg-white/16", tileClass)}>
				<p className="text-xs font-medium tracking-wide text-emerald-50/70 uppercase">
					Latest submitted scores
				</p>
				<p className="mt-2 text-sm text-emerald-50/85">
					A Raw Score and Youth Weighted average will appear here after your first submitted audit.
				</p>
				<ScoreCell
					className="mt-3 font-medium text-xs text-white"
					tone="inverse"
					showRaw={false}
					showWeighted={false}
				/>
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
			className={cn("block transition hover:border-white/30 hover:bg-white/16", tileClass)}>
			<p className="text-xs font-medium tracking-wide text-emerald-50/70 uppercase">Latest submitted scores</p>
			<p className="mt-2 text-sm text-emerald-50/85">{latestSubmitted.place.name}</p>
			<ScoreCell
				className="mt-3 font-medium text-xs text-white"
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
