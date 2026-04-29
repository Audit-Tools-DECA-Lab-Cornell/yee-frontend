"use client";

import Link from "next/link";

import { AuditorAuditHistory } from "@/components/yee/auditor-audit-history";
import { useAuditorAuditData } from "@/components/yee/use-auditor-audit-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function AuditorOverview() {
	const { places, submittedCount, draftCount, firstDraftPlaceId, loading, error } = useAuditorAuditData();
	const continueAuditHref = firstDraftPlaceId ? `/yee/audit/${firstDraftPlaceId}/page/1` : "/my-dashboard/places";

	if (loading) {
		return <main className="mx-auto max-w-5xl p-6 text-sm text-slate-500">Loading auditor dashboard...</main>;
	}

	if (error) {
		return <main className="mx-auto max-w-5xl p-6 text-sm text-rose-600">{error}</main>;
	}

	return (
		<div className="space-y-6">
			<section className="overflow-hidden rounded-[2rem] border border-emerald-200/60 bg-linear-to-br from-[#10231f] via-[#17302c] to-[#21483b] text-white shadow-xl shadow-emerald-950/10">
				<div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:px-10 lg:py-10">
					<div>
						<Badge className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-white hover:bg-white/10">
							Assigned fieldwork
						</Badge>
						<h1 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
							Complete audits for the places assigned to you.
						</h1>
						<p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-50/80 sm:text-base">
							Use this space to start new audits, continue audits in progress, and review your submitted work by place name.
						</p>
						<div className="mt-6 flex flex-wrap gap-3">
							<Button asChild className="rounded-2xl bg-white text-slate-950 hover:bg-emerald-50">
								<Link href="/my-dashboard/places">View My Audits</Link>
							</Button>
							<Button asChild variant="outline" className="rounded-2xl border-white/15 bg-white/6 text-white hover:bg-white/10 hover:text-white">
								<Link href="/yee/introduction">Start New Audit</Link>
							</Button>
							<Button asChild variant="outline" className="rounded-2xl border-white/15 bg-white/6 text-white hover:bg-white/10 hover:text-white">
								<Link href={continueAuditHref}>Continue Audits in Progress</Link>
							</Button>
						</div>
					</div>
					<div className="rounded-[1.75rem] border border-white/10 bg-white/8 p-5 backdrop-blur-sm">
						<p className="text-sm font-medium text-emerald-50/80">My field snapshot</p>
						<div className="mt-5 grid gap-4">
							<div className="rounded-2xl bg-white/10 p-4">
								<p className="text-sm text-emerald-50/70">Assigned places</p>
								<p className="mt-2 text-3xl font-semibold">{places.length}</p>
							</div>
							<div className="rounded-2xl bg-white/10 p-4">
								<p className="text-sm text-emerald-50/70">Submitted audits</p>
								<p className="mt-2 text-3xl font-semibold">{submittedCount}</p>
							</div>
							<div className="rounded-2xl bg-white/10 p-4">
								<p className="text-sm text-emerald-50/70">Audits in progress</p>
								<p className="mt-2 text-3xl font-semibold">{draftCount}</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section>
				<AuditorAuditHistory title="Assigned Places" description="Review audit status and use the correct action for each assigned place." />
			</section>
		</div>
	);
}
