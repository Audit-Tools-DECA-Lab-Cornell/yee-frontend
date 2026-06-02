"use client";

import * as React from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { ClearFiltersButton, SearchableMultiSelectFilter } from "@/components/dashboard/table-filters";
import { ExportCsvButton } from "@/components/reporting/export-csv-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchRawData, type RawDataRecord } from "@/lib/dashboard/live-api";

function toExportRows(rows: RawDataRecord[]) {
	return rows.map(row => {
		const base: Record<string, string | number> = {
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
			"Total Youth Weighted Score": row.total_weighted_score
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
			<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
				<CardContent className="p-6 text-sm text-slate-500">Loading raw export data...</CardContent>
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

	const projectOptions = Array.from(new Map(rows.map(row => [row.project_id, { value: row.project_id, label: row.project_name }])).values());
	const placeOptions = Array.from(
		new Map(
			rows
				.filter(row => selectedProjectIds.length === 0 || selectedProjectIds.includes(row.project_id))
				.map(row => [row.place_id, { value: row.place_id, label: row.place_name }])
		).values()
	);
	const filteredRows = rows.filter(row => {
		if (selectedProjectIds.length > 0 && !selectedProjectIds.includes(row.project_id)) return false;
		if (selectedPlaceIds.length > 0 && !selectedPlaceIds.includes(row.place_id)) return false;
		return true;
	});
	const selectedRows = filteredRows.filter(row => selectedAuditIds.includes(row.audit_id));
	const filtersActive = selectedProjectIds.length > 0 || selectedPlaceIds.length > 0;

	return (
		<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
			<CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<CardTitle>{title}</CardTitle>
					<CardDescription>{description}</CardDescription>
				</div>
				<div className="flex flex-wrap gap-2">
					<ExportCsvButton filename={filename} rows={toExportRows(rows)} label="Export All" />
					<ExportCsvButton filename={`filtered-${filename}`} rows={toExportRows(filteredRows)} label="Export Filtered" />
					<ExportCsvButton filename={`selected-${filename}`} rows={toExportRows(selectedRows)} label="Export Selected" />
				</div>
			</CardHeader>
			<CardContent className="space-y-4 overflow-x-auto">
				<div className="flex flex-wrap gap-3">
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
							const allowedPlaceIds = new Set(rows.filter(row => values.includes(row.project_id)).map(row => row.place_id));
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
							setSelectedProjectIds([]);
							setSelectedPlaceIds([]);
							setSelectedAuditIds([]);
						}}
					/>
				</div>
				{rows.length === 0 ? (
					<p className="text-sm text-slate-500">No submitted YEE audits are available yet for {scope} export.</p>
				) : (
					<table className="min-w-full text-left text-sm">
						<thead className="text-slate-500">
							<tr className="border-b border-slate-200">
								<th className="py-3 pr-4 font-medium">Select</th>
								<th className="py-3 pr-4 font-medium">Auditor ID</th>
								<th className="py-3 pr-4 font-medium">Place</th>
								<th className="py-3 pr-4 font-medium">Project</th>
								<th className="py-3 pr-4 font-medium">Raw Score</th>
								<th className="py-3 font-medium">Youth Weighted Score</th>
							</tr>
						</thead>
						<tbody>
							{filteredRows.map(row => (
								<tr key={row.audit_id} className="border-b border-slate-100 last:border-0">
									<td className="py-4 pr-4">
										<input
											type="checkbox"
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
									<td className="py-4 pr-4 text-slate-600">{row.auditor_generated_id}</td>
									<td className="py-4 pr-4 font-medium text-slate-900">{row.place_name}</td>
									<td className="py-4 pr-4 text-slate-600">{row.project_name}</td>
									<td className="py-4 pr-4 text-slate-600">{row.total_raw_score}</td>
									<td className="py-4 text-slate-600">{row.total_weighted_score}</td>
								</tr>
							))}
							{filteredRows.length === 0 ? (
								<tr>
									<td colSpan={6} className="py-8 text-center text-sm text-slate-500">
										No raw data rows match the selected filters.
									</td>
								</tr>
							) : null}
						</tbody>
					</table>
				)}
			</CardContent>
		</Card>
	);
}
