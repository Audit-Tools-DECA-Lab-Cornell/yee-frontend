"use client";

import { useSearchParams } from "next/navigation";
import * as React from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { PlaceComparisonPanel } from "@/components/reporting/place-comparison-panel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchPlaceComparisons, type PlaceComparisonGroupRecord } from "@/lib/dashboard/live-api";

function averageTotal(group: PlaceComparisonGroupRecord) {
	if (group.audits.length === 0) return 0;
	return Number((group.audits.reduce((sum, audit) => sum + audit.total_raw_score, 0) / group.audits.length).toFixed(1));
}

export function LiveReports() {
	const searchParams = useSearchParams();
	const { session } = useAuth();
	const [groups, setGroups] = React.useState<PlaceComparisonGroupRecord[]>([]);
	const [selectedPlaceId, setSelectedPlaceId] = React.useState<string>("");
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState<string | null>(null);

	React.useEffect(() => {
		if (!session) return;
		let cancelled = false;

		const run = async () => {
			setLoading(true);
			setError(null);
			try {
				const result = await fetchPlaceComparisons(session);
				if (!cancelled) {
					setGroups(result);
					setSelectedPlaceId(searchParams.get("placeId") ?? result[0]?.place_id ?? "");
				}
			} catch (err) {
				if (!cancelled) {
					setError(err instanceof Error ? err.message : "Could not load report comparisons.");
				}
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		};

		void run();
		return () => {
			cancelled = true;
		};
	}, [searchParams, session]);

	if (loading) {
		return (
			<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
				<CardContent className="p-6 text-sm text-slate-500">Loading comparison reports...</CardContent>
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

	if (groups.length === 0) {
		return (
			<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
				<CardHeader>
					<CardTitle>Reports</CardTitle>
					<CardDescription>No submitted YEE audits are available yet for comparison.</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	const selectedGroup = groups.find(group => group.place_id === selectedPlaceId) ?? groups[0];

	return (
		<div className="space-y-6">
			<div className="grid gap-6 lg:grid-cols-2">
				<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
					<CardHeader>
						<CardTitle>Report snapshots</CardTitle>
						<CardDescription>Live place-level comparisons pulled from submitted YEE audits.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4 text-sm leading-6 text-slate-600">
						{groups.slice(0, 3).map(group => (
							<div key={group.place_id} className="rounded-2xl bg-slate-50 p-4">
								<p className="font-medium text-slate-900">{group.place_name}</p>
								<p className="mt-1">{group.project_name}</p>
								<p className="mt-1">Average raw score: {averageTotal(group)}</p>
							</div>
						))}
					</CardContent>
				</Card>

				<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
					<CardHeader>
						<CardTitle>Comparison status</CardTitle>
						<CardDescription>Choose a place and compare submitted audits by generated auditor ID only.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex flex-wrap gap-2">
							{groups.map(group => (
								<button
									key={group.place_id}
									type="button"
									onClick={() => setSelectedPlaceId(group.place_id)}
									className={
										group.place_id === selectedGroup.place_id
											? "rounded-full bg-emerald-600 px-3 py-1 text-xs font-medium text-white"
											: "rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-200"
									}
								>
									{group.place_name}
								</button>
							))}
						</div>
						<Badge className="rounded-full bg-sky-100 px-3 py-1 text-sky-700 hover:bg-sky-100">
							{selectedGroup.audits.length} audits selected
						</Badge>
						<p className="text-sm leading-6 text-slate-600">
							Reports stay privacy-safe by using generated auditor IDs instead of full names.
						</p>
					</CardContent>
				</Card>
			</div>

			<PlaceComparisonPanel group={selectedGroup} />
		</div>
	);
}
