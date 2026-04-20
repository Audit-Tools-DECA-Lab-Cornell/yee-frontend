"use client";

import Link from "next/link";
import * as React from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchMyPlaces, type AssignedPlaceRecord } from "@/lib/dashboard/live-api";
import { fetchAuditState, type YeeAuditState } from "@/lib/yee-audit-api";

export function AuditorAuditHistory() {
	const { session } = useAuth();
	const [places, setPlaces] = React.useState<AssignedPlaceRecord[]>([]);
	const [auditStates, setAuditStates] = React.useState<Record<string, YeeAuditState>>({});
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState<string | null>(null);

	React.useEffect(() => {
		if (!session) return;
		let cancelled = false;
		const run = async () => {
			try {
				const rows = await fetchMyPlaces(session);
				const states = await Promise.all(rows.map(place => fetchAuditState(place.id, session)));
				if (!cancelled) {
					setPlaces(rows);
					setAuditStates(Object.fromEntries(states.map(state => [state.place_id, state])));
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
		return (
			<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
				<CardContent className="p-6 text-sm text-slate-500">Loading audit history...</CardContent>
			</Card>
		);
	}

	if (error) {
		return (
			<Card className="rounded-[1.75rem] border-rose-200 bg-rose-50 shadow-sm">
				<CardContent className="p-6 text-sm text-rose-700">{error}</CardContent>
			</Card>
		);
	}

	return (
		<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
			<CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<CardTitle>My Audits</CardTitle>
					<CardDescription>Assigned places with live backend draft and submission state.</CardDescription>
				</div>
				<Button asChild variant="outline" className="rounded-2xl">
					<Link href="/yee/introduction">Open place picker</Link>
				</Button>
			</CardHeader>
			<CardContent className="overflow-x-auto">
				<table className="min-w-full text-left text-sm">
					<thead className="text-slate-500">
						<tr className="border-b border-slate-200">
							<th className="py-3 pr-4 font-medium">Place</th>
							<th className="py-3 pr-4 font-medium">Status</th>
							<th className="py-3 pr-4 font-medium">Submitted At</th>
							<th className="py-3 pr-4 font-medium">Score</th>
							<th className="py-3 font-medium">Action</th>
						</tr>
					</thead>
					<tbody>
						{places.map(place => {
							const auditState = auditStates[place.id];
							const isSubmitted = auditState?.status === "SUBMITTED";
							const hasDraft = auditState?.status === "DRAFT";
							return (
								<tr key={place.id} className="border-b border-slate-100 last:border-0">
									<td className="py-4 pr-4 font-medium text-slate-900">{place.name}</td>
									<td className="py-4 pr-4">
										<Badge
											variant="secondary"
											className={
												isSubmitted
													? "rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
													: hasDraft
														? "rounded-full bg-amber-100 text-amber-700 hover:bg-amber-100"
														: "rounded-full bg-sky-100 text-sky-700 hover:bg-sky-100"
											}>
											{isSubmitted ? "Submitted / Locked" : hasDraft ? "Draft" : "Not started"}
										</Badge>
									</td>
									<td className="py-4 pr-4 text-slate-600">
										{auditState?.submitted_at ? new Date(auditState.submitted_at).toLocaleDateString() : "-"}
									</td>
									<td className="py-4 pr-4 text-slate-600">{auditState?.score?.total_score ?? "-"}</td>
									<td className="py-4">
										{isSubmitted ? (
											<Button asChild variant="outline" className="rounded-2xl">
												<Link href={`/yee/submissions/${auditState.submission_id}`}>View</Link>
											</Button>
										) : hasDraft ? (
											<Button asChild className="rounded-2xl bg-[#10231f] text-white hover:bg-[#17302c]">
												<Link href={`/yee/audit/${place.id}/page/1`}>Continue</Link>
											</Button>
										) : (
											<Button asChild variant="outline" className="rounded-2xl">
												<Link href={`/yee/audit/${place.id}/page/1`}>Start</Link>
											</Button>
										)}
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</CardContent>
		</Card>
	);
}
