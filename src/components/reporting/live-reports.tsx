"use client";

import { useSearchParams } from "next/navigation";
import * as React from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { ClearFiltersButton, SearchableMultiSelectFilter } from "@/components/dashboard/table-filters";
import { PlaceComparisonPanel } from "@/components/reporting/place-comparison-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchPlaceComparisons, type PlaceComparisonGroupRecord } from "@/lib/dashboard/live-api";

function averageTotal(group: PlaceComparisonGroupRecord) {
	if (group.audits.length === 0) return 0;
	return Number((group.audits.reduce((sum, audit) => sum + audit.total_raw_score, 0) / group.audits.length).toFixed(1));
}

function averageWeighted(group: PlaceComparisonGroupRecord) {
	if (group.audits.length === 0) return 0;
	return Number((group.audits.reduce((sum, audit) => sum + audit.total_weighted_score, 0) / group.audits.length).toFixed(1));
}

function exportComparisonCsv(group: PlaceComparisonGroupRecord) {
	const headers = [
		"audit_id",
		"auditor_id",
		"place_id",
		"place_name",
		"project_id",
		"project_name",
		"date",
		"total_raw_score",
		"total_weighted_score"
	];
	const csv = [
		headers.join(","),
		...group.audits.map(audit =>
			headers
				.map(header => `"${String(audit[header as keyof typeof audit] ?? "").replace(/"/g, "\"\"")}"`)
				.join(",")
		)
	].join("\n");
	const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = `${group.project_name}-${group.place_name}-comparison.csv`.replace(/\s+/g, "-").toLowerCase();
	anchor.click();
	URL.revokeObjectURL(url);
}

export function LiveReports() {
	const searchParams = useSearchParams();
	const { session } = useAuth();
	const [groups, setGroups] = React.useState<PlaceComparisonGroupRecord[]>([]);
	const [selectedPlaceId, setSelectedPlaceId] = React.useState<string>("");
	const [selectedProjectIds, setSelectedProjectIds] = React.useState<string[]>([]);
	const [selectedPlaceIds, setSelectedPlaceIds] = React.useState<string[]>([]);
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

	const projectOptions = React.useMemo(
		() =>
			Array.from(new Map(groups.map(group => [group.project_id, { value: group.project_id, label: group.project_name }])).values()),
		[groups]
	);
	const placeOptions = React.useMemo(
		() =>
			Array.from(
				new Map(
					groups
						.filter(group => selectedProjectIds.length === 0 || selectedProjectIds.includes(group.project_id))
						.map(group => [group.place_id, { value: group.place_id, label: group.place_name }])
				).values()
			),
		[groups, selectedProjectIds]
	);
	const filteredGroups = React.useMemo(
		() =>
			groups.filter(group => {
				if (selectedProjectIds.length > 0 && !selectedProjectIds.includes(group.project_id)) return false;
				if (selectedPlaceIds.length > 0 && !selectedPlaceIds.includes(group.place_id)) return false;
				return true;
			}),
		[groups, selectedPlaceIds, selectedProjectIds]
	);
	const selectedGroup = filteredGroups.find(group => group.place_id === selectedPlaceId) ?? filteredGroups[0] ?? groups[0];
	const filtersActive = selectedProjectIds.length > 0 || selectedPlaceIds.length > 0;

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

	return (
		<div className="space-y-6">
			<div className="grid gap-6 lg:grid-cols-2">
				<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
					<CardHeader>
						<CardTitle>Report filters</CardTitle>
						<CardDescription>Choose a project and place, then open an individual or comparison report.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex flex-wrap gap-3">
							<SearchableMultiSelectFilter
								label="Project"
								options={projectOptions}
								selectedValues={selectedProjectIds}
								onChange={values => {
									setSelectedProjectIds(values);
									if (values.length === 0) {
										setSelectedPlaceIds([]);
										return;
									}
									const allowedPlaceIds = new Set(groups.filter(group => values.includes(group.project_id)).map(group => group.place_id));
									setSelectedPlaceIds(current => current.filter(placeId => allowedPlaceIds.has(placeId)));
									if (selectedPlaceId && !allowedPlaceIds.has(selectedPlaceId)) setSelectedPlaceId("");
								}}
							/>
							<SearchableMultiSelectFilter
								label="Place"
								options={placeOptions}
								selectedValues={selectedPlaceIds}
								onChange={values => {
									setSelectedPlaceIds(values);
									if (values[0]) setSelectedPlaceId(values[0]);
								}}
							/>
							<ClearFiltersButton
								disabled={!filtersActive}
								onClick={() => {
									setSelectedProjectIds([]);
									setSelectedPlaceIds([]);
									setSelectedPlaceId(groups[0]?.place_id ?? "");
								}}
							/>
						</div>
						<div className="space-y-3 text-sm leading-6 text-slate-600">
							{filteredGroups.map(group => (
								<button
									key={group.place_id}
									type="button"
									onClick={() => setSelectedPlaceId(group.place_id)}
									className={`block w-full rounded-2xl border p-4 text-left transition ${
										group.place_id === selectedGroup?.place_id
											? "border-emerald-300 bg-emerald-50"
											: "border-slate-200 bg-slate-50 hover:bg-slate-100"
									}`}
								>
									<p className="font-medium text-slate-900">{group.place_name}</p>
									<p className="mt-1 text-slate-600">{group.project_name}</p>
									<p className="mt-2 text-xs text-slate-500">{group.audits.length} submitted audits</p>
								</button>
							))}
							{filteredGroups.length === 0 ? <p className="text-sm text-slate-500">No reports match the selected filters.</p> : null}
						</div>
					</CardContent>
				</Card>

				<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
					<CardHeader>
						<CardTitle>Selected report</CardTitle>
						<CardDescription>Use these actions for a single place report or comparison export.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{selectedGroup ? (
							<div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
								<p className="font-medium text-slate-900">{selectedGroup.place_name}</p>
								<p className="mt-1">{selectedGroup.project_name}</p>
								<p className="mt-2">Average raw score: {averageTotal(selectedGroup)}</p>
								<p>Average youth-weighted score: {averageWeighted(selectedGroup)}</p>
							</div>
						) : (
							<p className="text-sm text-slate-500">Choose a place to open its report view.</p>
						)}
						<div className="flex flex-wrap gap-3">
							<Button type="button" variant="outline" className="rounded-2xl" onClick={() => window.print()} disabled={!selectedGroup}>
								Print report
							</Button>
							<Button
								type="button"
								variant="outline"
								className="rounded-2xl"
								onClick={() => selectedGroup && exportComparisonCsv(selectedGroup)}
								disabled={!selectedGroup}
							>
								Export report
							</Button>
							<Button
								type="button"
								className="rounded-2xl bg-[#10231f] text-white hover:bg-[#17302c]"
								onClick={() => selectedGroup && exportComparisonCsv(selectedGroup)}
								disabled={!selectedGroup}
							>
								Export data
							</Button>
						</div>
						{selectedGroup ? (
							<Badge className="rounded-full bg-sky-100 px-3 py-1 text-sky-700 hover:bg-sky-100">
								{selectedGroup.audits.length} audits selected
							</Badge>
						) : null}
						<p className="text-sm leading-6 text-slate-600">
							Reports use generated auditor IDs only so place comparisons stay privacy-safe.
						</p>
					</CardContent>
				</Card>
			</div>

			{selectedGroup ? <PlaceComparisonPanel group={selectedGroup} /> : null}
		</div>
	);
}
