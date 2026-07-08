"use client";

import * as React from "react";
import { Database } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { useAuth } from "@/features/auth/components/auth-provider";
import { ClearFiltersButton, SearchableMultiSelectFilter } from "@/features/workspaces/components/table-filters";
import { ExportMenuButton, type ExportMenuOption } from "@/features/reporting/components/export-menu-button";
import { BulkAuditZipButton } from "@/features/reporting/components/bulk-audit-zip-button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { DashboardHero } from "@/components/ui/dashboard-hero";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchRawData, type RawDataRecord } from "@/features/workspaces/api/live-api";
import { formatNumber } from "@/lib/format";

type RawDataFormat = "csv" | "xlsx";

const rawDataFormatOptions: ExportMenuOption<RawDataFormat>[] = [
	{ format: "csv", label: "CSV", description: "Flat data (legacy format)" },
	{ format: "xlsx", label: "Excel", description: "Styled workbook + Data Dictionary" }
];

/** Generate a raw-data export for the given scope via the dynamically-loaded export layer. */
async function exportScope(rows: RawDataRecord[], format: RawDataFormat, scope: "all" | "filtered" | "selected") {
	const { exportRawData } = await import("@/features/reporting/export");
	await exportRawData(rows, format, scope);
}

/** Two-decimal youth-weighted average, or an em dash while scores roll out. */
function formatWeightedAverage(value?: number | null): string {
	return value == null ? "—" : value.toFixed(2);
}

export function LiveRawDataTable({
	scope,
	title,
	description
}: {
	scope: "admin" | "manager";
	title: string;
	description: string;
}) {
	const { session } = useAuth();
	const [rows, setRows] = React.useState<RawDataRecord[]>([]);
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState<string | null>(null);
	const [selectedOrganizations, setSelectedOrganizations] = React.useState<string[]>([]);
	const [selectedProjectIds, setSelectedProjectIds] = React.useState<string[]>([]);
	const [selectedPlaceIds, setSelectedPlaceIds] = React.useState<string[]>([]);
	const [selectedAuditIds, setSelectedAuditIds] = React.useState<string[]>([]);

	React.useEffect(() => {
		if (!session) return;
		let cancelled = false;

		const run = async () => {
			setLoading(true);
			setError(null);
			try {
				const result = await fetchRawData(session);
				if (!cancelled) {
					setRows(result);
				}
			} catch (err) {
				if (!cancelled) {
					setError(err instanceof Error ? err.message : "Could not load raw data.");
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
	}, [session]);

	if (loading) {
		return (
			<Card>
				<CardContent className="space-y-3 pt-2">
					<Skeleton className="h-5 w-48" />
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-3/4" />
				</CardContent>
			</Card>
		);
	}

	if (error) {
		return (
			<Card elevation="flat">
				<CardContent className="pt-2">
					<p
						role="alert"
						className="rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
						{error}
					</p>
				</CardContent>
			</Card>
		);
	}

	const organizationOptions = Array.from(
		new Map(
			rows
				.map(row => row.organization)
				.filter(Boolean)
				.map(organization => [organization, { value: organization, label: organization }])
		).values()
	);
	const projectOptions = Array.from(
		new Map(
			rows
				.filter(row => selectedOrganizations.length === 0 || selectedOrganizations.includes(row.organization))
				.map(row => [row.project_id, { value: row.project_id, label: row.project_name }])
		).values()
	);
	const placeOptions = Array.from(
		new Map(
			rows
				.filter(row => selectedOrganizations.length === 0 || selectedOrganizations.includes(row.organization))
				.filter(row => selectedProjectIds.length === 0 || selectedProjectIds.includes(row.project_id))
				.map(row => [row.place_id, { value: row.place_id, label: row.place_name }])
		).values()
	);
	const filteredRows = rows.filter(row => {
		if (selectedOrganizations.length > 0 && !selectedOrganizations.includes(row.organization)) return false;
		if (selectedProjectIds.length > 0 && !selectedProjectIds.includes(row.project_id)) return false;
		if (selectedPlaceIds.length > 0 && !selectedPlaceIds.includes(row.place_id)) return false;
		return true;
	});
	const selectedRows = filteredRows.filter(row => selectedAuditIds.includes(row.audit_id));
	const filtersActive =
		selectedOrganizations.length > 0 || selectedProjectIds.length > 0 || selectedPlaceIds.length > 0;

	function toggleRow(auditId: string) {
		setSelectedAuditIds(current =>
			current.includes(auditId) ? current.filter(id => id !== auditId) : [...current, auditId]
		);
	}

	// Fresh each render so the selection checkboxes stay in sync; the raw-data
	// export is admin-only and small, so re-deriving the table is inexpensive.
	const rawDataColumns: ColumnDef<RawDataRecord>[] = [
		{
			id: "select",
			enableSorting: false,
			header: () => {
				const auditIds = filteredRows.map(row => row.audit_id);
				const everySelected = auditIds.length > 0 && auditIds.every(id => selectedAuditIds.includes(id));
				const someSelected = auditIds.some(id => selectedAuditIds.includes(id));
				return (
					<input
						type="checkbox"
						aria-label="Select all audits"
						ref={el => {
							if (el) el.indeterminate = someSelected && !everySelected;
						}}
						checked={everySelected}
						onChange={() =>
							setSelectedAuditIds(current => {
								const ids = filteredRows.map(row => row.audit_id);
								const all = ids.length > 0 && ids.every(id => current.includes(id));
								return all
									? current.filter(id => !ids.includes(id))
									: Array.from(new Set([...current, ...ids]));
							})
						}
					/>
				);
			},
			cell: ({ row }) => (
				<input
					type="checkbox"
					aria-label={`Select audit for ${row.original.place_name}`}
					checked={selectedAuditIds.includes(row.original.audit_id)}
					onChange={() => toggleRow(row.original.audit_id)}
				/>
			)
		},
		{
			accessorKey: "organization",
			header: "Organization",
			cell: ({ getValue }) => <span className="text-muted-foreground">{String(getValue())}</span>
		},
		{
			accessorKey: "auditor_generated_id",
			header: "Auditor ID",
			cell: ({ getValue }) => (
				<span className="font-mono text-xs text-muted-foreground">{String(getValue())}</span>
			)
		},
		{
			accessorKey: "place_name",
			header: "Place",
			cell: ({ getValue }) => <span className="font-medium text-foreground">{String(getValue())}</span>
		},
		{
			accessorKey: "project_name",
			header: "Project",
			cell: ({ getValue }) => <span className="text-muted-foreground">{String(getValue())}</span>
		},
		{
			accessorKey: "total_raw_score",
			header: "Raw score",
			cell: ({ row }) => (
				<span className="tabular-nums text-foreground">{formatNumber(row.original.total_raw_score)}</span>
			)
		},
		{
			accessorKey: "total_weighted_score",
			header: "Youth weighted avg",
			cell: ({ row }) => (
				<span className="tabular-nums text-foreground">
					{formatWeightedAverage(row.original.total_weighted_score)}
				</span>
			)
		}
	];

	const rawDataMobileCard = (row: RawDataRecord) => (
		<div className="space-y-2 rounded-md border border-border bg-card p-4">
			<div className="flex items-start gap-3">
				<input
					type="checkbox"
					aria-label={`Select audit for ${row.place_name}`}
					className="mt-1"
					checked={selectedAuditIds.includes(row.audit_id)}
					onChange={() => toggleRow(row.audit_id)}
				/>
				<div className="min-w-0 flex-1">
					<p className="font-medium text-foreground">{row.place_name}</p>
					<p className="text-sm text-muted-foreground">
						{row.project_name} · {row.organization}
					</p>
					<p className="font-mono text-xs text-muted-foreground">{row.auditor_generated_id}</p>
				</div>
			</div>
			<div className="flex justify-between text-sm tabular-nums text-foreground">
				<span>Raw: {formatNumber(row.total_raw_score)}</span>
				<span>Youth weighted: {formatWeightedAverage(row.total_weighted_score)}</span>
			</div>
		</div>
	);

	const toolbar = (
		<div className="flex flex-col flex-wrap items-start gap-3">
			<div className="flex flex-wrap justify-start items-start w-full gap-3">
				<SearchableMultiSelectFilter
					label="Organization"
					options={organizationOptions}
					selectedValues={selectedOrganizations}
					onChange={values => {
						setSelectedOrganizations(values);
						const scopedRows = rows.filter(row => values.length === 0 || values.includes(row.organization));
						const allowedProjectIds = new Set(scopedRows.map(row => row.project_id));
						const allowedPlaceIds = new Set(scopedRows.map(row => row.place_id));
						setSelectedProjectIds(current => current.filter(projectId => allowedProjectIds.has(projectId)));
						setSelectedPlaceIds(current => current.filter(placeId => allowedPlaceIds.has(placeId)));
						setSelectedAuditIds([]);
					}}
				/>
				<SearchableMultiSelectFilter
					label="Project"
					options={projectOptions}
					selectedValues={selectedProjectIds}
					onChange={values => {
						setSelectedProjectIds(values);
						if (values.length === 0) {
							setSelectedPlaceIds([]);
							setSelectedAuditIds([]);
							return;
						}
						const allowedPlaceIds = new Set(
							rows.filter(row => values.includes(row.project_id)).map(row => row.place_id)
						);
						setSelectedPlaceIds(current => current.filter(placeId => allowedPlaceIds.has(placeId)));
						setSelectedAuditIds([]);
					}}
				/>
				<SearchableMultiSelectFilter
					label="Place"
					options={placeOptions}
					selectedValues={selectedPlaceIds}
					onChange={values => {
						setSelectedPlaceIds(values);
						setSelectedAuditIds([]);
					}}
				/>
				<ClearFiltersButton
					disabled={!filtersActive}
					onClick={() => {
						setSelectedOrganizations([]);
						setSelectedProjectIds([]);
						setSelectedPlaceIds([]);
						setSelectedAuditIds([]);
					}}
				/>
			</div>
			<div className="flex flex-wrap justify-start items-start w-full gap-3">
				<ExportMenuButton
					label="Export all"
					options={rawDataFormatOptions}
					onExport={format => exportScope(rows, format, "all")}
				/>
				<ExportMenuButton
					label="Export filtered"
					options={rawDataFormatOptions}
					onExport={format => exportScope(filteredRows, format, "filtered")}
				/>
				<ExportMenuButton
					label="Export selected"
					options={rawDataFormatOptions}
					onExport={format => exportScope(selectedRows, format, "selected")}
					disabled={selectedRows.length === 0}
					disabledReason="Select at least one row to export"
				/>
				<BulkAuditZipButton auditIds={filteredRows.map(row => row.audit_id)} />
			</div>
		</div>
	);

	return (
		<div className="space-y-6">
			<DashboardHero size="compact" title={title} subtitle={description} />
			<Card>
				<CardContent>
					{rows.length === 0 ? (
						<EmptyState
							icon={Database}
							title="No audit data yet"
							description={`No submitted YEE audits are available for ${scope} export. Data will appear here once audits are completed and submitted.`}
						/>
					) : (
						<DataTable
							columns={rawDataColumns}
							data={filteredRows}
							getRowId={row => row.audit_id}
							noResults="No raw data rows match the selected filters."
							mobileCard={rawDataMobileCard}
							toolbar={toolbar}
						/>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
