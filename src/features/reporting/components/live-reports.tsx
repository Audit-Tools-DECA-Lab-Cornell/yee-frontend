"use client";

import Link from "next/link";
import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { useAuth } from "@/features/auth/components/auth-provider";
import { ClearFiltersButton, SearchableMultiSelectFilter } from "@/features/workspaces/components/table-filters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { TableSkeleton } from "@/components/ui/skeletons";
import { DashboardHero } from "@/components/ui/dashboard-hero";
import {
	fetchPlaceComparisons,
	type PlaceComparisonAuditRecord,
	type PlaceComparisonGroupRecord
} from "@/features/workspaces/api/live-api";
import { domainLabels, domainOrder } from "@/features/reporting/reporting";
import { radarPolygonPoints, radarRadialPoint, trendScale } from "@/features/reporting/export/charts/geometry";
import {
	auditRawPercent as getAuditRawPercent,
	auditWeightedPercent as getAuditWeightedPercent,
	buildRadarSvg,
	buildTrendSvg,
	getExportPalette,
	percentage,
	type PlaceComparisonSummary,
	type ReportDocumentFormat
} from "@/features/reporting/export/dashboard-charts";
import { ExportMenuButton, type ExportMenuOption } from "@/features/reporting/components/export-menu-button";
import { ChartDownloadButton } from "@/features/reporting/components/chart-download-button";
import { yeeDomainThemes } from "@/features/yee-audit/config/yee-domain-theme";

type CompareMode = "places" | "audits" | "individual";
type DateRangeValue = "all" | "30" | "90" | "180" | "365";

type PlaceSummary = {
	place_id: string;
	place_name: string;
	project_id: string;
	project_name: string;
	auditCount: number;
	avgRawScore: number;
	avgWeightedScore: number;
	avgRawPercent: number;
	avgWeightedPercent: number;
	rawPercentByDomain: Record<(typeof domainOrder)[number], number>;
	weightedPercentByDomain: Record<(typeof domainOrder)[number], number>;
	latestAuditId: string | null;
	latestSubmissionId: string | null;
};

function parseIsoDate(value: string | null | undefined) {
	if (!value) return null;
	const parsed = new Date(value);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function colorBandClasses(value: number) {
	if (value < 34) return "border-rose-300 text-rose-700 bg-rose-50";
	if (value < 67) return "border-amber-300 text-amber-700 bg-amber-50";
	return "border-emerald-300 text-emerald-700 bg-emerald-50";
}

function compareModeLabel(mode: CompareMode) {
	switch (mode) {
		case "places":
			return "Compare Places";
		case "audits":
			return "Compare Over Time";
		case "individual":
			return "Compare Individual Audits";
	}
}

function rangeLabel(range: DateRangeValue) {
	switch (range) {
		case "30":
			return "Last 30 days";
		case "90":
			return "Last 3 months";
		case "180":
			return "Last 6 months";
		case "365":
			return "Last 12 months";
		case "all":
		default:
			return "All dates";
	}
}

function withinDateRange(dateValue: string, range: DateRangeValue) {
	if (range === "all") return true;
	const currentDate = parseIsoDate(dateValue);
	if (!currentDate) return false;
	const now = new Date();
	const days = Number(range);
	const earliest = new Date(now);
	earliest.setDate(now.getDate() - days);
	return currentDate >= earliest;
}

/** Columns for the "Compare Places" report table (display-only, sortable). */
const comparePlacesColumns: ColumnDef<PlaceSummary>[] = [
	{
		accessorKey: "place_name",
		header: "Place",
		cell: ({ row }) => (
			<Link
				href={`/manager/places/${row.original.place_id}`}
				className="font-medium text-foreground underline decoration-border underline-offset-4 hover:text-foreground">
				{row.original.place_name}
			</Link>
		)
	},
	{
		accessorKey: "project_name",
		header: "Project",
		cell: ({ getValue }) => <span className="text-muted-foreground">{String(getValue())}</span>
	},
	{
		accessorKey: "avgRawScore",
		header: "Raw score",
		cell: ({ row }) => (
			<span className="text-muted-foreground tabular-nums">
				{row.original.avgRawScore} ({row.original.avgRawPercent.toFixed(0)}%)
			</span>
		)
	},
	{
		accessorKey: "avgWeightedScore",
		header: "Youth weighted average",
		cell: ({ row }) => (
			<span className="text-muted-foreground tabular-nums">
				{row.original.avgWeightedScore.toFixed(2)} ({row.original.avgWeightedPercent.toFixed(0)}%)
			</span>
		)
	},
	{
		id: "access",
		accessorFn: row => row.rawPercentByDomain.access,
		header: "Access",
		cell: ({ row }) => (
			<span className="text-muted-foreground tabular-nums">
				{row.original.rawPercentByDomain.access.toFixed(0)}%
			</span>
		)
	},
	{
		id: "amenities",
		accessorFn: row => row.rawPercentByDomain.amenities,
		header: "Amenities",
		cell: ({ row }) => (
			<span className="text-muted-foreground tabular-nums">
				{row.original.rawPercentByDomain.amenities.toFixed(0)}%
			</span>
		)
	},
	{
		id: "report",
		header: "Detailed report",
		enableSorting: false,
		cell: ({ row }) =>
			row.original.latestSubmissionId ? (
				<Link
					href={`/yee/submissions/${row.original.latestSubmissionId}`}
					className="font-medium text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground">
					Open latest report
				</Link>
			) : (
				<span className="text-muted-foreground">No linked report</span>
			)
	}
];

function ComparePlaceMobileCard({ summary }: { summary: PlaceSummary }) {
	return (
		<div className="space-y-2 rounded-md border border-border bg-card p-4">
			<div className="flex items-start justify-between gap-3">
				<Link
					href={`/manager/places/${summary.place_id}`}
					className="font-medium text-foreground underline decoration-border underline-offset-4">
					{summary.place_name}
				</Link>
				<span className="text-sm text-muted-foreground">{summary.project_name}</span>
			</div>
			<div className="flex flex-wrap gap-x-4 gap-y-1 text-sm tabular-nums text-muted-foreground">
				<span>
					Raw: {summary.avgRawScore} ({summary.avgRawPercent.toFixed(0)}%)
				</span>
				<span>
					Youth weighted: {summary.avgWeightedScore.toFixed(2)} ({summary.avgWeightedPercent.toFixed(0)}%)
				</span>
				<span>Access: {summary.rawPercentByDomain.access.toFixed(0)}%</span>
				<span>Amenities: {summary.rawPercentByDomain.amenities.toFixed(0)}%</span>
			</div>
			{summary.latestSubmissionId ? (
				<Link
					href={`/yee/submissions/${summary.latestSubmissionId}`}
					className="text-sm font-medium text-muted-foreground underline decoration-border underline-offset-4">
					Open latest report
				</Link>
			) : (
				<span className="text-sm text-muted-foreground">No linked report</span>
			)}
		</div>
	);
}

function buildPlaceSummaries(records: PlaceComparisonAuditRecord[]): PlaceSummary[] {
	const grouped = new Map<string, PlaceComparisonAuditRecord[]>();
	for (const record of records) {
		const next = grouped.get(record.place_id) ?? [];
		next.push(record);
		grouped.set(record.place_id, next);
	}

	return Array.from(grouped.values())
		.map(placeRecords => {
			const [first] = placeRecords;
			const rawPercentByDomain = Object.fromEntries(domainOrder.map(domain => [domain, 0])) as Record<
				(typeof domainOrder)[number],
				number
			>;
			const weightedPercentByDomain = Object.fromEntries(domainOrder.map(domain => [domain, 0])) as Record<
				(typeof domainOrder)[number],
				number
			>;

			for (const record of placeRecords) {
				for (const domain of domainOrder) {
					rawPercentByDomain[domain] += percentage(
						record.raw_domain_scores[domain],
						record.raw_domain_maximums[domain]
					);
					weightedPercentByDomain[domain] += percentage(
						record.weighted_domain_scores[domain],
						record.weighted_domain_maximums[domain]
					);
				}
			}

			for (const domain of domainOrder) {
				rawPercentByDomain[domain] = Number((rawPercentByDomain[domain] / placeRecords.length).toFixed(1));
				weightedPercentByDomain[domain] = Number(
					(weightedPercentByDomain[domain] / placeRecords.length).toFixed(1)
				);
			}

			const sortedByDate = [...placeRecords].sort((left, right) => {
				const leftDate = parseIsoDate(left.date)?.getTime() ?? 0;
				const rightDate = parseIsoDate(right.date)?.getTime() ?? 0;
				return rightDate - leftDate;
			});
			const latest = sortedByDate[0];

			return {
				place_id: first.place_id,
				place_name: first.place_name,
				project_id: first.project_id,
				project_name: first.project_name,
				auditCount: placeRecords.length,
				avgRawScore: Number(
					(
						placeRecords.reduce((sum, record) => sum + record.total_raw_score, 0) / placeRecords.length
					).toFixed(1)
				),
				avgWeightedScore: Number(
					(
						placeRecords.reduce((sum, record) => sum + record.total_weighted_score, 0) / placeRecords.length
					).toFixed(2)
				),
				avgRawPercent: Number(
					(
						placeRecords.reduce((sum, record) => sum + getAuditRawPercent(record), 0) / placeRecords.length
					).toFixed(1)
				),
				avgWeightedPercent: Number(
					(
						placeRecords.reduce((sum, record) => sum + getAuditWeightedPercent(record), 0) /
						placeRecords.length
					).toFixed(1)
				),
				rawPercentByDomain,
				weightedPercentByDomain,
				latestAuditId: latest?.audit_id ?? null,
				latestSubmissionId: latest?.audit_id ?? null
			};
		})
		.sort((left, right) => right.avgWeightedScore - left.avgWeightedScore);
}

// Radar/trend geometry is imported from the export layer's shared helpers
// (`export/charts/geometry.ts`) so the on-screen chart and the exported chart
// compute identical points and can never drift (implementation-plan D3/M1).

function RadarComparisonChart({ summaries }: { summaries: PlaceSummary[] }) {
	const series = summaries.slice(0, 3);
	const radius = 72;
	const center = 110;
	const rings = [25, 50, 75, 100];
	const colors = [
		{ stroke: "var(--chart-series-1)", fill: "color-mix(in oklab, var(--chart-series-1) 14%, transparent)" },
		{ stroke: "var(--chart-series-2)", fill: "color-mix(in oklab, var(--chart-series-2) 14%, transparent)" },
		{ stroke: "var(--chart-series-3)", fill: "color-mix(in oklab, var(--chart-series-3) 14%, transparent)" }
	];

	// Builds the exportable standalone SVG from the same top-3 data on demand.
	const buildRadarDownloadSvg = () => {
		const palette = getExportPalette();
		return buildRadarSvg({
			axisLabels: domainOrder.map(domain => domainLabels[domain]),
			palette,
			size: 380,
			series: series.map((summary, index) => ({
				label: summary.place_name,
				color: palette.chartSeries[index % palette.chartSeries.length],
				values: domainOrder.map(domain => summary.rawPercentByDomain[domain])
			}))
		});
	};

	return (
		<Card className="rounded-md border-border">
			<CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
				<div className="space-y-1.5">
					<CardTitle>Radar comparison</CardTitle>
					<CardDescription>
						A spider chart makes section strengths and gaps across places visible at a glance.
					</CardDescription>
				</div>
				<ChartDownloadButton
					buildSvg={buildRadarDownloadSvg}
					baseName="radar-comparison"
					label="Download radar chart"
				/>
			</CardHeader>
			<CardContent className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
				<svg
					viewBox="0 0 220 220"
					className="mx-auto h-[220px] w-[220px]"
					role="img"
					aria-label="Radar chart comparing domain scores across places">
					{rings.map(ring => (
						<circle
							key={ring}
							cx={center}
							cy={center}
							r={(radius * ring) / 100}
							fill="none"
							className="stroke-chart-grid"
							strokeDasharray="4 4"
						/>
					))}
					{domainOrder.map((domain, index) => {
						const outerPoint = radarRadialPoint(index, domainOrder.length, 100, radius, center);
						const labelPoint = radarRadialPoint(index, domainOrder.length, 118, radius, center);
						return (
							<g key={domain}>
								<line
									x1={center}
									y1={center}
									x2={outerPoint.x}
									y2={outerPoint.y}
									className="stroke-chart-grid"
								/>
								<text
									x={labelPoint.x}
									y={labelPoint.y}
									textAnchor="middle"
									className="fill-chart-axis text-[8px] font-medium">
									{domainLabels[domain]}
								</text>
							</g>
						);
					})}
					{series.map((summary, index) => (
						<polygon
							key={summary.place_id}
							points={radarPolygonPoints(
								domainOrder.map(domain => summary.rawPercentByDomain[domain]),
								radius,
								center
							)}
							style={{ fill: colors[index].fill, stroke: colors[index].stroke }}
							strokeWidth={2.5}
						/>
					))}
				</svg>
				<div className="space-y-3">
					{series.map((summary, index) => (
						<div key={summary.place_id} className="rounded-md border border-border bg-muted/40 p-4">
							<div className="flex items-center gap-3">
								<span
									className="h-3 w-3 rounded-full"
									style={{ backgroundColor: colors[index].stroke }}
								/>
								<Link
									href={`/manager/places/${summary.place_id}`}
									className="font-medium text-slate-900 underline decoration-slate-300 underline-offset-4 hover:text-foreground">
									{summary.place_name}
								</Link>
							</div>
							<p className="mt-2 text-sm text-muted-foreground">
								Average Raw Score {summary.avgRawScore} ({summary.avgRawPercent.toFixed(0)}%) and
								Average Youth Weighted Average {summary.avgWeightedScore.toFixed(2)} (
								{summary.avgWeightedPercent.toFixed(0)}%).
							</p>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}

function TrendLineChart({ records }: { records: PlaceComparisonAuditRecord[] }) {
	const points = records.map((record, index) => ({
		label: record.date,
		rawPercent: getAuditRawPercent(record),
		weightedPercent: getAuditWeightedPercent(record),
		index
	}));
	const width = 720;
	const height = 260;
	const padding = 28;
	// Shared scale helper — identical math to the exported trend chart (D3/M1).
	const { pointX, pointY } = trendScale({ count: points.length, width, height, padding });
	const rawPolyline = points.map(point => `${pointX(point.index)},${pointY(point.rawPercent)}`).join(" ");
	const weightedPolyline = points.map(point => `${pointX(point.index)},${pointY(point.weightedPercent)}`).join(" ");

	// Builds the exportable standalone SVG from the same records on demand.
	const buildTrendDownloadSvg = () =>
		buildTrendSvg({
			palette: getExportPalette(),
			points: records.map(record => ({
				label: record.date,
				rawPercent: getAuditRawPercent(record),
				weightedPercent: getAuditWeightedPercent(record)
			}))
		});

	return (
		<Card className="rounded-md border-border">
			<CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
				<div className="space-y-1.5">
					<CardTitle>Trend over time</CardTitle>
					<CardDescription>
						Track how one place changes across repeated audits, interventions, and seasons.
					</CardDescription>
				</div>
				<ChartDownloadButton
					buildSvg={buildTrendDownloadSvg}
					baseName="trend-report"
					label="Download trend chart"
				/>
			</CardHeader>
			<CardContent className="space-y-4">
				<svg
					viewBox={`0 0 ${width} ${height}`}
					className="h-[260px] w-full rounded-md bg-muted/40">
					{[0, 25, 50, 75, 100].map(value => (
						<g key={value}>
							<line
								x1={padding}
								y1={pointY(value)}
								x2={width - padding}
								y2={pointY(value)}
								className="stroke-chart-grid"
								strokeDasharray="4 4"
							/>
							<text x={8} y={pointY(value) + 4} className="fill-chart-axis text-[10px]">
								{value}%
							</text>
						</g>
					))}
					<polyline fill="none" className="stroke-chart-2" strokeWidth={3} points={rawPolyline} />
					<polyline fill="none" className="stroke-chart-1" strokeWidth={3} points={weightedPolyline} />
					{points.map(point => (
						<g key={point.label}>
							<circle
								cx={pointX(point.index)}
								cy={pointY(point.rawPercent)}
								r={4}
								className="fill-chart-2"
							/>
							<circle
								cx={pointX(point.index)}
								cy={pointY(point.weightedPercent)}
								r={4}
								className="fill-chart-1"
							/>
							<text
								x={pointX(point.index)}
								y={height - 8}
								textAnchor="middle"
								className="fill-chart-axis text-[10px]">
								{point.label}
							</text>
						</g>
					))}
				</svg>
				<div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
					<Badge className="rounded-full bg-blue-100 px-3 py-1 text-blue-700 hover:bg-blue-100">
						Raw Score trend
					</Badge>
					<Badge className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700 hover:bg-emerald-100">
						Youth Weighted Average trend
					</Badge>
				</div>
			</CardContent>
		</Card>
	);
}

export function LiveReports() {
	const { session } = useAuth();
	const [groups, setGroups] = React.useState<PlaceComparisonGroupRecord[]>([]);
	const [selectedProjectIds, setSelectedProjectIds] = React.useState<string[]>([]);
	const [selectedPlaceIds, setSelectedPlaceIds] = React.useState<string[]>([]);
	const [selectedAuditorIds, setSelectedAuditorIds] = React.useState<string[]>([]);
	const [dateRange, setDateRange] = React.useState<DateRangeValue>("180");
	const [compareMode, setCompareMode] = React.useState<CompareMode>("places");
	const [selectedAuditIds, setSelectedAuditIds] = React.useState<string[]>([]);
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState<string | null>(null);

	React.useEffect(() => {
		if (!session) return;
		let cancelled = false;

		const run = async () => {
			setLoading(true);
			setError(null);
			try {
				const comparisonResult = await fetchPlaceComparisons(session);
				if (!cancelled) {
					setGroups(comparisonResult);
				}
			} catch (err) {
				if (!cancelled) {
					setError(err instanceof Error ? err.message : "Could not load reports.");
				}
			} finally {
				if (!cancelled) setLoading(false);
			}
		};

		void run();
		return () => {
			cancelled = true;
		};
	}, [session]);

	const allAudits = React.useMemo(() => groups.flatMap(group => group.audits), [groups]);

	const projectOptions = React.useMemo(
		() =>
			Array.from(
				new Map(
					groups.map(group => [group.project_id, { value: group.project_id, label: group.project_name }])
				).values()
			),
		[groups]
	);
	const placeOptions = React.useMemo(
		() =>
			Array.from(
				new Map(
					groups
						.filter(
							group => selectedProjectIds.length === 0 || selectedProjectIds.includes(group.project_id)
						)
						.map(group => [group.place_id, { value: group.place_id, label: group.place_name }])
				).values()
			),
		[groups, selectedProjectIds]
	);
	const auditorOptions = React.useMemo(
		() =>
			Array.from(
				new Map(
					allAudits
						.filter(record => selectedPlaceIds.length === 0 || selectedPlaceIds.includes(record.place_id))
						.map(record => [record.auditor_id, { value: record.auditor_id, label: record.auditor_id }])
				).values()
			),
		[allAudits, selectedPlaceIds]
	);

	const filteredAudits = React.useMemo(
		() =>
			allAudits.filter(record => {
				if (selectedProjectIds.length > 0 && !selectedProjectIds.includes(record.project_id)) return false;
				if (selectedPlaceIds.length > 0 && !selectedPlaceIds.includes(record.place_id)) return false;
				if (selectedAuditorIds.length > 0 && !selectedAuditorIds.includes(record.auditor_id)) return false;
				if (!withinDateRange(record.date, dateRange)) return false;
				return true;
			}),
		[allAudits, dateRange, selectedAuditorIds, selectedPlaceIds, selectedProjectIds]
	);


	const placeSummaries = React.useMemo(() => buildPlaceSummaries(filteredAudits), [filteredAudits]);
	const filtersActive =
		selectedProjectIds.length > 0 ||
		selectedPlaceIds.length > 0 ||
		selectedAuditorIds.length > 0 ||
		dateRange !== "all";

	// Prune/seed the selection during render when the filtered set changes,
	// instead of in an effect, avoiding a cascading re-render.
	const [prevFilteredAudits, setPrevFilteredAudits] = React.useState(filteredAudits);
	if (filteredAudits !== prevFilteredAudits) {
		setPrevFilteredAudits(filteredAudits);
		setSelectedAuditIds(current => {
			const validIds = new Set(filteredAudits.map(record => record.audit_id));
			const retained = current.filter(id => validIds.has(id));
			if (retained.length > 0) return retained;
			return filteredAudits.slice(0, Math.min(3, filteredAudits.length)).map(record => record.audit_id);
		});
	}

	const selectedIndividualAudits = React.useMemo(
		() => filteredAudits.filter(record => selectedAuditIds.includes(record.audit_id)),
		[filteredAudits, selectedAuditIds]
	);

	const timelinePlaceId = React.useMemo(
		() => selectedPlaceIds[0] ?? placeSummaries[0]?.place_id ?? "",
		[selectedPlaceIds, placeSummaries]
	);
	const timelineRecords = React.useMemo(
		() =>
			filteredAudits
				.filter(record => !timelinePlaceId || record.place_id === timelinePlaceId)
				.sort(
					(left, right) =>
						(parseIsoDate(left.date)?.getTime() ?? 0) - (parseIsoDate(right.date)?.getTime() ?? 0)
				),
		[filteredAudits, timelinePlaceId]
	);

	const averageRawScore =
		filteredAudits.length > 0
			? Number(
					(
						filteredAudits.reduce((sum, record) => sum + record.total_raw_score, 0) / filteredAudits.length
					).toFixed(1)
				)
			: 0;
	const averageWeightedScore =
		filteredAudits.length > 0
			? Number(
					(
						filteredAudits.reduce((sum, record) => sum + record.total_weighted_score, 0) /
						filteredAudits.length
					).toFixed(2)
				)
			: 0;

	// Built fresh each render so the selection checkboxes stay in sync with state.
	const individualAuditColumns: ColumnDef<PlaceComparisonAuditRecord>[] = [
		{
			id: "select",
			enableSorting: false,
			header: () => <span className="sr-only">Select</span>,
			cell: ({ row }) => {
				const auditId = row.original.audit_id;
				const checked = selectedAuditIds.includes(auditId);
				return (
					<input
						type="checkbox"
						aria-label={`Select audit for ${row.original.place_name}`}
						checked={checked}
						onChange={() =>
							setSelectedAuditIds(current =>
								checked ? current.filter(id => id !== auditId) : [...current, auditId]
							)
						}
					/>
				);
			}
		},
		{
			accessorKey: "place_name",
			header: "Place",
			cell: ({ row }) => (
				<Link
					href={`/manager/places/${row.original.place_id}`}
					className="font-medium text-foreground underline decoration-border underline-offset-4 hover:text-foreground">
					{row.original.place_name}
				</Link>
			)
		},
		{
			accessorKey: "auditor_id",
			header: "Auditor",
			cell: ({ getValue }) => <span className="text-muted-foreground">{String(getValue())}</span>
		},
		{
			accessorKey: "date",
			header: "Date",
			cell: ({ getValue }) => <span className="text-muted-foreground">{String(getValue())}</span>
		},
		{
			id: "raw",
			accessorFn: row => getAuditRawPercent(row),
			header: "Raw score",
			cell: ({ row }) => (
				<span className="text-muted-foreground tabular-nums">
					{row.original.total_raw_score}/{row.original.total_raw_maximum} (
					{getAuditRawPercent(row.original).toFixed(0)}%)
				</span>
			)
		},
		{
			id: "weighted",
			accessorFn: row => getAuditWeightedPercent(row),
			header: "Youth weighted average",
			cell: ({ row }) => (
				<span className="text-muted-foreground tabular-nums">
					{row.original.total_weighted_score.toFixed(2)}/{row.original.total_weighted_maximum.toFixed(2)} (
					{getAuditWeightedPercent(row.original).toFixed(0)}%)
				</span>
			)
		},
		{
			id: "report",
			header: "Full report",
			enableSorting: false,
			cell: ({ row }) => (
				<Link
					href={`/yee/submissions/${row.original.audit_id}`}
					className="font-medium text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground">
					Open report
				</Link>
			)
		}
	];

	const individualAuditMobileCard = (record: PlaceComparisonAuditRecord) => {
		const checked = selectedAuditIds.includes(record.audit_id);
		return (
			<div className="space-y-2 rounded-md border border-border bg-card p-4">
				<div className="flex items-start gap-3">
					<input
						type="checkbox"
						aria-label={`Select audit for ${record.place_name}`}
						className="mt-1"
						checked={checked}
						onChange={() =>
							setSelectedAuditIds(current =>
								checked ? current.filter(id => id !== record.audit_id) : [...current, record.audit_id]
							)
						}
					/>
					<div className="min-w-0 flex-1">
						<Link
							href={`/manager/places/${record.place_id}`}
							className="font-medium text-foreground underline decoration-border underline-offset-4">
							{record.place_name}
						</Link>
						<p className="text-sm text-muted-foreground">
							{record.auditor_id} · {record.date}
						</p>
					</div>
				</div>
				<div className="flex flex-wrap gap-x-4 gap-y-1 text-sm tabular-nums text-muted-foreground">
					<span>
						Raw: {record.total_raw_score}/{record.total_raw_maximum} (
						{getAuditRawPercent(record).toFixed(0)}%)
					</span>
					<span>
						Youth weighted: {record.total_weighted_score.toFixed(2)}/
						{record.total_weighted_maximum.toFixed(2)} ({getAuditWeightedPercent(record).toFixed(0)}%)
					</span>
				</div>
				<Link
					href={`/yee/submissions/${record.audit_id}`}
					className="text-sm font-medium text-muted-foreground underline decoration-border underline-offset-4">
					Open report
				</Link>
			</div>
		);
	};

	// Self-describing scope printed on export covers — mirrors the on-screen
	// "Current scope" sentence so the document says exactly what it contains.
	const scopeLine = `${selectedProjectIds.length > 0 ? `${selectedProjectIds.length} Projects` : "All Projects"}, ${selectedPlaceIds.length > 0 ? `${selectedPlaceIds.length} Places` : "All Places"}, ${selectedAuditorIds.length > 0 ? `${selectedAuditorIds.length} Auditors` : "All Auditors"}, ${rangeLabel(dateRange)}`;

	const exportFormatOptions: ExportMenuOption<ReportDocumentFormat>[] = [
		{ format: "pdf", label: "PDF", description: "Branded, chart-bearing report" },
		{ format: "xlsx", label: "Excel", description: "Multi-sheet analysis workbook" },
		{ format: "csv", label: "CSV", description: "Flat data (legacy format)" }
	];

	// Mode-aware label + disabled state. The export is what-you-see-is-what-you-
	// export: it always reflects the active compare mode + filters.
	const exportConfig =
		compareMode === "places"
			? { label: "Export place comparison", disabled: placeSummaries.length === 0, disabledReason: "No audits in the current scope" }
			: compareMode === "audits"
				? { label: "Export trend report", disabled: timelineRecords.length === 0, disabledReason: "No audits for this place in the current range" }
				: {
						label: `Export audit comparison (${selectedIndividualAudits.length} selected)`,
						disabled: selectedIndividualAudits.length < 2,
						disabledReason: "Select at least 2 audits to compare"
					};

	async function handleComparisonExport(format: ReportDocumentFormat) {
		const scope = { line: scopeLine, auditCount: filteredAudits.length, placeCount: placeSummaries.length };
		const exp = await import("@/features/reporting/export");
		if (compareMode === "places") {
			const summaries: PlaceComparisonSummary[] = placeSummaries.map(summary => ({
				placeId: summary.place_id,
				placeName: summary.place_name,
				projectName: summary.project_name,
				auditCount: summary.auditCount,
				avgRawScore: summary.avgRawScore,
				avgWeightedScore: summary.avgWeightedScore,
				avgRawPercent: summary.avgRawPercent,
				avgWeightedPercent: summary.avgWeightedPercent,
				rawPercentByDomain: summary.rawPercentByDomain,
				weightedPercentByDomain: summary.weightedPercentByDomain
			}));
			await exp.exportPlaceComparison({ summaries, audits: filteredAudits, scope }, format);
			return;
		}
		if (compareMode === "audits") {
			const placeName =
				timelineRecords[0]?.place_name ??
				placeSummaries.find(summary => summary.place_id === timelinePlaceId)?.place_name ??
				"Place";
			const projectName = timelineRecords[0]?.project_name ?? "";
			await exp.exportTrend({ placeName, projectName, records: timelineRecords, scope }, format);
			return;
		}
		await exp.exportAuditComparison({ records: selectedIndividualAudits, scope }, format);
	}

	if (loading) {
		return <TableSkeleton aria-label="Loading reports dashboard…" />;
	}

	if (error) {
		return (
			<Card className="rounded-md border-rose-200 bg-rose-50 shadow-sm">
				<CardContent className="p-6 text-sm text-rose-700">{error}</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			<DashboardHero
				size="compact"
				title="Reports dashboard"
				subtitle="Analyze performance across Places and time with project, Place, auditor, and date filters."
				actions={
					<Button asChild className="bg-white text-foreground hover:bg-emerald-50">
						<Link href="/auditor/places">View My Audits</Link>
					</Button>
				}
				stats={[
					{
						label: "Average Raw Score",
						value: averageRawScore.toFixed(1),
						helper: `${filteredAudits.length} audits in the current view`
					},
					{
						label: "Average Youth Weighted Average",
						value: averageWeightedScore.toFixed(1),
						helper: "Across the currently filtered audits"
					},
					{
						label: "Total Audits",
						value: String(filteredAudits.length).padStart(2, "0"),
						helper: "Submitted audits available in this analysis view"
					},
					{
						label: "Total Places",
						value: String(placeSummaries.length).padStart(2, "0"),
						helper: "Places included in the current view"
					}
				]}
			/>

			<Card className="rounded-md border-border">
				<CardContent className="space-y-5">
					<div className="flex flex-col gap-3">
						<div className="flex flex-wrap w-full items-start justify-between gap-3">
							<div className="flex flex-col gap-5">
								<div className="flex flex-wrap items-center gap-3">
									<SearchableMultiSelectFilter
										label="Project"
										options={projectOptions}
										selectedValues={selectedProjectIds}
										onChange={setSelectedProjectIds}
									/>
									<SearchableMultiSelectFilter
										label="Place"
										options={placeOptions}
										selectedValues={selectedPlaceIds}
										onChange={values => {
											setSelectedPlaceIds(values);
											if (compareMode === "audits" && values.length > 1) {
												setSelectedPlaceIds(values.slice(0, 1));
											}
										}}
									/>
									<SearchableMultiSelectFilter
										label="Auditor"
										options={auditorOptions}
										selectedValues={selectedAuditorIds}
										onChange={setSelectedAuditorIds}
									/>
								</div>
								<div className="flex flex-wrap items-center gap-3">
									<SegmentedControl
										aria-label="Compare mode"
										value={compareMode}
										onValueChange={value => {
											const mode = value as CompareMode;
											setCompareMode(mode);
											if (mode === "audits" && selectedPlaceIds.length > 1) {
												setSelectedPlaceIds(selectedPlaceIds.slice(0, 1));
											}
										}}
										options={(["places", "audits", "individual"] as CompareMode[]).map(mode => ({
											value: mode,
											label: compareModeLabel(mode)
										}))}
									/>
									{/* Context-aware export: what-you-see-is-what-you-export. */}
									<ExportMenuButton
										label={exportConfig.label}
										options={exportFormatOptions}
										onExport={handleComparisonExport}
										disabled={exportConfig.disabled}
										disabledReason={exportConfig.disabledReason}
									/>
								</div>
							</div>

							<div className="flex flex-col items-end justify-end gap-5">
								<span className="text-sm font-medium text-foreground pt-2 pb-1">Date range</span>
								<SegmentedControl
									aria-label="Date range"
									value={dateRange}
									onValueChange={value => setDateRange(value as DateRangeValue)}
									options={(["all", "30", "90", "180", "365"] as DateRangeValue[]).map(option => ({
										value: option,
										label: rangeLabel(option)
									}))}
								/>
							</div>
						</div>
					</div>
					<div className="flex flex-wrap w-full items-start justify-between gap-3">
						<p className="text-sm leading-6 text-muted-foreground">
							Current scope:{" "}
							{selectedProjectIds.length > 0 ? `${selectedProjectIds.length} Projects` : "All Projects"},{" "}
							{selectedPlaceIds.length > 0 ? `${selectedPlaceIds.length} Places` : "All Places"},{" "}
							{selectedAuditorIds.length > 0 ? `${selectedAuditorIds.length} Auditors` : "All Auditors"},{" "}
							{rangeLabel(dateRange)}.
						</p>
						<ClearFiltersButton
							disabled={!filtersActive}
							onClick={() => {
								setSelectedProjectIds([]);
								setSelectedPlaceIds([]);
								setSelectedAuditorIds([]);
								setDateRange("all");
							}}
						/>
					</div>
				</CardContent>
			</Card>

			{compareMode === "places" ? (
				<div className="space-y-6">
					<Card className="rounded-md border-border">
						<CardHeader>
							<CardTitle>Compare Places</CardTitle>
							<CardDescription>
								Compare multiple Places side-by-side using average Raw Score, Youth Weighted Average,
								and section-level performance.
							</CardDescription>
						</CardHeader>
						<CardContent className="overflow-x-auto">
							<DataTable
								columns={comparePlacesColumns}
								data={placeSummaries}
								getRowId={row => row.place_id}
								mobileCard={summary => <ComparePlaceMobileCard summary={summary} />}
							/>
						</CardContent>
					</Card>

					<Card className="rounded-md border-border">
						<CardHeader>
							<CardTitle>Stacked section comparison</CardTitle>
							<CardDescription>
								Average section performance by place. Clicking a place name opens the detailed Place
								page, and the latest report link opens the full audit report.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{placeSummaries.map(summary => (
								<div
									key={summary.place_id}
									className="rounded-md border border-border bg-[#f8fbf9] p-4">
									<div className="flex flex-wrap items-center justify-between gap-3">
										<div>
											<Link
												href={`/manager/places/${summary.place_id}`}
												className="font-medium text-slate-900 underline decoration-slate-300 underline-offset-4 hover:text-foreground">
												{summary.place_name}
											</Link>
											<p className="text-sm text-muted-foreground">{summary.project_name}</p>
										</div>
										<Badge className="rounded-full bg-white px-3 py-1 text-slate-700 hover:bg-white">
											{summary.auditCount} audits
										</Badge>
									</div>
									<div className="mt-4 grid gap-3 md:grid-cols-2">
										<div>
											<p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
												Average Raw Score by section
											</p>
											<div className="flex h-10 overflow-hidden rounded-bl-md rounded-tr-md border border-border bg-white">
												{domainOrder.map(domain => (
													<div
														key={domain}
														className="flex items-center justify-center text-[11px] font-medium text-foreground"
														style={{
															width: `${100 / domainOrder.length}%`,
															backgroundColor: yeeDomainThemes[domain].lightHex
														}}>
														{summary.rawPercentByDomain[domain].toFixed(0)}%
													</div>
												))}
											</div>
										</div>
										<div>
											<p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
												Average Youth Weighted Average by section
											</p>
											<div className="flex h-10 overflow-hidden rounded-bl-md rounded-tr-md border border-border bg-white">
												{domainOrder.map(domain => (
													<div
														key={domain}
														className="flex items-center justify-center text-[11px] font-medium text-foreground"
														style={{
															width: `${100 / domainOrder.length}%`,
															backgroundColor: yeeDomainThemes[domain].strongFillHex
														}}>
														{summary.weightedPercentByDomain[domain].toFixed(0)}%
													</div>
												))}
											</div>
										</div>
									</div>
								</div>
							))}
						</CardContent>
					</Card>

					<RadarComparisonChart summaries={placeSummaries} />
				</div>
			) : null}

			{compareMode === "audits" ? (
				<div className="space-y-6">
					<Card className="rounded-md border-border">
						<CardHeader>
							<CardTitle>Compare audits over time</CardTitle>
							<CardDescription>
								Follow the same Place across multiple audits to identify improvement, decline, and
								change after interventions.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<p className="text-sm text-muted-foreground">
								Showing timeline for{" "}
								<strong className="text-foreground">
									{timelineRecords[0]?.place_name ??
										placeSummaries.find(summary => summary.place_id === timelinePlaceId)
											?.place_name ??
										"the selected Place"}
								</strong>
								.
							</p>
							{timelineRecords.length > 0 ? (
								<>
									<TrendLineChart records={timelineRecords} />
									<div className="grid gap-4 md:grid-cols-3">
										{timelineRecords.slice(-3).map(record => (
											<Card key={record.audit_id} className="rounded-md border-border">
												<CardContent className="space-y-2 p-5">
													<p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
														{record.date}
													</p>
													<p className="text-sm font-semibold text-foreground">
														{record.auditor_id}
													</p>
													<p className="text-sm text-muted-foreground">
														Raw Score {record.total_raw_score} (
														{getAuditRawPercent(record).toFixed(0)}%)
													</p>
													<p className="text-sm text-muted-foreground">
														Youth Weighted Average {record.total_weighted_score.toFixed(2)}{" "}
														({getAuditWeightedPercent(record).toFixed(0)}%)
													</p>
													<Link
														href={`/yee/submissions/${record.audit_id}`}
														className="text-sm font-medium text-slate-900 underline decoration-slate-300 underline-offset-4 hover:text-foreground">
														Open report
													</Link>
												</CardContent>
											</Card>
										))}
									</div>
								</>
							) : (
								<p className="text-sm text-muted-foreground">
									Choose one Place to see its audit history over time.
								</p>
							)}
						</CardContent>
					</Card>
				</div>
			) : null}

			{compareMode === "individual" ? (
				<div className="space-y-6">
					<Card className="rounded-md border-border">
						<CardHeader>
							<CardTitle>Compare individual audits</CardTitle>
							<CardDescription>
								Select audits directly to compare auditors, dates, and detailed report outcomes
								side-by-side.
							</CardDescription>
						</CardHeader>
						<CardContent className="overflow-x-auto">
							<DataTable
								columns={individualAuditColumns}
								data={filteredAudits}
								getRowId={row => row.audit_id}
								mobileCard={individualAuditMobileCard}
							/>
						</CardContent>
					</Card>

					<div className="grid gap-4 lg:grid-cols-2">
						{selectedIndividualAudits.map(record => (
							<Card key={record.audit_id} className="rounded-md border-border">
								<CardHeader>
									<CardTitle>{record.place_name}</CardTitle>
									<CardDescription>
										{record.auditor_id} on {record.date}
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="grid gap-3 md:grid-cols-2">
										<div
											className={`rounded-md border p-4 ${colorBandClasses(getAuditRawPercent(record))}`}>
											<p className="text-xs font-medium uppercase tracking-[0.16em]">Raw Score</p>
											<p className="mt-2 text-lg font-semibold">
												{record.total_raw_score}/{record.total_raw_maximum}
											</p>
											<p className="text-sm">{getAuditRawPercent(record).toFixed(0)}%</p>
										</div>
										<div
											className={`rounded-md border p-4 ${colorBandClasses(getAuditWeightedPercent(record))}`}>
											<p className="text-xs font-medium uppercase tracking-[0.16em]">
												Youth Weighted Average
											</p>
											<p className="mt-2 text-lg font-semibold">
												{record.total_weighted_score.toFixed(2)}/
												{record.total_weighted_maximum.toFixed(2)}
											</p>
											<p className="text-sm">{getAuditWeightedPercent(record).toFixed(0)}%</p>
										</div>
									</div>
									<div className="grid gap-3 sm:grid-cols-2">
										{domainOrder.map(domain => (
											<div
												key={domain}
												className="rounded-md border p-4"
												style={{
													borderColor: yeeDomainThemes[domain].strongFillHex,
													backgroundColor: "#ffffff"
												}}>
												<p
													className="text-sm font-medium"
													style={{ color: yeeDomainThemes[domain].strongHex }}>
													{domainLabels[domain]}
												</p>
												<p className="mt-2 text-sm text-muted-foreground">
													Raw Score {record.raw_domain_scores[domain]}/
													{record.raw_domain_maximums[domain]}
												</p>
												<p className="text-sm text-muted-foreground">
													Youth Weighted Average{" "}
													{record.weighted_domain_scores[domain].toFixed(2)}/
													{record.weighted_domain_maximums[domain].toFixed(2)}
												</p>
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			) : null}
		</div>
	);
}
