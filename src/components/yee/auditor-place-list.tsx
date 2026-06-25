"use client";

import Link from "next/link";
import * as React from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchMyPlaces, type AssignedPlaceRecord } from "@/lib/dashboard/live-api";
import { fetchAuditState, type YeeAuditState } from "@/lib/yee-audit-api";

export function AuditorPlaceList({ compact = false }: { compact?: boolean }) {
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
				const states = await Promise.all(rows.map(place => fetchAuditState(place.id)));
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
			<Card className="rounded-lg border-slate-200/80 bg-white shadow-sm">
				<CardContent className="p-6 text-sm text-slate-500">Loading assigned places...</CardContent>
			</Card>
		);
	}

	if (error) {
		return (
			<Card className="rounded-lg border-rose-200 bg-rose-50 shadow-sm">
				<CardContent className="p-6 text-sm text-rose-700">{error}</CardContent>
			</Card>
		);
	}

	if (places.length === 0) {
		return (
			<Card className="rounded-lg border-slate-200/80 bg-white shadow-sm">
				<CardHeader>
					<CardTitle>My Audits</CardTitle>
					<CardDescription>No places have been assigned yet.</CardDescription>
				</CardHeader>
				<CardContent className="text-sm text-slate-600">
					Your manager needs to assign at least one place before you can start a YEE audit.
				</CardContent>
			</Card>
		);
	}

	const visiblePlaces = places.slice(0, compact ? 3 : places.length);
	const content = visiblePlaces.map(place => {
		const auditState = auditStates[place.id];
		const isSubmitted = auditState?.status === "SUBMITTED";
		const hasDraft = auditState?.status === "DRAFT";

		return (
			<div
				key={place.id}
				className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<p className="font-medium text-slate-900">{place.name}</p>
					<p className="mt-1 text-sm text-slate-600">{place.project}</p>
					<div className="mt-2 flex flex-wrap gap-2">
						{isSubmitted ? (
							<Badge className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700 hover:bg-emerald-100">
								Submitted / Locked
							</Badge>
						) : hasDraft ? (
							<Badge className="rounded-full bg-amber-100 px-3 py-1 text-amber-700 hover:bg-amber-100">
								Draft in progress
							</Badge>
						) : (
							<Badge className="rounded-full bg-sky-100 px-3 py-1 text-sky-700 hover:bg-sky-100">
								Ready to start
							</Badge>
						)}
					</div>
				</div>
				<div className="flex flex-wrap gap-2">
					{isSubmitted ? (
						<Button asChild variant="outline" className="rounded-lg">
							<Link href={`/yee/submissions/${auditState.submission_id}`}>View Submission</Link>
						</Button>
					) : hasDraft ? (
						<Button asChild className="rounded-lg bg-[#10231f] text-white hover:bg-[#17302c]">
							<Link href={`/yee/audit/${place.id}/page/1`}>Continue In Progress</Link>
						</Button>
					) : (
						<Button asChild className="rounded-lg bg-[#10231f] text-white hover:bg-[#17302c]">
							<Link href={`/yee/audit/${place.id}/page/1`}>Start Audit</Link>
						</Button>
					)}
				</div>
			</div>
		);
	});

	if (compact) {
		return <div className="space-y-3">{content}</div>;
	}

	return (
		<Card className="rounded-lg border-slate-200/80 bg-white shadow-sm">
			<CardHeader>
				<div>
					<CardTitle>My Audits</CardTitle>
					<CardDescription>
						Choose a place by name and continue the correct audit action for that place.
					</CardDescription>
				</div>
			</CardHeader>
			<CardContent className="space-y-3">{content}</CardContent>
		</Card>
	);
}
