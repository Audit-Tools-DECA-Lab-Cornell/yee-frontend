"use client";

import Link from "next/link";
import * as React from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchMyPlaces, type AssignedPlaceRecord } from "@/lib/dashboard/live-api";
import { fetchMyYeeAudits } from "@/lib/yee-submissions";

export function AuditorOverview() {
	const { session } = useAuth();
	const [places, setPlaces] = React.useState<AssignedPlaceRecord[]>([]);
	const [submittedCount, setSubmittedCount] = React.useState(0);
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState<string | null>(null);

	React.useEffect(() => {
		if (!session) return;
		let cancelled = false;
		const run = async () => {
			try {
				const [rows, audits] = await Promise.all([fetchMyPlaces(session), fetchMyYeeAudits(session)]);
				if (!cancelled) {
					setPlaces(rows);
					setSubmittedCount(audits.length);
				}
			} catch (err) {
				if (!cancelled) setError(err instanceof Error ? err.message : "Could not load assigned places.");
			} finally {
				if (!cancelled) setLoading(false);
			}
		};
		void run();
		return () => {
			cancelled = true;
		};
	}, [session]);

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
							Your auditor dashboard is focused on fieldwork, not management.
						</h1>
						<p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-50/80 sm:text-base">
							Only places assigned by your manager appear here, and local draft/submission state is preserved in the browser while backend assignment scope controls access.
						</p>
						<div className="mt-6 flex flex-wrap gap-3">
							<Button asChild className="rounded-2xl bg-white text-slate-950 hover:bg-emerald-50">
								<Link href="/yee/introduction">Start Audit</Link>
							</Button>
							<Button asChild variant="outline" className="rounded-2xl border-white/15 bg-white/6 text-white hover:bg-white/10 hover:text-white">
								<Link href="/my-dashboard/audits">Continue Drafts</Link>
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
						</div>
					</div>
				</div>
			</section>

			<section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
				<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
					<CardHeader>
						<CardTitle>Assigned places</CardTitle>
						<CardDescription>Only places assigned to this auditor are shown here from the backend.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						{places.length === 0 ? (
							<p className="text-sm text-slate-500">No places assigned yet.</p>
						) : (
							places.map(place => (
								<div key={place.id} className="rounded-2xl border border-slate-200 p-4">
									<p className="font-medium text-slate-900">{place.name}</p>
									<p className="mt-1 text-sm text-slate-600">{place.project}</p>
									<p className="mt-1 text-sm text-slate-500">{place.address}</p>
								</div>
							))
						)}
					</CardContent>
				</Card>

				<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
					<CardHeader>
						<CardTitle>Next actions</CardTitle>
						<CardDescription>Auditors should get direct work actions, not management actions.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						<Button asChild className="w-full rounded-2xl bg-[#10231f] text-white hover:bg-[#17302c]">
							<Link href="/yee/introduction">Start Audit</Link>
						</Button>
						<Button asChild variant="outline" className="w-full rounded-2xl">
							<Link href="/my-dashboard/audits">View My Audits</Link>
						</Button>
					</CardContent>
				</Card>
			</section>
		</div>
	);
}
