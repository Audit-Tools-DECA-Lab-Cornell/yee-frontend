"use client";

import Link from "next/link";
import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { ClearFiltersButton, SearchableMultiSelectFilter } from "@/features/workspaces/components/table-filters";
import { useAuditorAuditData } from "@/features/auditor/hooks/use-auditor-audit-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { TableSkeleton } from "@/components/ui/skeletons";
import type { StatusTone } from "@/lib/status";

type AssignedPlace = ReturnType<typeof useAuditorAuditData>["places"][number];
type AuditState = ReturnType<typeof useAuditorAuditData>["auditStates"][string];

function auditStatusMeta(state: AuditState | undefined): { label: string; tone: StatusTone } {
	if (state?.status === "SUBMITTED") return { label: "Submitted / Locked", tone: "success" };
	if (state?.status === "DRAFT") return { label: "Draft", tone: "warning" };
	return { label: "Not started", tone: "secondary" };
}

function participantIdLabel(state: AuditState | undefined): string {
	const value = state?.participant_info?.participant_id;
	return typeof value === "string" && value.trim() ? value : "—";
}

function ScoreCellContent({ state }: { state: AuditState | undefined }) {
	const score = state?.score ?? null;
	if (!score) return <span className="text-muted-foreground">—</span>;
	const rawMax = score.total_raw_maximum ?? 0;
	const youthMax = score.total_weighted_maximum ?? 0;
	const rawPct = rawMax ? (score.total_raw_score / rawMax) * 100 : 0;
	const youthPct = youthMax ? (score.total_weighted_score / youthMax) * 100 : 0;
	return (
		<div className="space-y-1 text-xs leading-5 tabular-nums">
			<p>
				<span className="font-medium text-foreground">Raw:</span> {score.total_raw_score} / {rawMax} (
				{rawPct.toFixed(0)}%)
			</p>
			<p>
				<span className="font-medium text-foreground">Youth Weighted:</span>{" "}
				{score.total_weighted_score.toFixed(2)} / {youthMax.toFixed(2)} ({youthPct.toFixed(0)}%)
			</p>
		</div>
	);
}

function AuditActionButton({ place, state }: { place: AssignedPlace; state: AuditState | undefined }) {
	if (state?.status === "SUBMITTED") {
		return (
			<Button asChild variant="outline" size="sm">
				<Link href={`/yee/submissions/${state.submission_id}`}>View Submission</Link>
			</Button>
		);
	}
	if (state?.status === "DRAFT") {
		return (
			<Button asChild size="sm">
				<Link href={`/yee/audit/${place.id}/page/1`}>Continue In Progress</Link>
			</Button>
		);
	}
	return (
		<Button asChild variant="outline" size="sm">
			<Link href={`/yee/audit/${place.id}/page/1`}>Start New Audit</Link>
		</Button>
	);
}

function AuditHistoryMobileCard({ place, state }: { place: AssignedPlace; state: AuditState | undefined }) {
	const status = auditStatusMeta(state);
	return (
		<div className="space-y-3 rounded-md border border-border bg-card p-4">
			<div className="flex items-start justify-between gap-3">
				<p className="font-medium text-foreground">{place.name}</p>
				<StatusBadge label={status.label} tone={status.tone} />
			</div>
			{participantIdLabel(state) !== "—" ? (
				<p className="text-sm text-muted-foreground">Participant {participantIdLabel(state)}</p>
			) : null}
			<ScoreCellContent state={state} />
			<AuditActionButton place={place} state={state} />
		</div>
	);
}

export function AuditorAuditHistory({
	title = "Assigned Places",
	description = "Review audits in progress and submitted audits for your assigned places."
}: {
	title?: string;
	description?: string;
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

	const columns = React.useMemo<ColumnDef<AssignedPlace>[]>(
		() => [
			{
				accessorKey: "name",
				header: "Place",
				cell: ({ row }) => <span className="font-medium text-foreground">{row.original.name}</span>
			},
			{
				id: "participant",
				header: "Participant ID",
				enableSorting: false,
				cell: ({ row }) => (
					<span className="text-muted-foreground">{participantIdLabel(auditStates[row.original.id])}</span>
				)
			},
			{
				id: "status",
				header: "Status",
				enableSorting: false,
				cell: ({ row }) => {
					const meta = auditStatusMeta(auditStates[row.original.id]);
					return <StatusBadge label={meta.label} tone={meta.tone} />;
				}
			},
			{
				id: "submitted",
				header: "Submitted At",
				enableSorting: false,
				cell: ({ row }) => {
					const state = auditStates[row.original.id];
					return (
						<span className="text-muted-foreground">
							{state?.submitted_at ? new Date(state.submitted_at).toLocaleDateString() : "—"}
						</span>
					);
				}
			},
			{
				id: "score",
				header: "Score",
				enableSorting: false,
				cell: ({ row }) => <ScoreCellContent state={auditStates[row.original.id]} />
			},
			{
				id: "action",
				header: "",
				enableSorting: false,
				cell: ({ row }) => <AuditActionButton place={row.original} state={auditStates[row.original.id]} />
			}
		],
		[auditStates]
	);

	if (loading) {
		return <TableSkeleton aria-label="Loading audit history…" />;
	}

	if (error) {
		return (
			<Card className="rounded-md border-rose-200 bg-rose-50 shadow-sm">
				<CardContent className="p-6 text-sm text-rose-700">{error}</CardContent>
			</Card>
		);
	}

	const toolbar = (
		<div className="flex flex-wrap items-center gap-3">
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
	);

	return (
		<Card className="rounded-md border-slate-200/80 bg-white shadow-sm">
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent>
				<DataTable
					columns={columns}
					data={filteredPlaces}
					getRowId={row => row.id}
					toolbar={toolbar}
					noResults="No assigned places match the selected filters."
					emptyState={
						<EmptyState
							title="No assigned places"
							description="You have no assigned places yet. They will appear here once a manager assigns you."
						/>
					}
					mobileCard={place => <AuditHistoryMobileCard place={place} state={auditStates[place.id]} />}
				/>
			</CardContent>
		</Card>
	);
}
