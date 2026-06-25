"use client";

import * as React from "react";
import { Database } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { ClearFiltersButton, SearchableMultiSelectFilter } from "@/components/dashboard/table-filters";
import { ExportCsvButton } from "@/components/reporting/export-csv-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchRawData, type RawDataRecord } from "@/lib/dashboard/live-api";
import { formatNumber } from "@/lib/format";

function toExportRows(rows: RawDataRecord[]) {
	return rows.map(row => {
		const base: Record<string, string | number> = {
			Organization: row.organization,
			"Auditor ID": row.auditor_generated_id,
			Place: row.place_name,
			Project: row.project_name,
			Date: row.date,
			"Submitted At": row.submitted_at,
			"Start Time": row.start_time,
			"Finish Time": row.finish_time,
			"Total Minutes": row.total_minutes,
			"Visit Frequency": row.visit_frequency,
			Season: row.season,
			Weather: row.weather,
			Comments: row.comments,
			"Raw Access": row.raw_access,
			"Raw Activity Spaces": row.raw_activity_spaces,
			"Raw Amenities": row.raw_amenities,
			"Raw Experience of the Space": row.raw_experience_of_space,
			"Raw Aesthetics and Care": row.raw_aesthetics_and_care,
			"Raw Use and Usability": row.raw_use_and_usability,
			"Youth Weighted Access": row.weighted_access,
			"Youth Weighted Activity Spaces": row.weighted_activity_spaces,
			"Youth Weighted Amenities": row.weighted_amenities,
			"Youth Weighted Experience of the Space": row.weighted_experience_of_space,
			"Youth Weighted Aesthetics and Care": row.weighted_aesthetics_and_care,
			"Youth Weighted Use and Usability": row.weighted_use_and_usability,
			"Total Raw Score": row.total_raw_score,
			"Total Youth Weighted Average": row.total_weighted_score
		};
		for (const [key, value] of Object.entries(row.domain_weights)) {
			base[`Domain Weight ${key}`] = value;
		}
		for (const [key, value] of Object.entries(row.responses)) {
			base[`Response ${key}`] = value;
		}
		return base;
	});
}

export function LiveRawDataTable({
	scope,
	filename,
	title,
	description
}: {
	scope: "admin" | "manager";
	filename: string;
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

	return (
		<Card>
			<CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<CardTitle>{title}</CardTitle>
					<CardDescription>{description}</CardDescription>
				</div>
				<div className="flex flex-wrap gap-2">
					<ExportCsvButton filename={filename} rows={toExportRows(rows)} label="Export All" />
					<ExportCsvButton
						filename={`filtered-${filename}`}
						rows={toExportRows(filteredRows)}
						label="Export Filtered"
					/>
					<ExportCsvButton
						filename={`selected-${filename}`}
						rows={toExportRows(selectedRows)}
						label="Export Selected"
					/>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Filter toolbar */}
				<div className="flex flex-wrap gap-2">
					<SearchableMultiSelectFilter
						label="Organization"
						options={organizationOptions}
						selectedValues={selectedOrganizations}
						onChange={values => {
							setSelectedOrganizations(values);
							const scopedRows = rows.filter(
								row => values.length === 0 || values.includes(row.organization)
							);
							const allowedProjectIds = new Set(scopedRows.map(row => row.project_id));
							const allowedPlaceIds = new Set(scopedRows.map(row => row.place_id));
							setSelectedProjectIds(current =>
								current.filter(projectId => allowedProjectIds.has(projectId))
							);
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

				{rows.length === 0 ? (
					<EmptyState
						icon={Database}
						title="No audit data yet"
						description={`No submitted YEE audits are available for ${scope} export. Data will appear here once audits are completed and submitted.`}
					/>
				) : (
					<div className="overflow-x-auto rounded-md border border-border">
						<table
							className="min-w-full text-left text-sm"
							aria-label={`${title} - ${filteredRows.length} rows`}>
							<caption className="sr-only">
								{title}: {filteredRows.length} of {rows.length} audit records shown
							</caption>
							<thead>
								<tr className="border-b border-border bg-muted/40">
									<th
										scope="col"
										className="py-3 pl-4 pr-3 text-xs font-medium text-muted-foreground">
										Select
									</th>
									<th scope="col" className="py-3 pr-4 text-xs font-medium text-muted-foreground">
										Organization
									</th>
									<th scope="col" className="py-3 pr-4 text-xs font-medium text-muted-foreground">
										Auditor ID
									</th>
									<th scope="col" className="py-3 pr-4 text-xs font-medium text-muted-foreground">
										Place
									</th>
									<th scope="col" className="py-3 pr-4 text-xs font-medium text-muted-foreground">
										Project
									</th>
									<th
										scope="col"
										className="py-3 pr-4 text-right text-xs font-medium text-muted-foreground">
										Raw Score
									</th>
									<th
										scope="col"
										className="py-3 pr-4 text-right text-xs font-medium text-muted-foreground">
										Youth Weighted Avg
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border">
								{filteredRows.length === 0 ? (
									<tr>
										<td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
											No raw data rows match the selected filters.
										</td>
									</tr>
								) : (
									filteredRows.map(row => (
										<tr key={row.audit_id} className="hover:bg-muted/30 transition-colors">
											<td className="py-3 pl-4 pr-3">
												<input
													type="checkbox"
													aria-label={`Select audit for ${row.place_name}`}
													checked={selectedAuditIds.includes(row.audit_id)}
													onChange={() =>
														setSelectedAuditIds(current =>
															current.includes(row.audit_id)
																? current.filter(id => id !== row.audit_id)
																: [...current, row.audit_id]
														)
													}
												/>
											</td>
											<td className="py-3 pr-4 text-muted-foreground">{row.organization}</td>
											<td className="py-3 pr-4 font-mono text-xs text-muted-foreground">
												{row.auditor_generated_id}
											</td>
											<td className="py-3 pr-4 font-medium text-foreground">{row.place_name}</td>
											<td className="py-3 pr-4 text-muted-foreground">{row.project_name}</td>
											<td className="py-3 pr-4 text-right tabular-nums text-foreground">
												{formatNumber(row.total_raw_score)}
											</td>
											<td className="py-3 pr-4 text-right tabular-nums text-foreground">
												{row.total_weighted_score.toFixed(2)}
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
