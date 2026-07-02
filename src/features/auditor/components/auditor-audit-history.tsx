"use client";

import Link from "next/link";
import * as React from "react";

import { ClearFiltersButton, SearchableMultiSelectFilter } from "@/features/workspaces/components/table-filters";
import { useAuditorAuditData } from "@/features/auditor/hooks/use-auditor-audit-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildWeightedScorePreview } from "@/features/yee-audit/scoring/yee-scoring";
import { getYouthWeightedScoreMaximum, totalRawScoreMaximum } from "@/features/yee-audit/config/yee-score-limits";

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

export function AuditorAuditHistory({
	title = "Assigned Places",
	description = "Review audits in progress and submitted audits for your assigned places.",
	showHeaderAction = true
}: {
	title?: string;
	description?: string;
	showHeaderAction?: boolean;
}) {
	const { places, auditStates, loading, error } = useAuditorAuditData();
	const [selectedProjects, setSelectedProjects] = React.useState<string[]>([]);
	const [selectedPlaceIds, setSelectedPlaceIds] = React.useState<string[]>([]);

	const projectOptions = React.useMemo(
		() =>
			Array.from(new Set(places.map(place => place.project)))
				.sort((left, right) => left.localeCompare(right))
				.map(project => ({ value: project, label: project })),
		[places]
	);

	const placeOptions = React.useMemo(
		() =>
			places
				.filter(place => selectedProjects.length === 0 || selectedProjects.includes(place.project))
				.sort((left, right) => left.name.localeCompare(right.name))
				.map(place => ({
					value: place.id,
					label: place.name,
					keywords: [place.project, place.address]
				})),
		[places, selectedProjects]
	);

	const filteredPlaces = React.useMemo(
		() =>
			places.filter(place => {
				if (selectedProjects.length > 0 && !selectedProjects.includes(place.project)) return false;
				if (selectedPlaceIds.length > 0 && !selectedPlaceIds.includes(place.id)) return false;
				return true;
			}),
		[places, selectedPlaceIds, selectedProjects]
	);

	const filtersActive = selectedProjects.length > 0 || selectedPlaceIds.length > 0;

	if (loading) {
		return (
			<Card className="rounded-lg border-slate-200/80 bg-white shadow-sm">
				<CardContent className="p-6 text-sm text-slate-500">Loading audit history...</CardContent>
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

	return (
		<Card className="rounded-lg border-slate-200/80 bg-white shadow-sm">
			<CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<CardTitle>{title}</CardTitle>
					<CardDescription>{description}</CardDescription>
				</div>
				{showHeaderAction ? null : null}
			</CardHeader>
			<CardContent className="space-y-4 overflow-x-auto">
				<div className="flex flex-wrap gap-3">
					<SearchableMultiSelectFilter
						label="Project"
						options={projectOptions}
						selectedValues={selectedProjects}
						onChange={values => {
							setSelectedProjects(values);
							if (values.length === 0) {
								setSelectedPlaceIds([]);
								return;
							}
							const allowedPlaceIds = new Set(
								places.filter(place => values.includes(place.project)).map(place => place.id)
							);
							setSelectedPlaceIds(current => current.filter(placeId => allowedPlaceIds.has(placeId)));
						}}
					/>
					<SearchableMultiSelectFilter
						label="Place"
						options={placeOptions}
						selectedValues={selectedPlaceIds}
						onChange={setSelectedPlaceIds}
					/>
					<ClearFiltersButton
						disabled={!filtersActive}
						onClick={() => {
							setSelectedProjects([]);
							setSelectedPlaceIds([]);
						}}
					/>
				</div>
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
						{filteredPlaces.length === 0 ? (
							<tr>
								<td colSpan={5} className="py-8 text-center text-sm text-slate-500">
									No assigned places match the selected filters.
								</td>
							</tr>
						) : null}
						{filteredPlaces.map(place => {
							const auditState = auditStates[place.id];
							const isSubmitted = auditState?.status === "SUBMITTED";
							const hasDraft = auditState?.status === "DRAFT";
							const preview = auditState?.score
								? buildWeightedScorePreview(
										auditState.score,
										normalizeWeights(auditState.participant_info.domain_weights)
									)
								: null;
							const youthMax = preview ? getYouthWeightedScoreMaximum(preview.selectedWeights) : 0;
							const rawPercentage =
								preview && totalRawScoreMaximum
									? (preview.totalRawScore / totalRawScoreMaximum) * 100
									: 0;
							const youthPercentage =
								preview && youthMax ? (preview.totalWeightedScore / youthMax) * 100 : 0;
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
										{auditState?.submitted_at
											? new Date(auditState.submitted_at).toLocaleDateString()
											: "-"}
									</td>
									<td className="py-4 pr-4 text-slate-600">
										{preview ? (
											<div className="space-y-1 text-xs leading-5">
												<p>
													<span className="font-medium text-slate-900">Raw Score:</span>{" "}
													{preview.totalRawScore} / {totalRawScoreMaximum} (
													{rawPercentage.toFixed(0)}%)
												</p>
												<p>
													<span className="font-medium text-emerald-900">
														Youth Weighted:
													</span>{" "}
													{preview.totalWeightedScore.toFixed(2)} / {youthMax.toFixed(2)} (
													{youthPercentage.toFixed(0)}%)
												</p>
											</div>
										) : (
											"-"
										)}
									</td>
									<td className="py-4">
										{isSubmitted ? (
											<Button asChild variant="outline" className="rounded-lg">
												<Link href={`/yee/submissions/${auditState.submission_id}`}>
													View Submission
												</Link>
											</Button>
										) : hasDraft ? (
											<Button
												asChild
												className="rounded-lg bg-[#10231f] text-white hover:bg-[#17302c]">
												<Link href={`/yee/audit/${place.id}/page/1`}>Continue In Progress</Link>
											</Button>
										) : (
											<Button asChild variant="outline" className="rounded-lg">
												<Link href={`/yee/audit/${place.id}/page/1`}>Start New Audit</Link>
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
