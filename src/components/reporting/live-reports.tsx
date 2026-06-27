"use client";

import Link from "next/link";
import * as React from "react";
import {
	BarChart3,
	Download,
	FileSpreadsheet,
	FileText,
	Image as ImageIcon,
	TrendingDown,
	TrendingUp
} from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { ClearFiltersButton, SearchableMultiSelectFilter } from "@/components/dashboard/table-filters";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	fetchPlaceComparisons,
	fetchRawData,
	type PlaceComparisonAuditRecord,
	type PlaceComparisonGroupRecord,
	type RawDataRecord
} from "@/lib/dashboard/live-api";
import { domainLabels, domainOrder, toCsv } from "@/lib/dashboard/reporting";
import { generateYeeExcelBlob } from "@/lib/export/yee-excel";
import { generateYeePdfBlob } from "@/lib/export/yee-pdf";
import { yeeDomainThemes } from "@/lib/yee-domain-theme";
import {
	getDomainYouthWeightedMaximum,
	getYouthWeightedScoreMaximum,
	rawDomainScoreMaximums,
	totalRawScoreMaximum
} from "@/lib/yee-score-limits";

// ── Types ──────────────────────────────────────────────────────────────────────

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

// ── Pure helpers ───────────────────────────────────────────────────────────────

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

function getAuditRawPercent(record: PlaceComparisonAuditRecord) {
	return percentage(record.total_raw_score, totalRawScoreMaximum);
}

function getAuditWeightedPercent(record: PlaceComparisonAuditRecord) {
	return percentage(record.total_weighted_score, getYouthWeightedScoreMaximum(record.domain_weights));
}

function withinDateRange(dateValue: string | undefined | null, range: DateRangeValue) {
	if (range === "all") return true;
	const currentDate = parseIsoDate(dateValue);
	if (!currentDate) return false;
	const now = new Date();
	const earliest = new Date(now);
	earliest.setDate(now.getDate() - Number(range));
	return currentDate >= earliest;
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
		default:
			return "All dates";
	}
}

function downloadTextFile(filename: string, content: string, type = "text/csv;charset=utf-8;") {
	const blob = new Blob([content], { type });
	triggerBlobDownload(filename, blob);
}

function triggerBlobDownload(filename: string, blob: Blob) {
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
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
			const rawPercentByDomain = Object.fromEntries(domainOrder.map(d => [d, 0])) as Record<
				(typeof domainOrder)[number],
				number
			>;
			const weightedPercentByDomain = Object.fromEntries(domainOrder.map(d => [d, 0])) as Record<
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

			const sortedByDate = [...placeRecords].sort((a, b) => {
				return (parseIsoDate(b.date)?.getTime() ?? 0) - (parseIsoDate(a.date)?.getTime() ?? 0);
			});
			const latest = sortedByDate[0];

			return {
				place_id: first.place_id,
				place_name: first.place_name,
				project_id: first.project_id,
				project_name: first.project_name,
				auditCount: placeRecords.length,
				avgRawScore: Number(
					(placeRecords.reduce((s, r) => s + r.total_raw_score, 0) / placeRecords.length).toFixed(1)
				),
				avgWeightedScore: Number(
					(placeRecords.reduce((s, r) => s + r.total_weighted_score, 0) / placeRecords.length).toFixed(3)
				),
				avgRawPercent: Number(
					(placeRecords.reduce((s, r) => s + getAuditRawPercent(r), 0) / placeRecords.length).toFixed(1)
				),
				avgWeightedPercent: Number(
					(placeRecords.reduce((s, r) => s + getAuditWeightedPercent(r), 0) / placeRecords.length).toFixed(1)
				),
				rawPercentByDomain,
				weightedPercentByDomain,
				latestAuditId: latest?.audit_id ?? null,
				latestSubmissionId: latest?.audit_id ?? null
			};
		})
		.sort((a, b) => b.avgWeightedScore - a.avgWeightedScore);
}

function scoreBandStyle(value: number): string {
	if (value < 34) return "border-rose-200 bg-rose-50 text-rose-800";
	if (value < 67) return "border-amber-200 bg-amber-50 text-amber-800";
	return "border-emerald-200 bg-emerald-50 text-emerald-800";
}

// ── SVG Charts ─────────────────────────────────────────────────────────────────

function radialPoint(index: number, total: number, value: number, radius: number, center = 110) {
	const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
	return {
		x: center + Math.cos(angle) * radius * (value / 100),
		y: center + Math.sin(angle) * radius * (value / 100)
	};
}

function buildPolygonPoints(values: number[], radius: number, center = 110) {
	return values
		.map((v, i) => {
			const p = radialPoint(i, values.length, v, radius, center);
			return `${p.x},${p.y}`;
		})
		.join(" ");
}

const RADAR_COLORS = [
	{ stroke: "#0f766e", fill: "rgba(15,118,110,0.12)" },
	{ stroke: "#2563eb", fill: "rgba(37,99,235,0.12)" },
	{ stroke: "#c2410c", fill: "rgba(194,65,12,0.12)" }
];

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

	return (
		<Card className="rounded-xl border-border">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<BarChart3 className="size-4 text-muted-foreground" />
					Radar comparison
				</CardTitle>
				<CardDescription>
					Spider chart showing domain strengths and gaps across places at a glance.
				</CardDescription>
			</CardHeader>
			<CardContent className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
				<svg
					ref={svgRef}
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
							stroke="#d6dfe6"
							strokeDasharray="4 4"
						/>
					))}
					{domainOrder.map((domain, i) => {
						const outer = radialPoint(i, domainOrder.length, 100, radius, center);
						const label = radialPoint(i, domainOrder.length, 118, radius, center);
						return (
							<g key={domain}>
								<line x1={center} y1={center} x2={outer.x} y2={outer.y} stroke="#d6dfe6" />
								<text
									x={label.x}
									y={label.y}
									textAnchor="middle"
									fill={yeeDomainThemes[domain].strongHex}
									fontSize="8"
									fontWeight="600">
									{domainLabels[domain]}
								</text>
							</g>
						);
					})}
					{series.map((s, i) => (
						<polygon
							key={s.place_id}
							points={buildPolygonPoints(
								domainOrder.map(d => s.rawPercentByDomain[d]),
								radius,
								center
							)}
							fill={RADAR_COLORS[i]!.fill}
							stroke={RADAR_COLORS[i]!.stroke}
							strokeWidth={2.5}
						/>
					))}
				</svg>
				<div className="space-y-3">
					{series.map((s, i) => (
						<div key={s.place_id} className="rounded-lg border border-border bg-muted/30 p-4">
							<div className="flex items-center gap-2.5">
								<span
									className="h-3 w-3 rounded-full"
									style={{ backgroundColor: RADAR_COLORS[i]!.stroke }}
								/>
								<Link
									href={`/dashboard/places/${s.place_id}`}
									className="font-semibold text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground">
									{s.place_name}
								</Link>
							</div>
							<p className="mt-2 text-xs text-muted-foreground">
								Raw: {s.avgRawScore} ({s.avgRawPercent.toFixed(0)}%) · Youth Weighted:{" "}
								{s.avgWeightedScore.toFixed(2)} ({s.avgWeightedPercent.toFixed(0)}%)
							</p>
						</div>
					))}
					{series.length === 0 && (
						<p className="text-sm text-muted-foreground">No places in current selection.</p>
					)}
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
	const w = 720;
	const h = 260;
	const pad = 36;
	const xStep = records.length > 1 ? (w - pad * 2) / (records.length - 1) : 0;
	const px = (i: number) => pad + i * xStep;
	const py = (v: number) => h - pad - ((h - pad * 2) * clampPercentage(v)) / 100;

	const rawPoly = records.map((r, i) => `${px(i)},${py(getAuditRawPercent(r))}`).join(" ");
	const wtdPoly = records.map((r, i) => `${px(i)},${py(getAuditWeightedPercent(r))}`).join(" ");

	return (
		<Card className="rounded-xl border-border">
			<CardHeader>
				<CardTitle>Trend over time</CardTitle>
				<CardDescription>
					Track how one place changes across repeated audits, interventions, and seasons.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="overflow-x-auto rounded-lg border border-border bg-[#f8fbf9]">
					<svg ref={svgRef} viewBox={`0 0 ${w} ${h}`} className="h-[260px] w-full min-w-[400px]">
						{[0, 25, 50, 75, 100].map(v => (
							<g key={v}>
								<line x1={pad} y1={py(v)} x2={w - pad} y2={py(v)} stroke="#d6dfe6" strokeDasharray="4 4" />
								<text x={10} y={py(v) + 4} fill="#94a3b8" fontSize="10">
									{v}%
								</text>
							</g>
						))}
						{records.length > 1 && (
							<>
								<polyline fill="none" stroke="#2563eb" strokeWidth={2.5} strokeLinejoin="round" points={rawPoly} />
								<polyline
									fill="none"
									stroke="#059669"
									strokeWidth={2.5}
									strokeLinejoin="round"
									points={wtdPoly}
								/>
							</>
						)}
						{records.map((r, i) => (
							<g key={r.audit_id}>
								<circle cx={px(i)} cy={py(getAuditRawPercent(r))} r={4} fill="#2563eb" />
								<circle cx={px(i)} cy={py(getAuditWeightedPercent(r))} r={4} fill="#059669" />
								<text x={px(i)} y={h - 10} textAnchor="middle" fill="#94a3b8" fontSize="9">
									{r.date}
								</text>
							</g>
						))}
					</svg>
				</div>
				<div className="flex flex-wrap gap-3">
					<span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
						<span className="h-2 w-2 rounded-full bg-blue-600" />
						Raw Score %
					</span>
					<span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
						<span className="h-2 w-2 rounded-full bg-emerald-600" />
						Youth Weighted Average %
					</span>
				</div>
			</CardContent>
		</Card>
	);
}

// ── Main component ─────────────────────────────────────────────────────────────

export function LiveReports() {
	const { session } = useAuth();

	// Data state
	const [groups, setGroups] = React.useState<PlaceComparisonGroupRecord[]>([]);
	const [rawRows, setRawRows] = React.useState<RawDataRecord[]>([]);
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState<string | null>(null);

	// Filter state
	const [selectedProjectIds, setSelectedProjectIds] = React.useState<string[]>([]);
	const [selectedPlaceIds, setSelectedPlaceIds] = React.useState<string[]>([]);
	const [selectedAuditorIds, setSelectedAuditorIds] = React.useState<string[]>([]);
	const [dateRange, setDateRange] = React.useState<DateRangeValue>("180");

	// View state
	const [compareMode, setCompareMode] = React.useState<CompareMode>("places");
	const [selectedAuditIds, setSelectedAuditIds] = React.useState<string[]>([]);

	// Export state
	const [includeRawData, setIncludeRawData] = React.useState(true);
	const [exportingPdf, setExportingPdf] = React.useState(false);

	// Refs
	const chartSvgRef = React.useRef<SVGSVGElement | null>(null);

	// ── Data fetching ──────────────────────────────────────────────────────────

	React.useEffect(() => {
		if (!session) return;
		let cancelled = false;

		void (async () => {
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
				if (!cancelled) setError(err instanceof Error ? err.message : "Could not load reports.");
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [session]);

	// ── Derived options ────────────────────────────────────────────────────────

	const allAudits = React.useMemo(() => groups.flatMap(g => g.audits), [groups]);

	const projectOptions = React.useMemo(
		() =>
			Array.from(
				new Map(groups.map(g => [g.project_id, { value: g.project_id, label: g.project_name }])).values()
			),
		[groups]
	);

	const placeOptions = React.useMemo(
		() =>
			Array.from(
				new Map(
					groups
						.filter(g => selectedProjectIds.length === 0 || selectedProjectIds.includes(g.project_id))
						.map(g => [g.place_id, { value: g.place_id, label: g.place_name }])
				).values()
			),
		[groups, selectedProjectIds]
	);

	const auditorOptions = React.useMemo(
		() =>
			Array.from(
				new Map(
					allAudits
						.filter(r => selectedPlaceIds.length === 0 || selectedPlaceIds.includes(r.place_id))
						.map(r => [r.auditor_id, { value: r.auditor_id, label: r.auditor_id }])
				).values()
			),
		[allAudits, selectedPlaceIds]
	);

	// ── Filtered data ──────────────────────────────────────────────────────────

	const filteredAudits = React.useMemo(
		() =>
			allAudits.filter(r => {
				if (selectedProjectIds.length > 0 && !selectedProjectIds.includes(r.project_id)) return false;
				if (selectedPlaceIds.length > 0 && !selectedPlaceIds.includes(r.place_id)) return false;
				if (selectedAuditorIds.length > 0 && !selectedAuditorIds.includes(r.auditor_id)) return false;
				if (!withinDateRange(r.date, dateRange)) return false;
				return true;
			}),
		[allAudits, dateRange, selectedAuditorIds, selectedPlaceIds, selectedProjectIds]
	);

	const filteredRawRows = React.useMemo(
		() =>
			rawRows.filter(r => {
				if (selectedProjectIds.length > 0 && !selectedProjectIds.includes(r.project_id)) return false;
				if (selectedPlaceIds.length > 0 && !selectedPlaceIds.includes(r.place_id)) return false;
				if (selectedAuditorIds.length > 0 && !selectedAuditorIds.includes(r.auditor_generated_id))
					return false;
				if (!withinDateRange(r.submitted_at || r.date, dateRange)) return false;
				return true;
			}),
		[dateRange, rawRows, selectedAuditorIds, selectedPlaceIds, selectedProjectIds]
	);

	const placeSummaries = React.useMemo(() => buildPlaceSummaries(filteredAudits), [filteredAudits]);

	// ── Computed metrics ────────────────────────────────────────────────────────

	const averageRawScore =
		filteredAudits.length > 0
			? Number(
					(filteredAudits.reduce((s, r) => s + r.total_raw_score, 0) / filteredAudits.length).toFixed(1)
				)
			: 0;

	const averageWeightedScore =
		filteredAudits.length > 0
			? Number(
					(filteredAudits.reduce((s, r) => s + r.total_weighted_score, 0) / filteredAudits.length).toFixed(2)
				)
			: 0;

	const highestPlace = placeSummaries[0] ?? null;
	const lowestPlace = placeSummaries[placeSummaries.length - 1] ?? null;

	const filtersActive =
		selectedProjectIds.length > 0 ||
		selectedPlaceIds.length > 0 ||
		selectedAuditorIds.length > 0 ||
		dateRange !== "all";

	// ── Timeline (audits mode) ─────────────────────────────────────────────────

	const timelinePlaceId = React.useMemo(
		() => selectedPlaceIds[0] ?? placeSummaries[0]?.place_id ?? "",
		[selectedPlaceIds, placeSummaries]
	);

	const timelineRecords = React.useMemo(
		() =>
			filteredAudits
				.filter(r => !timelinePlaceId || r.place_id === timelinePlaceId)
				.sort(
					(a, b) =>
						(parseIsoDate(a.date)?.getTime() ?? 0) - (parseIsoDate(b.date)?.getTime() ?? 0)
				),
		[filteredAudits, timelinePlaceId]
	);

	// ── Individual selection ───────────────────────────────────────────────────

	React.useEffect(() => {
		setSelectedAuditIds(current => {
			const validIds = new Set(filteredAudits.map(r => r.audit_id));
			const retained = current.filter(id => validIds.has(id));
			if (retained.length > 0) return retained;
			return filteredAudits.slice(0, Math.min(3, filteredAudits.length)).map(r => r.audit_id);
		});
	}, [filteredAudits]);

	const selectedIndividualAudits = React.useMemo(
		() => filteredAudits.filter(r => selectedAuditIds.includes(r.audit_id)),
		[filteredAudits, selectedAuditIds]
	);

	// ── Scope description (for exports) ────────────────────────────────────────

	const scopeDescription = React.useMemo(() => {
		const parts: string[] = [];
		parts.push(
			selectedProjectIds.length > 0 ? `${selectedProjectIds.length} project(s)` : "All projects"
		);
		parts.push(selectedPlaceIds.length > 0 ? `${selectedPlaceIds.length} place(s)` : "All places");
		parts.push(
			selectedAuditorIds.length > 0 ? `${selectedAuditorIds.length} auditor(s)` : "All auditors"
		);
		parts.push(rangeLabel(dateRange));
		return parts.join(" · ");
	}, [selectedProjectIds, selectedPlaceIds, selectedAuditorIds, dateRange]);

	// ── Export handlers ─────────────────────────────────────────────────────────

	async function handleExportPdf() {
		setExportingPdf(true);
		try {
			const blob = await generateYeePdfBlob({
				placeSummaries,
				filteredAudits,
				filteredRawRows,
				averageRawScore,
				averageWeightedScore,
				totalAudits: filteredAudits.length,
				scopeDescription,
				generatedAt: new Date().toLocaleDateString("en-CA"),
				includeRawData
			});
			triggerBlobDownload(`yee-report-${new Date().toISOString().slice(0, 10)}.pdf`, blob);
		} catch {
			// noop — user sees no file downloaded
		} finally {
			setExportingPdf(false);
		}
	}

	function handleExportExcel() {
		const blob = generateYeeExcelBlob({
			placeSummaries,
			filteredAudits,
			filteredRawRows,
			averageRawScore,
			averageWeightedScore,
			totalAudits: filteredAudits.length,
			scopeDescription,
			generatedAt: new Date().toLocaleDateString("en-CA")
		});
		triggerBlobDownload(`yee-report-${new Date().toISOString().slice(0, 10)}.xlsx`, blob);
	}

	function handleExportCsv() {
		const flattened = filteredRawRows.map(r => ({
			organization: r.organization,
			project: r.project_name,
			place: r.place_name,
			auditor: r.auditor_generated_id,
			date: r.date,
			submitted_at: r.submitted_at,
			visit_frequency: r.visit_frequency,
			season: r.season,
			weather: r.weather,
			total_raw_score: r.total_raw_score,
			total_youth_weighted_score: r.total_weighted_score,
			raw_access: r.raw_access,
			raw_activity_spaces: r.raw_activity_spaces,
			raw_amenities: r.raw_amenities,
			raw_experience_of_space: r.raw_experience_of_space,
			raw_aesthetics_and_care: r.raw_aesthetics_and_care,
			raw_use_and_usability: r.raw_use_and_usability,
			weighted_access: r.weighted_access,
			weighted_activity_spaces: r.weighted_activity_spaces,
			weighted_amenities: r.weighted_amenities,
			weighted_experience_of_space: r.weighted_experience_of_space,
			weighted_aesthetics_and_care: r.weighted_aesthetics_and_care,
			weighted_use_and_usability: r.weighted_use_and_usability,
			comments: r.comments,
			...(includeRawData ? r.responses : {})
		}));
		downloadTextFile(`yee-raw-data-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(flattened));
	}

	function handleExportChart() {
		const svg = chartSvgRef.current;
		if (!svg) return;
		downloadTextFile(
			`yee-${compareMode}-chart.svg`,
			new XMLSerializer().serializeToString(svg),
			"image/svg+xml;charset=utf-8;"
		);
	}

	// ── Loading / error states ─────────────────────────────────────────────────

	if (loading) {
		return (
			<div className="space-y-6">
				<ReportsHero loading />
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
					{Array.from({ length: 5 }).map((_, i) => (
						<div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
					))}
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<Card className="rounded-xl border-rose-200 bg-rose-50">
				<CardContent className="p-6 text-sm text-rose-700">{error}</CardContent>
			</Card>
		);
	}

	// ── Render ─────────────────────────────────────────────────────────────────

	return (
		<div className="space-y-6">
			{/* ── Hero ──────────────────────────────────────────────────────────── */}
			<ReportsHero
				totalAudits={filteredAudits.length}
				totalPlaces={placeSummaries.length}
				scopeDescription={scopeDescription}
			/>

			{/* ── Filters ───────────────────────────────────────────────────────── */}
			<Card className="rounded-xl border-border">
				<CardContent className="p-4">
					<div className="flex flex-wrap gap-2.5">
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

						{/* Date range */}
						<div className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2">
							<span className="text-xs font-medium text-muted-foreground">Date</span>
							{(["all", "30", "90", "180", "365"] as DateRangeValue[]).map(opt => (
								<button
									key={opt}
									type="button"
									onClick={() => setDateRange(opt)}
									className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
										dateRange === opt
											? "bg-[#10231f] text-white"
											: "text-muted-foreground hover:bg-muted hover:text-foreground"
									}`}>
									{rangeLabel(opt)}
								</button>
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
				</CardContent>
			</Card>

			{/* ── Metric cards ──────────────────────────────────────────────────── */}
			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
				<MetricCard
					label="Total Audits"
					value={String(filteredAudits.length).padStart(2, "0")}
					description="Submitted audits in current scope"
					accent="blue"
				/>
				<MetricCard
					label="Average Raw Score"
					value={averageRawScore.toFixed(1)}
					description={`Out of ${totalRawScoreMaximum} — ${((averageRawScore / totalRawScoreMaximum) * 100).toFixed(0)}% of max`}
					accent="slate"
				/>
				<MetricCard
					label="Avg Youth Weighted"
					value={averageWeightedScore.toFixed(2)}
					description="Cross-domain weighted average"
					accent="green"
				/>
				<MetricCard
					label="Highest Scoring Place"
					value={highestPlace?.place_name ?? "—"}
					description={
						highestPlace
							? `${highestPlace.avgWeightedScore.toFixed(2)} youth weighted (${highestPlace.avgWeightedPercent.toFixed(0)}%)`
							: "No place data in scope"
					}
					accent="emerald"
					icon={<TrendingUp className="size-3.5" />}
				/>
				<MetricCard
					label="Lowest Scoring Place"
					value={lowestPlace?.place_name ?? "—"}
					description={
						lowestPlace
							? `${lowestPlace.avgWeightedScore.toFixed(2)} youth weighted (${lowestPlace.avgWeightedPercent.toFixed(0)}%)`
							: "No place data in scope"
					}
					accent="amber"
					icon={<TrendingDown className="size-3.5" />}
				/>
			</div>

			{/* ── Compare mode selector ─────────────────────────────────────────── */}
			<div className="flex items-center gap-4">
				<div className="flex flex-1 rounded-xl bg-muted p-1 gap-1">
					{(
						[
							{ key: "places", label: "Compare Places" },
							{ key: "audits", label: "Compare Over Time" },
							{ key: "individual", label: "Individual Audits" }
						] as { key: CompareMode; label: string }[]
					).map(mode => (
						<button
							key={mode.key}
							type="button"
							onClick={() => {
								setCompareMode(mode.key);
								if (mode.key === "audits" && selectedPlaceIds.length > 1) {
									setSelectedPlaceIds(selectedPlaceIds.slice(0, 1));
								}
							}}
							className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
								compareMode === mode.key
									? "bg-background text-foreground shadow-sm"
									: "text-muted-foreground hover:text-foreground"
							}`}>
							{mode.label}
						</button>
					))}
				</div>
			</div>

			{/* ── Compare: Places ───────────────────────────────────────────────── */}
			{compareMode === "places" && (
				<div className="space-y-6">
					{/* Summary table with all 6 domains */}
					<Card className="rounded-xl border-border">
						<CardHeader>
							<CardTitle>Place comparison</CardTitle>
							<CardDescription>
								Average Raw Score, Youth Weighted Average, and all six domain scores per place.
							</CardDescription>
						</CardHeader>
						<CardContent className="overflow-x-auto p-0">
							<table className="min-w-full text-left text-sm">
								<thead>
									<tr className="border-b border-border bg-muted/50">
										<th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Place</th>
										<th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Project</th>
										<th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Audits</th>
										<th className="px-4 py-3 text-xs font-semibold text-muted-foreground">
											Avg Raw %
										</th>
										<th className="px-4 py-3 text-xs font-semibold text-muted-foreground">
											Avg Wtd %
										</th>
										{domainOrder.map(d => (
											<th
												key={d}
												className="px-3 py-3 text-xs font-semibold"
												style={{ color: yeeDomainThemes[d].strongHex }}>
												{domainLabels[d]}
											</th>
										))}
										<th className="px-4 py-3 text-xs font-semibold text-muted-foreground">
											Latest report
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-border">
									{placeSummaries.map(s => (
										<tr key={s.place_id} className="hover:bg-muted/30 transition-colors">
											<td className="px-4 py-3.5 font-semibold text-foreground">
												<Link
													href={`/dashboard/places/${s.place_id}`}
													className="underline decoration-border underline-offset-4 hover:decoration-foreground">
													{s.place_name}
												</Link>
											</td>
											<td className="px-4 py-3.5 text-muted-foreground">{s.project_name}</td>
											<td className="px-4 py-3.5 text-center text-muted-foreground">
												{s.auditCount}
											</td>
											<td className="px-4 py-3.5">
												<span
													className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${scoreBandStyle(s.avgRawPercent)}`}>
													{s.avgRawPercent.toFixed(0)}%
												</span>
											</td>
											<td className="px-4 py-3.5">
												<span
													className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${scoreBandStyle(s.avgWeightedPercent)}`}>
													{s.avgWeightedPercent.toFixed(0)}%
												</span>
											</td>
											{domainOrder.map(d => (
												<td key={d} className="px-3 py-3.5">
													<DomainScorePill
														domain={d}
														value={s.rawPercentByDomain[d]}
													/>
												</td>
											))}
											<td className="px-4 py-3.5 text-muted-foreground">
												{s.latestSubmissionId ? (
													<Link
														href={`/yee/submissions/${s.latestSubmissionId}`}
														className="text-xs font-medium underline decoration-border underline-offset-4 hover:decoration-foreground">
														Open latest
													</Link>
												) : (
													<span className="text-xs text-muted-foreground/60">—</span>
												)}
											</td>
										</tr>
									))}
									{placeSummaries.length === 0 && (
										<tr>
											<td
												colSpan={7 + domainOrder.length}
												className="px-4 py-8 text-center text-sm text-muted-foreground">
												No places match the current filters.
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</CardContent>
					</Card>

					{/* Stacked section bars */}
					<Card className="rounded-xl border-border">
						<CardHeader>
							<CardTitle>Domain profile by place</CardTitle>
							<CardDescription>
								Average raw score % per domain. Each segment is colour-coded to its domain.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-5">
							{placeSummaries.map(s => (
								<div key={s.place_id} className="space-y-2.5">
									<div className="flex items-center justify-between gap-3">
										<div>
											<Link
												href={`/dashboard/places/${s.place_id}`}
												className="font-semibold text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground">
												{s.place_name}
											</Link>
											<p className="text-xs text-muted-foreground">{s.project_name}</p>
										</div>
										<Badge className="rounded-full bg-muted px-3 py-1 text-xs text-foreground hover:bg-muted">
											{s.auditCount} audit{s.auditCount !== 1 ? "s" : ""}
										</Badge>
									</div>
									<div className="space-y-1.5">
										<p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
											Avg raw %
										</p>
										<div className="flex h-8 overflow-hidden rounded-full border border-border">
											{domainOrder.map(d => (
												<div
													key={d}
													title={`${domainLabels[d]}: ${s.rawPercentByDomain[d].toFixed(0)}%`}
													className="flex items-center justify-center text-[10px] font-semibold text-foreground/80"
													style={{
														width: `${100 / domainOrder.length}%`,
														backgroundColor: yeeDomainThemes[d].lightHex
													}}>
													{s.rawPercentByDomain[d].toFixed(0)}%
												</div>
											))}
										</div>
									</div>
									<div className="space-y-1.5">
										<p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
											Avg youth weighted %
										</p>
										<div className="flex h-8 overflow-hidden rounded-full border border-border">
											{domainOrder.map(d => (
												<div
													key={d}
													title={`${domainLabels[d]}: ${s.weightedPercentByDomain[d].toFixed(0)}%`}
													className="flex items-center justify-center text-[10px] font-semibold text-foreground/80"
													style={{
														width: `${100 / domainOrder.length}%`,
														backgroundColor: yeeDomainThemes[d].strongFillHex
													}}>
													{s.weightedPercentByDomain[d].toFixed(0)}%
												</div>
											))}
										</div>
									</div>
									{/* Domain legend */}
									<div className="flex flex-wrap gap-x-4 gap-y-1">
										{domainOrder.map(d => (
											<span key={d} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
												<span
													className="h-2 w-2 rounded-sm"
													style={{ backgroundColor: yeeDomainThemes[d].strongFillHex }}
												/>
												{domainLabels[d]}
											</span>
										))}
									</div>
								</div>
							))}
						</CardContent>
					</Card>

					<RadarComparisonChart summaries={placeSummaries} svgRef={chartSvgRef} />
				</div>
			)}

			{/* ── Compare: Over time ────────────────────────────────────────────── */}
			{compareMode === "audits" && (
				<div className="space-y-6">
					<Card className="rounded-xl border-border">
						<CardHeader>
							<CardTitle>Audit trend over time</CardTitle>
							<CardDescription>
								Showing{" "}
								<strong className="text-foreground">
									{timelineRecords[0]?.place_name ??
										placeSummaries.find(s => s.place_id === timelinePlaceId)?.place_name ??
										"the selected place"}
								</strong>{" "}
								— select a single place to focus the timeline.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							{timelineRecords.length > 0 ? (
								<>
									<TrendLineChart records={timelineRecords} svgRef={chartSvgRef} />

									<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
										{timelineRecords.slice(-6).map(r => (
											<div
												key={r.audit_id}
												className="rounded-xl border border-border bg-card p-4 space-y-2">
												<p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
													{r.date}
												</p>
												<p className="text-sm font-semibold text-foreground">{r.auditor_id}</p>
												<div className="grid grid-cols-2 gap-2">
													<div
														className={`rounded-lg border px-3 py-2 ${scoreBandStyle(getAuditRawPercent(r))}`}>
														<p className="text-[10px] font-semibold uppercase tracking-wider">
															Raw
														</p>
														<p className="text-sm font-bold">
															{r.total_raw_score}/{totalRawScoreMaximum}
														</p>
														<p className="text-xs">{getAuditRawPercent(r).toFixed(0)}%</p>
													</div>
													<div
														className={`rounded-lg border px-3 py-2 ${scoreBandStyle(getAuditWeightedPercent(r))}`}>
														<p className="text-[10px] font-semibold uppercase tracking-wider">
															Wtd
														</p>
														<p className="text-sm font-bold">
															{r.total_weighted_score.toFixed(2)}
														</p>
														<p className="text-xs">{getAuditWeightedPercent(r).toFixed(0)}%</p>
													</div>
												</div>
												<Link
													href={`/yee/submissions/${r.audit_id}`}
													className="block text-xs font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground">
													Open full report →
												</Link>
											</div>
										))}
									</div>
								</>
							) : (
								<p className="py-8 text-center text-sm text-muted-foreground">
									Select a single place to see its audit history over time.
								</p>
							)}
						</CardContent>
					</Card>
				</div>
			)}

			{/* ── Compare: Individual audits ────────────────────────────────────── */}
			{compareMode === "individual" && (
				<div className="space-y-6">
					<Card className="rounded-xl border-border">
						<CardHeader>
							<CardTitle>Select audits to compare</CardTitle>
							<CardDescription>
								Check audits below to compare them side-by-side with full domain breakdowns.
							</CardDescription>
						</CardHeader>
						<CardContent className="overflow-x-auto p-0">
							<table className="min-w-full text-left text-sm">
								<thead>
									<tr className="border-b border-border bg-muted/50">
										<th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Select</th>
										<th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Place</th>
										<th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Auditor</th>
										<th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Date</th>
										<th className="px-4 py-3 text-xs font-semibold text-muted-foreground">
											Raw Score
										</th>
										<th className="px-4 py-3 text-xs font-semibold text-muted-foreground">
											Youth Weighted
										</th>
										<th className="px-4 py-3 text-xs font-semibold text-muted-foreground">
											Full report
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-border">
									{filteredAudits.map(r => {
										const checked = selectedAuditIds.includes(r.audit_id);
										return (
											<tr
												key={r.audit_id}
												className={`transition-colors hover:bg-muted/30 ${checked ? "bg-[#dcefe0]/30" : ""}`}>
												<td className="px-4 py-3">
													<input
														type="checkbox"
														checked={checked}
														className="size-4 rounded accent-[#5c8f68]"
														onChange={() =>
															setSelectedAuditIds(cur =>
																checked
																	? cur.filter(id => id !== r.audit_id)
																	: [...cur, r.audit_id]
															)
														}
													/>
												</td>
												<td className="px-4 py-3 font-semibold text-foreground">
													<Link
														href={`/dashboard/places/${r.place_id}`}
														className="underline decoration-border underline-offset-4 hover:decoration-foreground">
														{r.place_name}
													</Link>
												</td>
												<td className="px-4 py-3 text-muted-foreground">{r.auditor_id}</td>
												<td className="px-4 py-3 text-muted-foreground">{r.date}</td>
												<td className="px-4 py-3">
													<span
														className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${scoreBandStyle(getAuditRawPercent(r))}`}>
														{r.total_raw_score}/{totalRawScoreMaximum} (
														{getAuditRawPercent(r).toFixed(0)}%)
													</span>
												</td>
												<td className="px-4 py-3">
													<span
														className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${scoreBandStyle(getAuditWeightedPercent(r))}`}>
														{r.total_weighted_score.toFixed(2)} (
														{getAuditWeightedPercent(r).toFixed(0)}%)
													</span>
												</td>
												<td className="px-4 py-3">
													<Link
														href={`/yee/submissions/${r.audit_id}`}
														className="text-xs font-medium underline decoration-border underline-offset-4 hover:decoration-foreground">
														Open →
													</Link>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</CardContent>
					</Card>

					{selectedIndividualAudits.length > 0 && (
						<div className="grid gap-4 lg:grid-cols-2">
							{selectedIndividualAudits.map(r => (
								<Card key={r.audit_id} className="rounded-xl border-border">
									<CardHeader className="pb-3">
										<CardTitle className="text-base">{r.place_name}</CardTitle>
										<CardDescription>
											Auditor {r.auditor_id} · {r.date}
										</CardDescription>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="grid gap-3 sm:grid-cols-2">
											<div
												className={`rounded-xl border p-4 ${scoreBandStyle(getAuditRawPercent(r))}`}>
												<p className="text-[10px] font-bold uppercase tracking-widest">
													Raw Score
												</p>
												<p className="mt-2 text-xl font-bold">
													{r.total_raw_score}
													<span className="ml-1 text-sm font-normal opacity-60">
														/ {totalRawScoreMaximum}
													</span>
												</p>
												<p className="text-sm font-medium">
													{getAuditRawPercent(r).toFixed(0)}%
												</p>
											</div>
											<div
												className={`rounded-xl border p-4 ${scoreBandStyle(getAuditWeightedPercent(r))}`}>
												<p className="text-[10px] font-bold uppercase tracking-widest">
													Youth Weighted
												</p>
												<p className="mt-2 text-xl font-bold">
													{r.total_weighted_score.toFixed(2)}
													<span className="ml-1 text-sm font-normal opacity-60">
														/ {getYouthWeightedScoreMaximum(r.domain_weights).toFixed(2)}
													</span>
												</p>
												<p className="text-sm font-medium">
													{getAuditWeightedPercent(r).toFixed(0)}%
												</p>
											</div>
										</div>
										<div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
											{domainOrder.map(d => (
												<div
													key={d}
													className="rounded-lg border p-3"
													style={{
														borderColor: yeeDomainThemes[d].strongFillHex,
														backgroundColor: yeeDomainThemes[d].lightHex + "60"
													}}>
													<p
														className="text-xs font-semibold"
														style={{ color: yeeDomainThemes[d].strongHex }}>
														{domainLabels[d]}
													</p>
													<p className="mt-1.5 text-sm font-bold text-foreground">
														{r.raw_domain_scores[d]}
														<span className="ml-0.5 text-xs font-normal text-muted-foreground">
															/ {rawDomainScoreMaximums[d]}
														</span>
													</p>
													<p className="text-xs text-muted-foreground">
														{percentage(r.raw_domain_scores[d], rawDomainScoreMaximums[d]).toFixed(0)}%
													</p>
												</div>
											))}
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</div>
			)}

			{/* ── Export panel ──────────────────────────────────────────────────── */}
			<Card className="rounded-xl border-border">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Download className="size-4 text-muted-foreground" />
						Export & Download
					</CardTitle>
					<CardDescription>
						Generate professional reports and raw data exports from the current filtered view. PDF and
						Excel include all {filteredAudits.length} audit{filteredAudits.length !== 1 ? "s" : ""} and{" "}
						{placeSummaries.length} place{placeSummaries.length !== 1 ? "s" : ""}.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-5">
					<label className="flex cursor-pointer items-center gap-2.5 text-sm">
						<input
							type="checkbox"
							checked={includeRawData}
							onChange={e => setIncludeRawData(e.target.checked)}
							className="size-4 rounded accent-[#5c8f68]"
						/>
						<span>
							Include individual question responses in exports{" "}
							<span className="text-muted-foreground">(adds Raw Responses sheet to Excel)</span>
						</span>
					</label>

					<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
						<ExportButton
							icon={<FileText className="size-4" />}
							label={exportingPdf ? "Generating PDF…" : "PDF Report"}
							description="Multi-page report with charts summary and domain scores"
							disabled={exportingPdf || filteredAudits.length === 0}
							loading={exportingPdf}
							onClick={handleExportPdf}
							primary
						/>
						<ExportButton
							icon={<FileSpreadsheet className="size-4" />}
							label="Excel Workbook"
							description="4-sheet workbook: Overview, Places, Audits, Raw Responses"
							disabled={filteredAudits.length === 0}
							onClick={handleExportExcel}
						/>
						<ExportButton
							icon={<Download className="size-4" />}
							label="CSV Raw Data"
							description="Flat CSV with all audit fields and question responses"
							disabled={filteredRawRows.length === 0}
							onClick={handleExportCsv}
						/>
						<ExportButton
							icon={<ImageIcon className="size-4" />}
							label="Chart SVG"
							description="Export the current chart as a vector SVG file"
							disabled={!chartSvgRef.current}
							onClick={handleExportChart}
						/>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ReportsHero({
	loading,
	totalAudits,
	totalPlaces,
	scopeDescription
}: {
	loading?: boolean;
	totalAudits?: number;
	totalPlaces?: number;
	scopeDescription?: string;
}) {
	return (
		<div
			className="relative overflow-hidden rounded-xl border border-[#1e3a33] bg-[#10231f] px-6 py-7 sm:px-8 sm:py-8"
			style={{ boxShadow: "0 6px 0 rgba(0,0,0,0.22), 0 12px 28px rgba(0,0,0,0.18)" }}>
			<div
				className="absolute inset-x-0 bottom-0 h-[3px]"
				style={{ backgroundColor: "#5c8f68" }}
			/>
			<p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#5c8f68]">
				Analytics &amp; Reporting
			</p>
			<h1 className="mt-2 text-balance text-2xl font-bold text-white sm:text-3xl">
				Reports Dashboard
			</h1>
			<p className="mt-2 max-w-prose text-sm leading-relaxed text-[#7fb58b]/80">
				Analyze performance across places and time. Filter by project, place, auditor, and date
				range — then export a professional PDF, Excel workbook, or CSV.
			</p>
			{!loading && scopeDescription && (
				<p className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[#2e5040] bg-[#1a3028] px-3 py-1 text-xs text-[#7fb58b]">
					<BarChart3 className="size-3" />
					{totalAudits} audit{totalAudits !== 1 ? "s" : ""} · {totalPlaces} place
					{totalPlaces !== 1 ? "s" : ""} · {scopeDescription.split("·").pop()?.trim()}
				</p>
			)}
		</div>
	);
}

type MetricCardAccent = "blue" | "green" | "emerald" | "amber" | "slate" | "rose";

const ACCENT_STYLES: Record<MetricCardAccent, { bar: string; border: string; text: string }> = {
	blue: {
		bar: "bg-blue-500",
		border: "border-l-blue-400",
		text: "text-blue-600"
	},
	green: {
		bar: "bg-[#5c8f68]",
		border: "border-l-[#5c8f68]",
		text: "text-[#5c8f68]"
	},
	emerald: {
		bar: "bg-emerald-500",
		border: "border-l-emerald-400",
		text: "text-emerald-600"
	},
	amber: {
		bar: "bg-amber-500",
		border: "border-l-amber-400",
		text: "text-amber-600"
	},
	slate: {
		bar: "bg-slate-500",
		border: "border-l-slate-400",
		text: "text-slate-600"
	},
	rose: {
		bar: "bg-rose-500",
		border: "border-l-rose-400",
		text: "text-rose-600"
	}
};

function MetricCard({
	label,
	value,
	description,
	accent,
	icon
}: {
	label: string;
	value: string;
	description: string;
	accent: MetricCardAccent;
	icon?: React.ReactNode;
}) {
	const styles = ACCENT_STYLES[accent];
	return (
		<div
			className={`relative overflow-hidden rounded-xl border-l-[3px] border border-border bg-card shadow-sm ${styles.border}`}>
			<div className={`absolute inset-x-0 top-0 h-[3px] ${styles.bar}`} />
			<div className="p-5 pt-6">
				<p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
					{label}
				</p>
				<p className="mt-2 font-mono text-[1.6rem] font-semibold leading-none tabular-nums tracking-tight text-foreground">
					{value}
				</p>
				{icon ? (
					<p className={`mt-2 flex items-center gap-1 text-xs ${styles.text}`}>
						{icon}
						<span className="text-muted-foreground">{description}</span>
					</p>
				) : (
					<p className="mt-2 max-w-[28ch] text-xs text-muted-foreground">{description}</p>
				)}
			</div>
		</div>
	);
}

function DomainScorePill({
	domain,
	value
}: {
	domain: (typeof domainOrder)[number];
	value: number;
}) {
	return (
		<span
			className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
			style={{
				backgroundColor: yeeDomainThemes[domain].lightHex,
				color: yeeDomainThemes[domain].strongHex
			}}>
			{value.toFixed(0)}%
		</span>
	);
}

function ExportButton({
	icon,
	label,
	description,
	onClick,
	disabled,
	loading,
	primary
}: {
	icon: React.ReactNode;
	label: string;
	description: string;
	onClick: () => void;
	disabled?: boolean;
	loading?: boolean;
	primary?: boolean;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			className={`group flex flex-col gap-2 rounded-xl border p-4 text-left transition-all disabled:pointer-events-none disabled:opacity-50 ${
				primary
					? "border-[#2e5040] bg-[#10231f] hover:bg-[#1a3028] text-white"
					: "border-border bg-card hover:border-[#7fb58b] hover:bg-[#f0f9f2] text-foreground"
			}`}>
			<div
				className={`flex items-center gap-2 font-semibold text-sm ${primary ? "text-[#7fb58b]" : "text-foreground"}`}>
				{loading ? (
					<span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
				) : (
					icon
				)}
				{label}
			</div>
			<p
				className={`text-xs leading-relaxed ${primary ? "text-[#7fb58b]/70" : "text-muted-foreground"}`}>
				{description}
			</p>
		</button>
	);
}
