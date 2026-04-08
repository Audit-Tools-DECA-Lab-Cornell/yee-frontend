"use client";

import * as React from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { ExportCsvButton } from "@/components/reporting/export-csv-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchRawData, type RawDataRecord } from "@/lib/dashboard/live-api";

function toExportRows(rows: RawDataRecord[]) {
	return rows.map(row => {
		const base: Record<string, string | number> = {
			audit_id: row.audit_id,
			auditor_generated_id: row.auditor_generated_id,
			place_id: row.place_id,
			place_name: row.place_name,
			project_id: row.project_id,
			project_name: row.project_name,
			date: row.date,
			submitted_at: row.submitted_at,
			start_time: row.start_time,
			finish_time: row.finish_time,
			total_minutes: row.total_minutes,
			visit_frequency: row.visit_frequency,
			season: row.season,
			weather: row.weather,
			comments: row.comments,
			raw_access: row.raw_access,
			raw_activity_spaces: row.raw_activity_spaces,
			raw_amenities: row.raw_amenities,
			raw_experience_of_space: row.raw_experience_of_space,
			raw_aesthetics_and_care: row.raw_aesthetics_and_care,
			raw_use_and_usability: row.raw_use_and_usability,
			weighted_access: row.weighted_access,
			weighted_activity_spaces: row.weighted_activity_spaces,
			weighted_amenities: row.weighted_amenities,
			weighted_experience_of_space: row.weighted_experience_of_space,
			weighted_aesthetics_and_care: row.weighted_aesthetics_and_care,
			weighted_use_and_usability: row.weighted_use_and_usability,
			total_raw_score: row.total_raw_score,
			total_weighted_score: row.total_weighted_score
		};
		for (const [key, value] of Object.entries(row.responses)) {
			base[key] = value;
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

	const exportRows = toExportRows(rows);

	return (
		<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
			<CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<CardTitle>{title}</CardTitle>
					<CardDescription>{description}</CardDescription>
				</div>
				<ExportCsvButton filename={filename} rows={exportRows} />
			</CardHeader>
			<CardContent className="overflow-x-auto">
				{rows.length === 0 ? (
					<p className="text-sm text-slate-500">No submitted YEE audits are available yet for {scope} export.</p>
				) : (
					<table className="min-w-full text-left text-sm">
						<thead className="text-slate-500">
							<tr className="border-b border-slate-200">
								<th className="py-3 pr-4 font-medium">Audit ID</th>
								<th className="py-3 pr-4 font-medium">Auditor ID</th>
								<th className="py-3 pr-4 font-medium">Place</th>
								<th className="py-3 pr-4 font-medium">Project</th>
								<th className="py-3 pr-4 font-medium">Raw Total</th>
								<th className="py-3 font-medium">Weighted Total</th>
							</tr>
						</thead>
						<tbody>
							{rows.map(row => (
								<tr key={row.audit_id} className="border-b border-slate-100 last:border-0">
									<td className="py-4 pr-4 font-medium text-slate-900">{row.audit_id}</td>
									<td className="py-4 pr-4 text-slate-600">{row.auditor_generated_id}</td>
									<td className="py-4 pr-4 text-slate-600">{row.place_name}</td>
									<td className="py-4 pr-4 text-slate-600">{row.project_name}</td>
									<td className="py-4 pr-4 text-slate-600">{row.total_raw_score}</td>
									<td className="py-4 text-slate-600">{row.total_weighted_score}</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</CardContent>
		</Card>
	);
}
