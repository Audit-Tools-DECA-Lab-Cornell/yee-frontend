"use client";

import Link from "next/link";
import * as React from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { ClearFiltersButton, SearchableMultiSelectFilter } from "@/components/dashboard/table-filters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	fetchPlaceComparisons,
	fetchRawData,
	type PlaceComparisonAuditRecord,
	type PlaceComparisonGroupRecord,
	type RawDataRecord
} from "@/lib/dashboard/live-api";
import { domainLabels, domainOrder, toCsv } from "@/lib/dashboard/reporting";
import {
	getDomainYouthWeightedMaximum,
	getYouthWeightedScoreMaximum,
	rawDomainScoreMaximums,
	totalRawScoreMaximum
} from "@/lib/yee-score-limits";
import { yeeDomainThemes } from "@/lib/yee-domain-theme";

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

function clampPercentage(value: number) {
	return Math.max(0, Math.min(100, value));
}

function percentage(numerator: number, denominator: number) {
	if (!denominator) return 0;
	return clampPercentage((numerator / denominator) * 100);
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

function downloadTextFile(filename: string, content: string, type = "text/csv;charset=utf-8;") {
	const blob = new Blob([content], { type });
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = filename;
	anchor.click();
	URL.revokeObjectURL(url);
}

function getAuditRawPercent(record: PlaceComparisonAuditRecord) {
	return percentage(record.total_raw_score, totalRawScoreMaximum);
}

function getAuditWeightedPercent(record: PlaceComparisonAuditRecord) {
	return percentage(record.total_weighted_score, getYouthWeightedScoreMaximum(record.domain_weights));
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
						rawDomainScoreMaximums[domain]
					);
					weightedPercentByDomain[domain] += percentage(
						record.weighted_domain_scores[domain],
						getDomainYouthWeightedMaximum(domain, record.domain_weights)
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

function radialPoint(index: number, total: number, value: number, radius: number, center = 110) {
	const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
	const scaledRadius = radius * (value / 100);
	return {
		x: center + Math.cos(angle) * scaledRadius,
		y: center + Math.sin(angle) * scaledRadius
	};
}

function buildPolygonPoints(values: number[], radius: number, center = 110) {
	return values
		.map((value, index) => {
			const point = radialPoint(index, values.length, value, radius, center);
			return `${point.x},${point.y}`;
		})
		.join(" ");
}

function RadarComparisonChart({
	summaries,
	svgRef
}: {
	summaries: PlaceSummary[];
	svgRef: React.RefObject<SVGSVGElement | null>;
}) {
	const series = summaries.slice(0, 3);
	const radius = 72;
	const center = 110;
	const rings = [25, 50, 75, 100];
	const colors = [
		{ stroke: "#0f766e", fill: "rgba(15, 118, 110, 0.12)" },
		{ stroke: "#2563eb", fill: "rgba(37, 99, 235, 0.12)" },
		{ stroke: "#c2410c", fill: "rgba(194, 65, 12, 0.12)" }
	];

	return (
		<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
			<CardHeader>
				<CardTitle>Radar comparison</CardTitle>
				<CardDescription>
					A spider chart makes section strengths and gaps across places visible at a glance.
				</CardDescription>
			</CardHeader>
			<CardContent className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
				<svg ref={svgRef} viewBox="0 0 220 220" className="mx-auto h-[220px] w-[220px]">
					{rings.map(ring => (
						<circle
							key={ring}
							cx={center}
							cy={center}
							r={(radius * ring) / 100}
							fill="none"
							stroke="#d6dfe6"
							strokeDasharray="4 4"
						/>
					))}
					{domainOrder.map((domain, index) => {
						const outerPoint = radialPoint(index, domainOrder.length, 100, radius, center);
						const labelPoint = radialPoint(index, domainOrder.length, 118, radius, center);
						return (
							<g key={domain}>
								<line x1={center} y1={center} x2={outerPoint.x} y2={outerPoint.y} stroke="#d6dfe6" />
								<text
									x={labelPoint.x}
									y={labelPoint.y}
									textAnchor="middle"
									className="fill-slate-600 text-[8px] font-medium">
									{domainLabels[domain]}
								</text>
							</g>
						);
					})}
					{series.map((summary, index) => (
						<polygon
							key={summary.place_id}
							points={buildPolygonPoints(
								domainOrder.map(domain => summary.rawPercentByDomain[domain]),
								radius,
								center
							)}
							fill={colors[index].fill}
							stroke={colors[index].stroke}
							strokeWidth={2.5}
						/>
					))}
				</svg>
				<div className="space-y-3">
					{series.map((summary, index) => (
						<div key={summary.place_id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
							<div className="flex items-center gap-3">
								<span
									className="h-3 w-3 rounded-full"
									style={{ backgroundColor: colors[index].stroke }}
								/>
								<Link
									href={`/dashboard/places/${summary.place_id}`}
									className="font-medium text-slate-900 underline decoration-slate-300 underline-offset-4 hover:text-slate-950">
									{summary.place_name}
								</Link>
							</div>
							<p className="mt-2 text-sm text-slate-600">
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

function TrendLineChart({
	records,
	svgRef
}: {
	records: PlaceComparisonAuditRecord[];
	svgRef: React.RefObject<SVGSVGElement | null>;
}) {
	const points = records.map((record, index) => ({
		label: record.date,
		rawPercent: getAuditRawPercent(record),
		weightedPercent: getAuditWeightedPercent(record),
		index
	}));
	const width = 720;
	const height = 260;
	const padding = 28;
	const xStep = points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0;
	const pointX = (index: number) => padding + index * xStep;
	const pointY = (value: number) => height - padding - ((height - padding * 2) * clampPercentage(value)) / 100;
	const rawPolyline = points.map(point => `${pointX(point.index)},${pointY(point.rawPercent)}`).join(" ");
	const weightedPolyline = points.map(point => `${pointX(point.index)},${pointY(point.weightedPercent)}`).join(" ");

	return (
		<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
			<CardHeader>
				<CardTitle>Trend over time</CardTitle>
				<CardDescription>
					Track how one place changes across repeated audits, interventions, and seasons.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<svg
					ref={svgRef}
					viewBox={`0 0 ${width} ${height}`}
					className="h-[260px] w-full rounded-2xl bg-[#f8fbf9]">
					{[0, 25, 50, 75, 100].map(value => (
						<g key={value}>
							<line
								x1={padding}
								y1={pointY(value)}
								x2={width - padding}
								y2={pointY(value)}
								stroke="#d6dfe6"
								strokeDasharray="4 4"
							/>
							<text x={8} y={pointY(value) + 4} className="fill-slate-500 text-[10px]">
								{value}%
							</text>
						</g>
					))}
					<polyline fill="none" stroke="#2563eb" strokeWidth={3} points={rawPolyline} />
					<polyline fill="none" stroke="#059669" strokeWidth={3} points={weightedPolyline} />
					{points.map(point => (
						<g key={point.label}>
							<circle cx={pointX(point.index)} cy={pointY(point.rawPercent)} r={4} fill="#2563eb" />
							<circle cx={pointX(point.index)} cy={pointY(point.weightedPercent)} r={4} fill="#059669" />
							<text
								x={pointX(point.index)}
								y={height - 8}
								textAnchor="middle"
								className="fill-slate-500 text-[10px]">
								{point.label}
							</text>
						</g>
					))}
				</svg>
				<div className="flex flex-wrap gap-3 text-sm text-slate-600">
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
	const [rawRows, setRawRows] = React.useState<RawDataRecord[]>([]);
	const [selectedProjectIds, setSelectedProjectIds] = React.useState<string[]>([]);
	const [selectedPlaceIds, setSelectedPlaceIds] = React.useState<string[]>([]);
	const [selectedAuditorIds, setSelectedAuditorIds] = React.useState<string[]>([]);
	const [dateRange, setDateRange] = React.useState<DateRangeValue>("180");
	const [compareMode, setCompareMode] = React.useState<CompareMode>("places");
	const [selectedAuditIds, setSelectedAuditIds] = React.useState<string[]>([]);
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState<string | null>(null);
	const chartSvgRef = React.useRef<SVGSVGElement | null>(null);

	React.useEffect(() => {
		if (!session) return;
		let cancelled = false;

		const run = async () => {
			setLoading(true);
			setError(null);
			try {
				const [comparisonResult, rawResult] = await Promise.all([
					fetchPlaceComparisons(session),
					fetchRawData(session)
				]);
				if (!cancelled) {
					setGroups(comparisonResult);
					setRawRows(rawResult);
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

	const filteredRawRows = React.useMemo(
		() =>
			rawRows.filter(row => {
				if (selectedProjectIds.length > 0 && !selectedProjectIds.includes(row.project_id)) return false;
				if (selectedPlaceIds.length > 0 && !selectedPlaceIds.includes(row.place_id)) return false;
				if (selectedAuditorIds.length > 0 && !selectedAuditorIds.includes(row.auditor_generated_id))
					return false;
				if (!withinDateRange(row.submitted_at || row.date, dateRange)) return false;
				return true;
			}),
		[dateRange, rawRows, selectedAuditorIds, selectedPlaceIds, selectedProjectIds]
	);

	const placeSummaries = React.useMemo(() => buildPlaceSummaries(filteredAudits), [filteredAudits]);
	const filtersActive =
		selectedProjectIds.length > 0 ||
		selectedPlaceIds.length > 0 ||
		selectedAuditorIds.length > 0 ||
		dateRange !== "all";

	React.useEffect(() => {
		setSelectedAuditIds(current => {
			const validIds = new Set(filteredAudits.map(record => record.audit_id));
			const retained = current.filter(id => validIds.has(id));
			if (retained.length > 0) return retained;
			return filteredAudits.slice(0, Math.min(3, filteredAudits.length)).map(record => record.audit_id);
		});
	}, [filteredAudits]);

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
	const highestPlace = placeSummaries[0] ?? null;
	const lowestPlace = placeSummaries[placeSummaries.length - 1] ?? null;

	function exportCurrentComparison() {
		if (compareMode === "places") {
			const rows = placeSummaries.map(summary => ({
				project: summary.project_name,
				place: summary.place_name,
				raw_score: summary.avgRawScore,
				raw_percent: `${summary.avgRawPercent.toFixed(1)}%`,
				youth_weighted_score: summary.avgWeightedScore,
				youth_weighted_percent: `${summary.avgWeightedPercent.toFixed(1)}%`,
				total_audits: summary.auditCount
			}));
			downloadTextFile("yee-place-comparison.csv", toCsv(rows));
			return;
		}
		if (compareMode === "audits") {
			const rows = timelineRecords.map(record => ({
				project: record.project_name,
				place: record.place_name,
				auditor_id: record.auditor_id,
				date: record.date,
				raw_score: `${record.total_raw_score}/${totalRawScoreMaximum}`,
				raw_percent: `${getAuditRawPercent(record).toFixed(1)}%`,
				youth_weighted_score: `${record.total_weighted_score.toFixed(2)}/${getYouthWeightedScoreMaximum(record.domain_weights).toFixed(2)}`,
				youth_weighted_percent: `${getAuditWeightedPercent(record).toFixed(1)}%`
			}));
			downloadTextFile("yee-audit-trend.csv", toCsv(rows));
			return;
		}
		const rows = selectedIndividualAudits.map(record => ({
			project: record.project_name,
			place: record.place_name,
			auditor_id: record.auditor_id,
			date: record.date,
			raw_score: `${record.total_raw_score}/${totalRawScoreMaximum}`,
			raw_percent: `${getAuditRawPercent(record).toFixed(1)}%`,
			youth_weighted_score: `${record.total_weighted_score.toFixed(2)}/${getYouthWeightedScoreMaximum(record.domain_weights).toFixed(2)}`,
			youth_weighted_percent: `${getAuditWeightedPercent(record).toFixed(1)}%`
		}));
		downloadTextFile("yee-individual-audit-comparison.csv", toCsv(rows));
	}

	function exportSelectedAudits() {
		const rows = filteredRawRows
			.filter(row => selectedAuditIds.includes(row.audit_id))
			.map(row => ({
				project: row.project_name,
				place: row.place_name,
				auditor_id: row.auditor_generated_id,
				date: row.date,
				raw_score: row.total_raw_score,
				youth_weighted_score: row.total_weighted_score
			}));
		downloadTextFile("yee-selected-audits.csv", toCsv(rows));
	}

	function exportRawDataCsv() {
		const flattened = filteredRawRows.map(row => ({
			organization: "Youth Enabling Environments Collaborative",
			project: row.project_name,
			place: row.place_name,
			auditor: row.auditor_generated_id,
			date: row.date,
			total_raw_score: row.total_raw_score,
			total_youth_weighted_score: row.total_weighted_score,
			...row.responses
		}));
		downloadTextFile("yee-raw-data.csv", toCsv(flattened));
	}

	function exportCurrentChart() {
		const svg = chartSvgRef.current;
		if (!svg) return;
		const serialized = new XMLSerializer().serializeToString(svg);
		downloadTextFile(`yee-${compareMode}-chart.svg`, serialized, "image/svg+xml;charset=utf-8;");
	}

	if (loading) {
		return (
			<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
				<CardContent className="p-6 text-sm text-slate-500">Loading reports dashboard...</CardContent>
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

	return (
		<div className="space-y-6">
			<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
				<CardHeader>
					<CardTitle>Reports dashboard</CardTitle>
					<CardDescription>
						Analyze performance across Places and time with project, Place, auditor, and date filters.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-5">
					<div className="flex flex-wrap gap-3">
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
						<div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
							<span className="text-sm font-medium text-slate-700">Date range</span>
							{(["all", "30", "90", "180", "365"] as DateRangeValue[]).map(option => (
								<Button
									key={option}
									type="button"
									size="sm"
									variant={dateRange === option ? "default" : "outline"}
									className={`rounded-xl ${dateRange === option ? "bg-[#10231f] text-white hover:bg-[#17302c]" : ""}`}
									onClick={() => setDateRange(option)}>
									{rangeLabel(option)}
								</Button>
							))}
						</div>
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
					<div className="flex flex-wrap gap-2">
						{(["places", "audits", "individual"] as CompareMode[]).map(mode => (
							<Button
								key={mode}
								type="button"
								variant={compareMode === mode ? "default" : "outline"}
								className={`rounded-2xl ${compareMode === mode ? "bg-[#10231f] text-white hover:bg-[#17302c]" : ""}`}
								onClick={() => {
									setCompareMode(mode);
									if (mode === "audits" && selectedPlaceIds.length > 1) {
										setSelectedPlaceIds(selectedPlaceIds.slice(0, 1));
									}
								}}>
								{compareModeLabel(mode)}
							</Button>
						))}
					</div>
					<p className="text-sm leading-6 text-slate-600">
						Current scope:{" "}
						{selectedProjectIds.length > 0 ? `${selectedProjectIds.length} Projects` : "All Projects"},{" "}
						{selectedPlaceIds.length > 0 ? `${selectedPlaceIds.length} Places` : "All Places"},{" "}
						{selectedAuditorIds.length > 0 ? `${selectedAuditorIds.length} Auditors` : "All Auditors"},{" "}
						{rangeLabel(dateRange)}.
					</p>
				</CardContent>
			</Card>

			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
				{[
					{
						label: "Average Raw Score",
						value: averageRawScore.toFixed(1),
						description: `${filteredAudits.length} audits in the current view`
					},
					{
						label: "Average Youth Weighted Average",
						value: averageWeightedScore.toFixed(1),
						description: "Across the currently filtered audits"
					},
					{
						label: "Highest Scoring Place",
						value: highestPlace?.place_name ?? "N/A",
						description: highestPlace
							? `${highestPlace.avgWeightedScore.toFixed(2)} Youth Weighted`
							: "No filtered place data"
					},
					{
						label: "Lowest Scoring Place",
						value: lowestPlace?.place_name ?? "N/A",
						description: lowestPlace
							? `${lowestPlace.avgWeightedScore.toFixed(2)} Youth Weighted`
							: "No filtered place data"
					},
					{
						label: "Total Audits",
						value: String(filteredAudits.length).padStart(2, "0"),
						description: "Submitted audits available in this analysis view"
					}
				].map(card => (
					<Card key={card.label} className="rounded-[1.5rem] border-slate-200/80 bg-white shadow-sm">
						<CardContent className="space-y-2 p-5">
							<p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
								{card.label}
							</p>
							<p className="text-2xl font-semibold text-slate-950">{card.value}</p>
							<p className="text-sm text-slate-600">{card.description}</p>
						</CardContent>
					</Card>
				))}
			</div>

			<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
				<CardHeader>
					<CardTitle>Export options</CardTitle>
					<CardDescription>
						Export the current comparison, selected audits, printable report view, raw CSV data, or the
						current chart only.
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-wrap gap-3">
					<Button type="button" variant="outline" className="rounded-2xl" onClick={exportCurrentComparison}>
						Export current comparison
					</Button>
					<Button
						type="button"
						variant="outline"
						className="rounded-2xl"
						onClick={exportSelectedAudits}
						disabled={selectedAuditIds.length === 0}>
						Export selected audits
					</Button>
					<Button type="button" variant="outline" className="rounded-2xl" onClick={() => window.print()}>
						Export full PDF report
					</Button>
					<Button type="button" variant="outline" className="rounded-2xl" onClick={exportRawDataCsv}>
						Export CSV raw data
					</Button>
					<Button
						type="button"
						className="rounded-2xl bg-[#10231f] text-white hover:bg-[#17302c]"
						onClick={exportCurrentChart}>
						Export charts only
					</Button>
				</CardContent>
			</Card>

			{compareMode === "places" ? (
				<div className="space-y-6">
					<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
						<CardHeader>
							<CardTitle>Compare Places</CardTitle>
							<CardDescription>
								Compare multiple Places side-by-side using average Raw Score, Youth Weighted Average,
								and section-level performance.
							</CardDescription>
						</CardHeader>
						<CardContent className="overflow-x-auto">
							<table className="min-w-full text-left text-sm">
								<thead className="text-slate-500">
									<tr className="border-b border-slate-200">
										<th className="py-3 pr-4 font-medium">Place</th>
										<th className="py-3 pr-4 font-medium">Project</th>
										<th className="py-3 pr-4 font-medium">Raw Score</th>
										<th className="py-3 pr-4 font-medium">Youth Weighted Average</th>
										<th className="py-3 pr-4 font-medium">Access</th>
										<th className="py-3 pr-4 font-medium">Amenities</th>
										<th className="py-3 font-medium">Detailed report</th>
									</tr>
								</thead>
								<tbody>
									{placeSummaries.map(summary => (
										<tr key={summary.place_id} className="border-b border-slate-100 last:border-0">
											<td className="py-4 pr-4 font-medium text-slate-900">
												<Link
													href={`/dashboard/places/${summary.place_id}`}
													className="underline decoration-slate-300 underline-offset-4 hover:text-slate-950">
													{summary.place_name}
												</Link>
											</td>
											<td className="py-4 pr-4 text-slate-600">{summary.project_name}</td>
											<td className="py-4 pr-4 text-slate-600">
												{summary.avgRawScore} ({summary.avgRawPercent.toFixed(0)}%)
											</td>
											<td className="py-4 pr-4 text-slate-600">
												{summary.avgWeightedScore.toFixed(2)} (
												{summary.avgWeightedPercent.toFixed(0)}%)
											</td>
											<td className="py-4 pr-4 text-slate-600">
												{summary.rawPercentByDomain.access.toFixed(0)}%
											</td>
											<td className="py-4 pr-4 text-slate-600">
												{summary.rawPercentByDomain.amenities.toFixed(0)}%
											</td>
											<td className="py-4 text-slate-600">
												{summary.latestSubmissionId ? (
													<Link
														href={`/yee/submissions/${summary.latestSubmissionId}`}
														className="font-medium underline decoration-slate-300 underline-offset-4 hover:text-slate-950">
														Open latest report
													</Link>
												) : (
													"No linked report"
												)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</CardContent>
					</Card>

					<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
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
									className="rounded-[1.5rem] border border-slate-200 bg-[#f8fbf9] p-4">
									<div className="flex flex-wrap items-center justify-between gap-3">
										<div>
											<Link
												href={`/dashboard/places/${summary.place_id}`}
												className="font-medium text-slate-900 underline decoration-slate-300 underline-offset-4 hover:text-slate-950">
												{summary.place_name}
											</Link>
											<p className="text-sm text-slate-600">{summary.project_name}</p>
										</div>
										<Badge className="rounded-full bg-white px-3 py-1 text-slate-700 hover:bg-white">
											{summary.auditCount} audits
										</Badge>
									</div>
									<div className="mt-4 grid gap-3 md:grid-cols-2">
										<div>
											<p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
												Average Raw Score by section
											</p>
											<div className="flex h-10 overflow-hidden rounded-full border border-slate-200 bg-white">
												{domainOrder.map(domain => (
													<div
														key={domain}
														className="flex items-center justify-center text-[11px] font-medium text-slate-700"
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
											<p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
												Average Youth Weighted Average by section
											</p>
											<div className="flex h-10 overflow-hidden rounded-full border border-slate-200 bg-white">
												{domainOrder.map(domain => (
													<div
														key={domain}
														className="flex items-center justify-center text-[11px] font-medium text-slate-700"
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

					<RadarComparisonChart summaries={placeSummaries} svgRef={chartSvgRef} />
				</div>
			) : null}

			{compareMode === "audits" ? (
				<div className="space-y-6">
					<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
						<CardHeader>
							<CardTitle>Compare audits over time</CardTitle>
							<CardDescription>
								Follow the same Place across multiple audits to identify improvement, decline, and
								change after interventions.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<p className="text-sm text-slate-600">
								Showing timeline for{" "}
								<strong className="text-slate-900">
									{timelineRecords[0]?.place_name ??
										placeSummaries.find(summary => summary.place_id === timelinePlaceId)
											?.place_name ??
										"the selected Place"}
								</strong>
								.
							</p>
							{timelineRecords.length > 0 ? (
								<>
									<TrendLineChart records={timelineRecords} svgRef={chartSvgRef} />
									<div className="grid gap-4 md:grid-cols-3">
										{timelineRecords.slice(-3).map(record => (
											<Card
												key={record.audit_id}
												className="rounded-[1.5rem] border-slate-200/80 bg-white shadow-sm">
												<CardContent className="space-y-2 p-5">
													<p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
														{record.date}
													</p>
													<p className="text-sm font-semibold text-slate-900">
														{record.auditor_id}
													</p>
													<p className="text-sm text-slate-600">
														Raw Score {record.total_raw_score} (
														{getAuditRawPercent(record).toFixed(0)}%)
													</p>
													<p className="text-sm text-slate-600">
														Youth Weighted Average {record.total_weighted_score.toFixed(2)}{" "}
														({getAuditWeightedPercent(record).toFixed(0)}%)
													</p>
													<Link
														href={`/yee/submissions/${record.audit_id}`}
														className="text-sm font-medium text-slate-900 underline decoration-slate-300 underline-offset-4 hover:text-slate-950">
														Open full report
													</Link>
												</CardContent>
											</Card>
										))}
									</div>
								</>
							) : (
								<p className="text-sm text-slate-500">
									Choose one Place to see its audit history over time.
								</p>
							)}
						</CardContent>
					</Card>
				</div>
			) : null}

			{compareMode === "individual" ? (
				<div className="space-y-6">
					<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
						<CardHeader>
							<CardTitle>Compare individual audits</CardTitle>
							<CardDescription>
								Select audits directly to compare auditors, dates, and detailed report outcomes
								side-by-side.
							</CardDescription>
						</CardHeader>
						<CardContent className="overflow-x-auto">
							<table className="min-w-full text-left text-sm">
								<thead className="text-slate-500">
									<tr className="border-b border-slate-200">
										<th className="py-3 pr-4 font-medium">Select</th>
										<th className="py-3 pr-4 font-medium">Place</th>
										<th className="py-3 pr-4 font-medium">Auditor</th>
										<th className="py-3 pr-4 font-medium">Date</th>
										<th className="py-3 pr-4 font-medium">Raw Score</th>
										<th className="py-3 pr-4 font-medium">Youth Weighted Average</th>
										<th className="py-3 font-medium">Full report</th>
									</tr>
								</thead>
								<tbody>
									{filteredAudits.map(record => {
										const checked = selectedAuditIds.includes(record.audit_id);
										return (
											<tr
												key={record.audit_id}
												className="border-b border-slate-100 last:border-0">
												<td className="py-4 pr-4">
													<input
														type="checkbox"
														checked={checked}
														onChange={() =>
															setSelectedAuditIds(current =>
																checked
																	? current.filter(id => id !== record.audit_id)
																	: [...current, record.audit_id]
															)
														}
													/>
												</td>
												<td className="py-4 pr-4 font-medium text-slate-900">
													<Link
														href={`/dashboard/places/${record.place_id}`}
														className="underline decoration-slate-300 underline-offset-4 hover:text-slate-950">
														{record.place_name}
													</Link>
												</td>
												<td className="py-4 pr-4 text-slate-600">{record.auditor_id}</td>
												<td className="py-4 pr-4 text-slate-600">{record.date}</td>
												<td className="py-4 pr-4 text-slate-600">
													{record.total_raw_score}/{totalRawScoreMaximum} (
													{getAuditRawPercent(record).toFixed(0)}%)
												</td>
												<td className="py-4 pr-4 text-slate-600">
													{record.total_weighted_score.toFixed(2)}/
													{getYouthWeightedScoreMaximum(record.domain_weights).toFixed(2)} (
													{getAuditWeightedPercent(record).toFixed(0)}%)
												</td>
												<td className="py-4 text-slate-600">
													<Link
														href={`/yee/submissions/${record.audit_id}`}
														className="font-medium underline decoration-slate-300 underline-offset-4 hover:text-slate-950">
														Open report
													</Link>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</CardContent>
					</Card>

					<div className="grid gap-4 lg:grid-cols-2">
						{selectedIndividualAudits.map(record => (
							<Card
								key={record.audit_id}
								className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
								<CardHeader>
									<CardTitle>{record.place_name}</CardTitle>
									<CardDescription>
										{record.auditor_id} on {record.date}
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="grid gap-3 md:grid-cols-2">
										<div
											className={`rounded-2xl border p-4 ${colorBandClasses(getAuditRawPercent(record))}`}>
											<p className="text-xs font-medium uppercase tracking-[0.16em]">Raw Score</p>
											<p className="mt-2 text-lg font-semibold">
												{record.total_raw_score}/{totalRawScoreMaximum}
											</p>
											<p className="text-sm">{getAuditRawPercent(record).toFixed(0)}%</p>
										</div>
										<div
											className={`rounded-2xl border p-4 ${colorBandClasses(getAuditWeightedPercent(record))}`}>
											<p className="text-xs font-medium uppercase tracking-[0.16em]">
												Youth Weighted Average
											</p>
											<p className="mt-2 text-lg font-semibold">
												{record.total_weighted_score.toFixed(2)}/
												{getYouthWeightedScoreMaximum(record.domain_weights).toFixed(2)}
											</p>
											<p className="text-sm">{getAuditWeightedPercent(record).toFixed(0)}%</p>
										</div>
									</div>
									<div className="grid gap-3 sm:grid-cols-2">
										{domainOrder.map(domain => (
											<div
												key={domain}
												className="rounded-2xl border p-4"
												style={{
													borderColor: yeeDomainThemes[domain].strongFillHex,
													backgroundColor: "#ffffff"
												}}>
												<p
													className="text-sm font-medium"
													style={{ color: yeeDomainThemes[domain].strongHex }}>
													{domainLabels[domain]}
												</p>
												<p className="mt-2 text-sm text-slate-600">
													Raw Score {record.raw_domain_scores[domain]}/
													{rawDomainScoreMaximums[domain]}
												</p>
												<p className="text-sm text-slate-600">
													Youth Weighted Average{" "}
													{record.weighted_domain_scores[domain].toFixed(2)}/
													{getDomainYouthWeightedMaximum(
														domain,
														record.domain_weights
													).toFixed(2)}
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
