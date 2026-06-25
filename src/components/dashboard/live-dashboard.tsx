"use client";

import Link from "next/link";
import * as React from "react";
import { ArrowRight, ArrowUpRight, FilePlus2, MailPlus, MapPinned, ShieldPlus, UserPlus } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { ClearFiltersButton, SearchableMultiSelectFilter } from "@/components/dashboard/table-filters";
import { PlaceComparisonPanel } from "@/components/reporting/place-comparison-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	approveUser,
	fetchAuditors,
	fetchAudits,
	fetchPlaceComparisons,
	fetchPlaces,
	fetchProjects,
	fetchRawData,
	fetchUsers,
	type AuditRecord,
	type DashboardMetric,
	type PlaceComparisonGroupRecord,
	type RawDataRecord,
	type UserRecord
} from "@/lib/dashboard/live-api";
import { toCsv } from "@/lib/csv/to-csv";
import { useDashboardOverview } from "@/features/dashboard/api/use-dashboard-overview";
import { useDashboardRawData } from "@/features/dashboard/api/use-dashboard-raw-data";
import { getYouthWeightedScoreMaximum, totalRawScoreMaximum } from "@/lib/yee-score-limits";

function getManagerQuickLinks(isPrimaryManager: boolean) {
	return [
		{
			title: "Create Project",
			description: "Start a new study with timeline, scope, and ownership.",
			href: "/dashboard/projects/new",
			icon: FilePlus2
		},
		{
			title: "Add Place",
			description: "Create a new field location under one of your projects.",
			href: "/dashboard/places/new",
			icon: MapPinned
		},
		{
			title: "Invite New Auditor",
			description: "Send access to a new fieldworker and track assignment status.",
			href: "/dashboard/auditors/invite",
			icon: UserPlus
		},
		...(isPrimaryManager
			? [
				{
					title: "Invite New Manager",
					description: "Add another manager into this same organization account.",
					href: "/dashboard/managers/invite",
					icon: ShieldPlus
				}
			]
			: [])
	];
}

function metricHref(title: string) {
	const normalized = title.toLowerCase();
	if (normalized.includes("project")) return "/dashboard/projects";
	if (normalized.includes("place")) return "/dashboard/places";
	if (normalized.includes("auditor")) return "/dashboard/auditors";
	if (normalized.includes("audit")) return "/dashboard/audits";
	return "/dashboard";
}

function adminMetricHref(title: string) {
	const normalized = title.toLowerCase();
	if (normalized.includes("user")) return "/admin/users";
	if (normalized.includes("project")) return "/admin/projects";
	if (normalized.includes("place")) return "/admin/places";
	if (normalized.includes("auditor")) return "/admin/users";
	if (normalized.includes("audit")) return "/admin/audits";
	return "/admin";
}

function metricTone(title: string) {
	const normalized = title.toLowerCase();
	if (normalized.includes("user")) {
		return {
			card: "border-sky-200 bg-sky-50/80 hover:border-sky-300",
			badge: "bg-sky-100 text-sky-700"
		};
	}
	if (normalized.includes("project")) {
		return {
			card: "border-amber-200 bg-amber-50/80 hover:border-amber-300",
			badge: "bg-amber-100 text-amber-700"
		};
	}
	if (normalized.includes("place")) {
		return {
			card: "border-emerald-200 bg-emerald-50/80 hover:border-emerald-300",
			badge: "bg-emerald-100 text-emerald-700"
		};
	}
	if (normalized.includes("audit")) {
		return {
			card: "border-violet-200 bg-violet-50/80 hover:border-violet-300",
			badge: "bg-violet-100 text-violet-700"
		};
	}
	return {
		card: "border-border bg-white hover:border-slate-300",
		badge: "bg-muted text-foreground"
	};
}

function useDashboardData<T>(loader: (session: NonNullable<ReturnType<typeof useAuth>["session"]>) => Promise<T>) {
	const { session } = useAuth();
	const [data, setData] = React.useState<T | null>(null);
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState<string | null>(null);

	React.useEffect(() => {
		if (!session) return;
		let cancelled = false;

		const run = async () => {
			setLoading(true);
			setError(null);
			try {
				const result = await loader(session);
				if (!cancelled) {
					setData(result);
				}
			} catch (err) {
				if (!cancelled) {
					setError(err instanceof Error ? err.message : "Could not load dashboard data.");
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
	}, [loader, session]);

	return { data, loading, error };
}

function LoadingCard({ label }: { label: string }) {
	return (
		<Card className="rounded-lg ">
			<CardContent className="p-6 text-sm text-muted-foreground">Loading {label}...</CardContent>
		</Card>
	);
}

function ErrorCard({ message }: { message: string }) {
	return (
		<Card className="rounded-lg border-rose-200 bg-rose-50 shadow-sm">
			<CardContent className="p-6 text-sm text-rose-700">{message}</CardContent>
		</Card>
	);
}

function EmptyState({ title, description }: { title: string; description: string }) {
	return (
		<Card className="rounded-lg ">
			<CardContent className="p-8 text-center">
				<p className="font-medium text-foreground">{title}</p>
				<p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
			</CardContent>
		</Card>
	);
}

function downloadCsv(filename: string, rows: Record<string, string | number>[]) {
	if (rows.length === 0) return;
	const csv = toCsv(rows);
	const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = filename;
	anchor.click();
	URL.revokeObjectURL(url);
}

function rawDataToRows(rows: RawDataRecord[]) {
	return rows.map(row => {
		const base: Record<string, string | number> = {
			Organization: row.organization,
			"Auditor ID": row.auditor_generated_id,
			Project: row.project_name,
			Place: row.place_name,
			Date: row.date,
			"Submitted At": row.submitted_at,
			"Start Time": row.start_time,
			"Finish Time": row.finish_time,
			"Total Minutes": row.total_minutes,
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

function uniqueFilterOptions(values: Array<string | null | undefined>) {
	return Array.from(new Set(values.filter(Boolean) as string[]))
		.sort((left, right) => left.localeCompare(right))
		.map(value => ({ value, label: value }));
}

function includesSelected(selectedValues: string[], value: string | null | undefined) {
	if (selectedValues.length === 0) return true;
	if (!value) return false;
	return selectedValues.includes(value);
}

function intersectsSelected(selectedValues: string[], values: string[]) {
	if (selectedValues.length === 0) return true;
	return values.some(value => selectedValues.includes(value));
}

function parseAssignmentList(value: string) {
	return value
		.split(",")
		.map(item => item.trim())
		.filter(item => item && item !== "None");
}

function getMetricValue(metrics: DashboardMetric[], keyword: string) {
	return metrics.find(metric => metric.title.toLowerCase().includes(keyword.toLowerCase()))?.value ?? "0";
}

function formatScoreValue(value: number | null) {
	if (value === null || Number.isNaN(value)) return "Pending";
	return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function formatPercent(value: number | null) {
	if (value === null || Number.isNaN(value)) return "Pending";
	return `${value.toFixed(2)}%`;
}

function averageDomainWeights(rows: RawDataRecord[]) {
	if (rows.length === 0) return [];
	const domainLabels = {
		access: "Access",
		activitySpaces: "Activity Spaces",
		amenities: "Amenities",
		experienceOfSpace: "Experience of the Space",
		aestheticsAndCare: "Aesthetics & Care",
		useAndUsability: "Use & Usability"
	} as const;

	return Object.entries(domainLabels).map(([domain, label]) => {
		const total = rows.reduce((sum, row) => sum + Number(row.domain_weights[domain] ?? 0), 0);
		const average = total / rows.length;
		const percent = average > 0 ? (average / 3) * 100 : 0;
		return {
			domain,
			label,
			average,
			percent
		};
	});
}

export function LiveManagerOverview() {
	const { session } = useAuth();
	const { data, isLoading: loading, error: queryError } = useDashboardOverview();
	const { data: rawDataResult, isLoading: rawDataLoading, error: rawDataQueryError } = useDashboardRawData();
	const error = queryError
		? queryError instanceof Error
			? queryError.message
			: "Could not load dashboard data."
		: null;
	const rawData = {
		data: rawDataResult ?? null,
		loading: rawDataLoading,
		error: rawDataQueryError
			? rawDataQueryError instanceof Error
				? rawDataQueryError.message
				: "Could not load raw data."
			: null
	};

	if (loading || rawData.loading) return <LoadingCard label="overview" />;
	if (error) return <ErrorCard message={error} />;
	if (rawData.error) return <ErrorCard message={rawData.error} />;
	if (!data)
		return (
			<EmptyState
				title="No dashboard data yet"
				description="Sign in again and make sure the backend is running."
			/>
		);

	const submittedRows = (rawData.data ?? []).filter(row => Boolean(row.submitted_at));
	const averageRawScore =
		submittedRows.length > 0
			? submittedRows.reduce((sum, row) => sum + row.total_raw_score, 0) / submittedRows.length
			: null;
	const averageWeightedScore =
		submittedRows.length > 0
			? submittedRows.reduce((sum, row) => sum + row.total_weighted_score, 0) / submittedRows.length
			: null;
	const averageCapPercentage =
		submittedRows.length > 0
			? submittedRows.reduce((sum, row) => {
				const denominator = getYouthWeightedScoreMaximum(row.domain_weights);
				if (denominator <= 0) return sum;
				return sum + (row.total_weighted_score / denominator) * 100;
			}, 0) / submittedRows.length
			: null;
	const activePlaces = getMetricValue(data.metrics, "place");
	const auditsLogged = getMetricValue(data.metrics, "audit");
	const completedAudits = submittedRows.length;
	const isPrimaryManager = session?.user.is_primary_manager === true;
	const activeAuditCount = Number.parseInt(auditsLogged, 10);
	const auditsInProgress = Number.isNaN(activeAuditCount) ? 0 : Math.max(activeAuditCount - completedAudits, 0);
	const quickLinks = getManagerQuickLinks(isPrimaryManager);
	const managerSnapshotItems = [
		{
			label: "Total Places",
			value: activePlaces,
			helper: "Places currently in this manager's project scope.",
			href: "/dashboard/places"
		},
		{
			label: "Active Audits",
			value: auditsLogged,
			helper: "Draft and submitted audit records tied to this manager's places.",
			href: "/dashboard/audits"
		},
		{
			label: "Completed Audits",
			value: String(completedAudits),
			helper: "Submitted audits currently available for reports, comparisons, and exports.",
			href: "/dashboard/audits"
		},
		{
			label: "Audits in Progress",
			value: String(auditsInProgress),
			helper: "Audits that are still underway and not yet locked as submitted.",
			href: "/dashboard/audits"
		}
	];
	const scoreSummaryItems = [
		{
			label: "Raw Score",
			value: formatScoreValue(averageRawScore),
			helper: "Average raw score across submitted audits in this manager view."
		},
		{
			label: "Youth Weighted Average",
			value: formatScoreValue(averageWeightedScore),
			helper: "Average Youth Weighted average across submitted audits in this manager view."
		},
		{
			label: "Cap Score Percentage",
			value: formatPercent(averageCapPercentage),
			helper: "Average Youth Weighted percentage against the scoring-sheet denominator for each submitted audit."
		},
		{
			label: "Max Score",
			value: `${totalRawScoreMaximum} raw / dynamic Youth Weighted`,
			helper: "Raw total is fixed, while Youth Weighted maxima now depend on normalized domain weights and domain average caps."
		}
	];
	const domainWeightBreakdown = averageDomainWeights(submittedRows);

	return (
		<div className="space-y-6">
			<section className="overflow-hidden rounded-xl border border-emerald-200/60 bg-linear-to-br from-[#10231f] via-[#17302c] to-[#21483b] text-white shadow-xl shadow-emerald-950/10">
				<div className="px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
					<div>
						<Badge className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-white hover:bg-white/10">
							Youth Enabling Environments
						</Badge>
						<h1 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
							Your dashboard is ready for projects, places, and YEE fieldwork.
						</h1>
						<p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-50/80 sm:text-base">
							Use this overview to move into projects, places, auditors, reports, and audit records
							without dead summary cards.
						</p>
						<div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
							{managerSnapshotItems.map(item => (
								<Link
									key={item.label}
									href={item.href}
									className="min-w-0 rounded-lg border border-emerald-200/20 bg-linear-to-br from-white/18 to-white/8 px-4 py-4 backdrop-blur-sm transition hover:border-emerald-200/35 hover:bg-white/16">
									<p className="break-words text-xs font-medium uppercase tracking-normal text-emerald-50/70">
										{item.label}
									</p>
									<p className="mt-2 break-words text-2xl font-semibold text-white">{item.value}</p>
									<p className="mt-2 break-words text-xs leading-5 text-emerald-50/65">
										{item.helper}
									</p>
									<p className="mt-3 text-xs font-medium text-emerald-100">Open</p>
								</Link>
							))}
						</div>
						<div className="mt-6 flex flex-wrap gap-3">
							<Button asChild className="rounded-lg bg-white text-foreground hover:bg-emerald-50">
								<Link href="/dashboard/projects/new">
									Create Project
									<ArrowRight className="size-4" />
								</Link>
							</Button>
							<Button
								asChild
								variant="outline"
								className="rounded-lg border-white/15 bg-white/6 text-white hover:bg-white/10 hover:text-white">
								<Link href="/dashboard/places/new">Add Place</Link>
							</Button>
						</div>
					</div>
				</div>
			</section>

			<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				{scoreSummaryItems.map(item => (
					<Card key={item.label} className="rounded-lg ">
						<CardHeader className="gap-3">
							<CardDescription className="text-sm font-medium text-muted-foreground">
								{item.label}
							</CardDescription>
							<CardTitle className="text-3xl font-semibold tracking-tight text-foreground">
								{item.value}
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							<p className="text-sm leading-6 text-muted-foreground">{item.helper}</p>
						</CardContent>
					</Card>
				))}
			</section>

			<section className="rounded-lg border border-border/80 bg-white p-5 shadow-sm">
				<p className="text-sm font-medium text-foreground">Why Youth Weighted averages differ</p>
				<p className="mt-2 text-sm leading-6 text-muted-foreground">
					Youth Weighted values now use normalized domain weights and per-domain averages, so they reflect
					both the participant&apos;s priorities and how strongly each domain performed relative to its own
					item set.
				</p>
				<div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
					{domainWeightBreakdown.map(item => (
						<div key={item.domain} className="rounded-lg border border-border bg-muted/40 px-4 py-3">
							<p className="text-sm font-medium text-foreground">{item.label}</p>
							<p className="mt-1 text-xs text-muted-foreground">
								Average weighting across submitted audits
							</p>
							<p className="mt-2 text-sm font-semibold text-emerald-800">
								{item.average.toFixed(1)} / 3 ({item.percent.toFixed(0)}%)
							</p>
						</div>
					))}
				</div>
			</section>

			<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				{data.metrics.map(metric => (
					<Link key={metric.title} href={metricHref(metric.title)} className="block">
						<Card
							className={`rounded-lg shadow-sm transition hover:shadow-md ${metricTone(metric.title).card}`}>
							<CardHeader className="gap-3">
								<CardDescription className="text-sm font-medium text-muted-foreground">
									{metric.title}
								</CardDescription>
								<CardTitle className="text-3xl font-semibold tracking-tight text-foreground">
									{metric.value}
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-2">
								<p className="text-sm leading-6 text-muted-foreground">{metric.description}</p>
								<div className="flex items-center justify-between">
									<Badge
										variant="secondary"
										className={`rounded-full ${metricTone(metric.title).badge}`}>
										Manager scope
									</Badge>
									<span className="text-xs font-medium text-muted-foreground">Open</span>
								</div>
							</CardContent>
						</Card>
					</Link>
				))}
			</section>

			<section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
				<Card className="rounded-lg ">
					<CardHeader>
						<CardTitle>Recent activity</CardTitle>
						<CardDescription>
							Recent activity across your projects, places, auditors, and audits.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						{data.recent_activity.map(item => (
							<div
								key={item}
								className="rounded-lg bg-muted/40 px-4 py-4 text-sm leading-6 text-foreground">
								{item}
							</div>
						))}
					</CardContent>
				</Card>

				<Card className="rounded-lg ">
					<CardHeader>
						<CardTitle>Manager actions</CardTitle>
						<CardDescription>
							Core setup actions for projects, places, auditors, and manager access.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						{quickLinks.map(link => {
							const Icon = link.icon;
							return (
								<Link
									key={link.href}
									href={link.href}
									className="flex items-start gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/40">
									<div className="rounded-lg bg-[#e4f5ee] p-2 text-emerald-700">
										<Icon className="size-4" />
									</div>
									<div className="min-w-0">
										<p className="text-sm font-semibold text-foreground">{link.title}</p>
										<p className="mt-1 text-sm leading-6 text-muted-foreground">
											{link.description}
										</p>
									</div>
								</Link>
							);
						})}
					</CardContent>
				</Card>
			</section>

			<AuditTableCard
				title="Latest audit scores"
				description="Recent submitted or draft audits currently available in this manager workspace."
				audits={data.latest_audits}
			/>
		</div>
	);
}

function AuditTableCard({ title, description, audits }: { title: string; description: string; audits: AuditRecord[] }) {
	return (
		<Card className="rounded-lg ">
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent className="overflow-x-auto">
				{audits.length === 0 ? (
					<p className="text-sm text-muted-foreground">No audit rows are available yet.</p>
				) : (
					<table className="min-w-full text-left text-sm">
						<thead className="text-muted-foreground">
							<tr className="border-b border-border">
								<th className="py-3 pr-4 font-medium">Place</th>
								<th className="py-3 pr-4 font-medium">Auditor</th>
								<th className="py-3 pr-4 font-medium">Date</th>
								<th className="py-3 pr-4 font-medium">Score</th>
								<th className="py-3 font-medium">Status</th>
							</tr>
						</thead>
						<tbody>
							{audits.map(audit => (
								<tr key={audit.id} className="border-b border-border last:border-0">
									<td className="py-4 pr-4 font-medium text-foreground">{audit.place}</td>
									<td className="py-4 pr-4 text-muted-foreground">{audit.auditor}</td>
									<td className="py-4 pr-4 text-muted-foreground">{audit.date}</td>
									<td className="py-4 pr-4 text-muted-foreground">
										{audit.status === "Submitted" ? (
											<div className="space-y-1">
												<p>
													<span className="font-medium text-foreground">Raw:</span>{" "}
													{audit.total_raw_score}/{totalRawScoreMaximum}
												</p>
												<p>
													<span className="font-medium text-foreground">Youth Weighted:</span>{" "}
													{audit.total_weighted_score.toFixed(2)}/
													{getYouthWeightedScoreMaximum(audit.domain_weights).toFixed(2)}
												</p>
											</div>
										) : (
											"-"
										)}
									</td>
									<td className="py-4">
										<Badge
											variant="secondary"
											className="rounded-full bg-sky-50 text-sky-700 hover:bg-sky-50">
											{audit.status}
										</Badge>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</CardContent>
		</Card>
	);
}

function useTableData<T>(loader: (session: NonNullable<ReturnType<typeof useAuth>["session"]>) => Promise<T[]>) {
	return useDashboardData(loader);
}

export function LiveProjectsTable() {
	const { data, loading, error } = useTableData(fetchProjects);
	if (loading) return <LoadingCard label="projects" />;
	if (error) return <ErrorCard message={error} />;
	if (!data?.length)
		return (
			<EmptyState
				title="No projects yet"
				description="Create a project to see it appear here from the backend."
			/>
		);
	const showOrganization = data.some(project => project.organization);

	return (
		<Card className="rounded-lg ">
			<CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<CardTitle className="text-2xl">Projects</CardTitle>
					<CardDescription className="mt-2 max-w-2xl leading-6">
						Project records for this manager, including summary, place count, and audit activity.
					</CardDescription>
				</div>
				<Button asChild className="rounded-lg bg-primary text-white hover:bg-primary/90">
					<Link href="/dashboard/projects/new">Create Project</Link>
				</Button>
			</CardHeader>
			<CardContent className="overflow-x-auto">
				<table className="min-w-full text-left text-sm">
					<thead className="text-muted-foreground">
						<tr className="border-b border-border">
							<th className="py-3 pr-4 font-medium">Project Name</th>
							{showOrganization ? <th className="py-3 pr-4 font-medium">Organization</th> : null}
							<th className="py-3 pr-4 font-medium">Project Summary</th>
							<th className="py-3 pr-4 font-medium">Places</th>
							<th className="py-3 pr-4 font-medium">Audits</th>
							<th className="py-3 pr-4 font-medium">Status</th>
							<th className="py-3 font-medium">Action</th>
						</tr>
					</thead>
					<tbody>
						{data.map(project => (
							<tr
								key={project.id}
								className="border-b border-border last:border-0 transition hover:bg-muted/40">
								<td className="py-4 pr-4 font-medium text-foreground">
									<Link
										href={`/dashboard/projects/${project.id}`}
										className="hover:text-foreground hover:underline">
										{project.name}
									</Link>
								</td>
								{showOrganization ? (
									<td className="py-4 pr-4 text-muted-foreground">{project.organization ?? "-"}</td>
								) : null}
								<td className="py-4 pr-4 text-muted-foreground">{project.summary}</td>
								<td className="py-4 pr-4 text-muted-foreground">{project.places}</td>
								<td className="py-4 pr-4 text-muted-foreground">{project.audits}</td>
								<td className="py-4 pr-4">
									<Badge
										variant="secondary"
										className="rounded-full bg-amber-50 text-amber-700 hover:bg-amber-50">
										{project.status}
									</Badge>
								</td>
								<td className="py-4">
									<Link
										href={`/dashboard/projects/${project.id}`}
										className="inline-flex items-center gap-1 text-sm text-foreground hover:text-foreground">
										Open
										<ArrowUpRight className="size-4" />
									</Link>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</CardContent>
		</Card>
	);
}

export function LivePlacesTable() {
	const { data, loading, error } = useTableData(fetchPlaces);
	const [selectedProjects, setSelectedProjects] = React.useState<string[]>([]);
	if (loading) return <LoadingCard label="places" />;
	if (error) return <ErrorCard message={error} />;
	if (!data?.length)
		return (
			<EmptyState
				title="No places yet"
				description="Add a place under a project and it will show here from the backend."
			/>
		);
	const projectOptions = uniqueFilterOptions(data.map(place => place.project));
	const filteredPlaces = data.filter(place => {
		if (!includesSelected(selectedProjects, place.project)) return false;
		return true;
	});
	const filtersActive = selectedProjects.length > 0;

	return (
		<Card className="rounded-lg ">
			<CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<CardTitle className="text-2xl">Places</CardTitle>
					<CardDescription className="mt-2 max-w-2xl leading-6">
						Review place name, address, postal code, assigned auditors, and the next action for each place.
					</CardDescription>
				</div>
				<Button asChild variant="outline" className="rounded-lg">
					<Link href="/dashboard/places/new">Add Place</Link>
				</Button>
			</CardHeader>
			<CardContent className="space-y-4 overflow-x-auto">
				<div className="flex flex-wrap gap-3">
					<SearchableMultiSelectFilter
						label="Project"
						options={projectOptions}
						selectedValues={selectedProjects}
						onChange={setSelectedProjects}
					/>
					<ClearFiltersButton disabled={!filtersActive} onClick={() => setSelectedProjects([])} />
				</div>
				<table className="min-w-full text-left text-sm">
					<thead className="text-muted-foreground">
						<tr className="border-b border-border">
							<th className="py-3 pr-4 font-medium">Place Name</th>
							<th className="py-3 pr-4 font-medium">Address</th>
							<th className="py-3 pr-4 font-medium">Postal Code</th>
							<th className="py-3 pr-4 font-medium">Project Name</th>
							<th className="py-3 pr-4 font-medium">Assigned Auditors</th>
							<th className="py-3 pr-4 font-medium">Total Audits</th>
							<th className="py-3 pr-4 font-medium">Audit State</th>
							<th className="py-3 font-medium">Action</th>
						</tr>
					</thead>
					<tbody>
						{filteredPlaces.length === 0 ? (
							<tr>
								<td colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
									No places match the selected filters.
								</td>
							</tr>
						) : null}
						{filteredPlaces.map(place => (
							<tr key={place.id} className="border-b border-border last:border-0">
								<td className="py-4 pr-4 font-medium text-foreground">{place.name}</td>
								<td className="py-4 pr-4 text-muted-foreground">{place.address}</td>
								<td className="py-4 pr-4 text-muted-foreground">{place.postal_code ?? "-"}</td>
								<td className="py-4 pr-4 text-muted-foreground">{place.project}</td>
								<td className="py-4 pr-4">
									<div className="flex flex-wrap gap-2">
										{place.assigned_auditors.length === 0 ? (
											<span className="text-muted-foreground">No auditors assigned</span>
										) : (
											place.assigned_auditors.map(auditorId => (
												<Badge
													key={auditorId}
													variant="secondary"
													className="rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
													{auditorId}
												</Badge>
											))
										)}
									</div>
								</td>
								<td className="py-4 pr-4 text-muted-foreground">{place.audits}</td>
								<td className="py-4 pr-4">
									<Badge
										variant="secondary"
										className="rounded-full bg-muted text-foreground hover:bg-muted">
										{place.audits === 0 ? "Pending first audit" : place.status}
									</Badge>
								</td>
								<td className="py-4">
									<div className="flex flex-wrap gap-3">
										<Link
											href={`/dashboard/places/${place.id}`}
											className="inline-flex items-center gap-1 text-sm text-foreground hover:text-foreground">
											Open
											<ArrowUpRight className="size-4" />
										</Link>
										<Link
											href={`/dashboard/places/${place.id}/edit`}
											className="inline-flex items-center gap-1 text-sm text-sky-700 hover:text-sky-900">
											Edit
											<ArrowUpRight className="size-4" />
										</Link>
										<Link
											href={`/dashboard/auditors?projectId=${place.project_id}&placeId=${place.id}`}
											className="inline-flex items-center gap-1 text-sm text-emerald-700 hover:text-emerald-900">
											Assign Auditors
											<ArrowUpRight className="size-4" />
										</Link>
										<Link
											href={`/dashboard/audits?projectId=${place.project_id}&placeId=${place.id}`}
											className="inline-flex items-center gap-1 text-sm text-foreground hover:text-foreground">
											View Audits
											<ArrowUpRight className="size-4" />
										</Link>
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</CardContent>
		</Card>
	);
}

export function AdminProjectsTable() {
	const { data, loading, error } = useTableData(fetchProjects);
	const [selectedOrganizations, setSelectedOrganizations] = React.useState<string[]>([]);
	const [selectedProjects, setSelectedProjects] = React.useState<string[]>([]);

	if (loading) return <LoadingCard label="projects" />;
	if (error) return <ErrorCard message={error} />;
	if (!data?.length)
		return (
			<EmptyState
				title="No projects yet"
				description="Create a project to see it appear here from the backend."
			/>
		);

	const organizationOptions = uniqueFilterOptions(data.map(project => project.organization ?? null));
	const projectOptions = uniqueFilterOptions(
		data
			.filter(project => includesSelected(selectedOrganizations, project.organization ?? null))
			.map(project => project.name)
	);
	const filteredProjects = data.filter(project => {
		if (!includesSelected(selectedOrganizations, project.organization ?? null)) return false;
		if (!includesSelected(selectedProjects, project.name)) return false;
		return true;
	});
	const filtersActive = selectedOrganizations.length > 0 || selectedProjects.length > 0;

	return (
		<Card className="rounded-lg ">
			<CardHeader>
				<CardTitle className="text-2xl">Projects</CardTitle>
				<CardDescription className="mt-2 max-w-2xl leading-6">
					System-wide project records with organization-first filtering and summary columns for stakeholder
					review.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4 overflow-x-auto">
				<div className="flex flex-wrap gap-3">
					<SearchableMultiSelectFilter
						label="Organization"
						options={organizationOptions}
						selectedValues={selectedOrganizations}
						onChange={setSelectedOrganizations}
					/>
					<SearchableMultiSelectFilter
						label="Project"
						options={projectOptions}
						selectedValues={selectedProjects}
						onChange={setSelectedProjects}
					/>
					<ClearFiltersButton
						disabled={!filtersActive}
						onClick={() => {
							setSelectedOrganizations([]);
							setSelectedProjects([]);
						}}
					/>
				</div>
				<table className="min-w-full text-left text-sm">
					<thead className="text-muted-foreground">
						<tr className="border-b border-border">
							<th className="py-3 pr-4 font-medium">Organization</th>
							<th className="py-3 pr-4 font-medium">Project Name</th>
							<th className="py-3 pr-4 font-medium">Project Summary</th>
							<th className="py-3 pr-4 font-medium">Places</th>
							<th className="py-3 pr-4 font-medium">Audits</th>
							<th className="py-3 pr-4 font-medium">Status</th>
							<th className="py-3 font-medium">Action</th>
						</tr>
					</thead>
					<tbody>
						{filteredProjects.length === 0 ? (
							<tr>
								<td colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
									No projects match the selected filters.
								</td>
							</tr>
						) : null}
						{filteredProjects.map(project => (
							<tr
								key={project.id}
								className="border-b border-border last:border-0 transition hover:bg-muted/40">
								<td className="py-4 pr-4 text-muted-foreground">{project.organization ?? "-"}</td>
								<td className="py-4 pr-4 font-medium text-foreground">
									<Link
										href={`/dashboard/projects/${project.id}`}
										className="hover:text-foreground hover:underline">
										{project.name}
									</Link>
								</td>
								<td className="py-4 pr-4 text-muted-foreground">{project.summary}</td>
								<td className="py-4 pr-4 text-muted-foreground">{project.places}</td>
								<td className="py-4 pr-4 text-muted-foreground">{project.audits}</td>
								<td className="py-4 pr-4">
									<Badge
										variant="secondary"
										className="rounded-full bg-amber-50 text-amber-700 hover:bg-amber-50">
										{project.status}
									</Badge>
								</td>
								<td className="py-4">
									<Link
										href={`/dashboard/projects/${project.id}`}
										className="inline-flex items-center gap-1 text-sm text-foreground hover:text-foreground">
										Open
										<ArrowUpRight className="size-4" />
									</Link>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</CardContent>
		</Card>
	);
}

export function AdminPlacesTable() {
	const { data, loading, error } = useTableData(fetchPlaces);
	const [selectedOrganizations, setSelectedOrganizations] = React.useState<string[]>([]);
	const [selectedProjects, setSelectedProjects] = React.useState<string[]>([]);

	if (loading) return <LoadingCard label="places" />;
	if (error) return <ErrorCard message={error} />;
	if (!data?.length)
		return (
			<EmptyState
				title="No places yet"
				description="Add a place under a project and it will show here from the backend."
			/>
		);

	const organizationOptions = uniqueFilterOptions(data.map(place => place.organization ?? null));
	const projectOptions = uniqueFilterOptions(
		data
			.filter(place => includesSelected(selectedOrganizations, place.organization ?? null))
			.map(place => place.project)
	);
	const filteredPlaces = data.filter(place => {
		if (!includesSelected(selectedOrganizations, place.organization ?? null)) return false;
		if (!includesSelected(selectedProjects, place.project)) return false;
		return true;
	});
	const filtersActive = selectedOrganizations.length > 0 || selectedProjects.length > 0;

	return (
		<Card className="rounded-lg ">
			<CardHeader>
				<CardTitle className="text-2xl">Places</CardTitle>
				<CardDescription className="mt-2 max-w-2xl leading-6">
					System-wide place rows with organization and project filters that narrow the visible records
					directly.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4 overflow-x-auto">
				<div className="flex flex-wrap gap-3">
					<SearchableMultiSelectFilter
						label="Organization"
						options={organizationOptions}
						selectedValues={selectedOrganizations}
						onChange={setSelectedOrganizations}
					/>
					<SearchableMultiSelectFilter
						label="Project"
						options={projectOptions}
						selectedValues={selectedProjects}
						onChange={setSelectedProjects}
					/>
					<ClearFiltersButton
						disabled={!filtersActive}
						onClick={() => {
							setSelectedOrganizations([]);
							setSelectedProjects([]);
						}}
					/>
				</div>
				<table className="min-w-full text-left text-sm">
					<thead className="text-muted-foreground">
						<tr className="border-b border-border">
							<th className="py-3 pr-4 font-medium">Organization</th>
							<th className="py-3 pr-4 font-medium">Project</th>
							<th className="py-3 pr-4 font-medium">Place Name</th>
							<th className="py-3 pr-4 font-medium">Address</th>
							<th className="py-3 pr-4 font-medium">Postal Code</th>
							<th className="py-3 pr-4 font-medium">Audits</th>
							<th className="py-3 pr-4 font-medium">Last Audit</th>
							<th className="py-3 pr-4 font-medium">Status</th>
							<th className="py-3 font-medium">Action</th>
						</tr>
					</thead>
					<tbody>
						{filteredPlaces.length === 0 ? (
							<tr>
								<td colSpan={9} className="py-8 text-center text-sm text-muted-foreground">
									No places match the selected filters.
								</td>
							</tr>
						) : null}
						{filteredPlaces.map(place => (
							<tr
								key={place.id}
								className="border-b border-border last:border-0 transition hover:bg-muted/40">
								<td className="py-4 pr-4 text-muted-foreground">{place.organization ?? "-"}</td>
								<td className="py-4 pr-4 text-muted-foreground">{place.project}</td>
								<td className="py-4 pr-4 font-medium text-foreground">
									<Link
										href={`/dashboard/places/${place.id}`}
										className="hover:text-foreground hover:underline">
										{place.name}
									</Link>
								</td>
								<td className="py-4 pr-4 text-muted-foreground">{place.address}</td>
								<td className="py-4 pr-4 text-muted-foreground">{place.postal_code ?? "-"}</td>
								<td className="py-4 pr-4 text-muted-foreground">{place.audits}</td>
								<td className="py-4 pr-4 text-muted-foreground">{place.last_audit}</td>
								<td className="py-4 pr-4">
									<Badge
										variant="secondary"
										className="rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
										{place.status}
									</Badge>
								</td>
								<td className="py-4">
									<Link
										href={`/dashboard/places/${place.id}`}
										className="inline-flex items-center gap-1 text-sm text-foreground hover:text-foreground">
										Open
										<ArrowUpRight className="size-4" />
									</Link>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</CardContent>
		</Card>
	);
}

export function LiveAuditorsTable() {
	const { session } = useAuth();
	const { data, loading, error } = useTableData(fetchAuditors);
	if (loading) return <LoadingCard label="auditors" />;
	if (error) return <ErrorCard message={error} />;
	const isAdmin = session?.user.account_type === "ADMIN";
	if (!data?.length) {
		return (
			<Card className="rounded-lg ">
				<CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div>
						<CardTitle className="text-2xl">Auditors</CardTitle>
						<CardDescription className="mt-2 max-w-2xl leading-6">
							No auditors are visible in this scope yet. You can still invite an auditor now.
						</CardDescription>
					</div>
					<Button asChild className="rounded-lg bg-primary text-white hover:bg-primary/90">
						<Link href="/dashboard/auditors/invite">
							<MailPlus className="size-4" />
							Invite New Auditor
						</Link>
					</Button>
				</CardHeader>
			</Card>
		);
	}

	return (
		<Card className="rounded-lg ">
			<CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<CardTitle className="text-2xl">Auditors</CardTitle>
					<CardDescription className="mt-2 max-w-2xl leading-6">
						{isAdmin
							? "Platform-wide auditor records, shown using auditor IDs only to protect personal details."
							: "Auditors currently in this manager's scope, with contact info and place assignments."}
					</CardDescription>
				</div>
				<div className="flex flex-wrap gap-3">
					<Button asChild className="rounded-lg bg-primary text-white hover:bg-primary/90">
						<Link href="/dashboard/auditors/invite">
							<MailPlus className="size-4" />
							Invite New Auditor
						</Link>
					</Button>
					{!isAdmin && session?.user.is_primary_manager ? (
						<Button asChild variant="outline" className="rounded-lg">
							<Link href="/dashboard/managers/invite">
								<ShieldPlus className="size-4" />
								Invite New Manager
							</Link>
						</Button>
					) : null}
				</div>
			</CardHeader>
			<CardContent className="overflow-x-auto">
				<table className="min-w-full text-left text-sm">
					<thead className="text-muted-foreground">
						<tr className="border-b border-border">
							<th className="py-3 pr-4 font-medium">Name</th>
							<th className="py-3 pr-4 font-medium">Auditor ID</th>
							<th className="py-3 pr-4 font-medium">
								{isAdmin ? "Contact Info" : "Email / Contact Info"}
							</th>
							<th className="py-3 pr-4 font-medium">Assigned Places</th>
							<th className="py-3 pr-4 font-medium">Completed Audits</th>
							<th className="py-3 font-medium">Status</th>
						</tr>
					</thead>
					<tbody>
						{data.map(auditor => (
							<tr key={auditor.id} className="border-b border-border last:border-0">
								<td className="py-4 pr-4 font-medium text-foreground">{auditor.name}</td>
								<td className="py-4 pr-4 text-muted-foreground">{auditor.auditor_id}</td>
								<td className="py-4 pr-4 text-muted-foreground">
									{auditor.email || (isAdmin ? "Hidden from admin" : "-")}
								</td>
								<td className="py-4 pr-4 text-muted-foreground">
									{auditor.assigned_places.length > 0
										? auditor.assigned_places.join(", ")
										: "No places assigned"}
								</td>
								<td className="py-4 pr-4 text-muted-foreground">{auditor.completed_audits}</td>
								<td className="py-4">
									<Badge
										variant="secondary"
										className="rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
										{auditor.status}
									</Badge>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</CardContent>
		</Card>
	);
}

export function LiveAuditsTable() {
	const { session } = useAuth();
	const [audits, setAudits] = React.useState<AuditRecord[]>([]);
	const [rawData, setRawData] = React.useState<RawDataRecord[]>([]);
	const [comparisons, setComparisons] = React.useState<PlaceComparisonGroupRecord[]>([]);
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState<string | null>(null);
	const [selectedProjectIds, setSelectedProjectIds] = React.useState<string[]>([]);
	const [selectedPlaceIds, setSelectedPlaceIds] = React.useState<string[]>([]);
	const [selectedAuditIds, setSelectedAuditIds] = React.useState<string[]>([]);
	const [compareError, setCompareError] = React.useState<string | null>(null);

	React.useEffect(() => {
		if (!session) return;
		let cancelled = false;
		const run = async () => {
			setLoading(true);
			setError(null);
			try {
				const [auditRows, rawRows, comparisonRows] = await Promise.all([
					fetchAudits(session),
					fetchRawData(session),
					fetchPlaceComparisons(session)
				]);
				if (!cancelled) {
					setAudits(auditRows);
					setRawData(rawRows);
					setComparisons(comparisonRows);
				}
			} catch (err) {
				if (!cancelled) setError(err instanceof Error ? err.message : "Could not load audits.");
			} finally {
				if (!cancelled) setLoading(false);
			}
		};
		void run();
		return () => {
			cancelled = true;
		};
	}, [session]);

	const projectOptions = React.useMemo(
		() =>
			Array.from(
				new Map(
					audits.map(audit => [audit.project_id, { value: audit.project_id, label: audit.project_name }])
				).values()
			),
		[audits]
	);
	const placeOptions = React.useMemo(() => {
		const matching = audits.filter(
			audit => selectedProjectIds.length === 0 || selectedProjectIds.includes(audit.project_id)
		);
		return Array.from(
			new Map(matching.map(audit => [audit.place_id, { value: audit.place_id, label: audit.place }])).values()
		);
	}, [audits, selectedProjectIds]);

	const filteredAudits = React.useMemo(
		() =>
			audits.filter(audit => {
				if (selectedProjectIds.length > 0 && !selectedProjectIds.includes(audit.project_id)) return false;
				if (selectedPlaceIds.length > 0 && !selectedPlaceIds.includes(audit.place_id)) return false;
				return true;
			}),
		[audits, selectedPlaceIds, selectedProjectIds]
	);

	const filteredRawData = React.useMemo(() => {
		const matchingIds = new Set(filteredAudits.map(audit => audit.submission_id).filter(Boolean));
		return rawData.filter(row => matchingIds.has(row.audit_id));
	}, [filteredAudits, rawData]);

	const selectedRawData = React.useMemo(
		() => rawData.filter(row => selectedAuditIds.includes(row.audit_id)),
		[rawData, selectedAuditIds]
	);

	const selectedComparisonGroup = React.useMemo(() => {
		if (selectedAuditIds.length < 2) return null;
		const selectedRows = filteredAudits.filter(
			audit => audit.submission_id && selectedAuditIds.includes(audit.submission_id)
		);
		const uniquePlaceIds = new Set(selectedRows.map(audit => audit.place_id));
		if (uniquePlaceIds.size !== 1) return null;
		const group = comparisons.find(item => item.place_id === selectedRows[0]?.place_id);
		if (!group) return null;
		return {
			...group,
			audits: group.audits.filter(audit => selectedAuditIds.includes(audit.audit_id))
		};
	}, [comparisons, filteredAudits, selectedAuditIds]);

	function toggleAuditSelection(auditId: string) {
		setSelectedAuditIds(current =>
			current.includes(auditId) ? current.filter(id => id !== auditId) : [...current, auditId]
		);
	}

	function exportRows(rows: RawDataRecord[], filename: string) {
		downloadCsv(filename, rawDataToRows(rows));
	}

	function handleCompare() {
		const selectedRows = filteredAudits.filter(
			audit => audit.submission_id && selectedAuditIds.includes(audit.submission_id)
		);
		const uniquePlaceIds = new Set(selectedRows.map(audit => audit.place_id));
		if (selectedRows.length < 2) {
			setCompareError("Select at least two audits to compare.");
			return;
		}
		if (uniquePlaceIds.size !== 1) {
			setCompareError("Selected audits must belong to the same place to compare them.");
			return;
		}
		setCompareError(null);
	}

	if (loading) return <LoadingCard label="audits" />;
	if (error) return <ErrorCard message={error} />;
	const filtersActive = selectedProjectIds.length > 0 || selectedPlaceIds.length > 0;

	return (
		<div className="space-y-6">
			<Card className="rounded-lg ">
				<CardHeader>
					<CardTitle>Audits</CardTitle>
					<CardDescription>
						Filter by project or place, compare selected audits, and export all, filtered, or selected raw
						data.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4 overflow-x-auto">
					<div className="flex flex-wrap gap-3">
						<SearchableMultiSelectFilter
							label="Project"
							options={projectOptions}
							selectedValues={selectedProjectIds}
							onChange={values => {
								setSelectedProjectIds(values);
								const allowedPlaceIds = new Set(
									audits
										.filter(audit => values.includes(audit.project_id))
										.map(audit => audit.place_id)
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
								setSelectedProjectIds([]);
								setSelectedPlaceIds([]);
								setSelectedAuditIds([]);
							}}
						/>
						<Button
							type="button"
							variant="outline"
							className="rounded-xl"
							onClick={() => exportRows(rawData, "all-audits.csv")}>
							Export All
						</Button>
						<Button
							type="button"
							variant="outline"
							className="rounded-xl"
							onClick={() => exportRows(filteredRawData, "filtered-audits.csv")}>
							Export Filtered
						</Button>
						<Button
							type="button"
							variant="outline"
							className="rounded-xl"
							onClick={() => exportRows(selectedRawData, "selected-audits.csv")}
							disabled={selectedAuditIds.length === 0}>
							Export Selected
						</Button>
						<Button
							type="button"
							className="rounded-xl bg-primary text-white hover:bg-primary/90"
							onClick={handleCompare}
							disabled={selectedAuditIds.length < 2}>
							Compare Selected
						</Button>
					</div>
					{compareError ? <p className="text-sm text-rose-600">{compareError}</p> : null}
					<table className="min-w-full text-left text-sm">
						<thead className="text-muted-foreground">
							<tr className="border-b border-border">
								<th className="py-3 pr-4 font-medium">
									<input
										type="checkbox"
										checked={
											filteredAudits.length > 0 &&
											filteredAudits.every(
												audit =>
													audit.submission_id &&
													selectedAuditIds.includes(audit.submission_id)
											)
										}
										onChange={() =>
											setSelectedAuditIds(current =>
												filteredAudits.every(
													audit =>
														audit.submission_id && current.includes(audit.submission_id)
												)
													? current.filter(
														id =>
															!filteredAudits.some(
																audit => audit.submission_id === id
															)
													)
													: Array.from(
														new Set([
															...current,
															...filteredAudits
																.map(audit => audit.submission_id)
																.filter((submissionId): submissionId is string =>
																	Boolean(submissionId)
																)
														])
													)
											)
										}
									/>
								</th>
								<th className="py-3 pr-4 font-medium">Place</th>
								<th className="py-3 pr-4 font-medium">Auditor ID</th>
								<th className="py-3 pr-4 font-medium">Status</th>
								<th className="py-3 pr-4 font-medium">Score</th>
								<th className="py-3 pr-4 font-medium">Submitted Date</th>
								<th className="py-3 pr-4 font-medium">Report</th>
								<th className="py-3 pr-4 font-medium">Edit Audit</th>
								<th className="py-3 font-medium">Raw Data</th>
							</tr>
						</thead>
						<tbody>
							{filteredAudits.length === 0 ? (
								<tr>
									<td colSpan={9} className="py-8 text-center text-sm text-muted-foreground">
										No audits match the selected filters.
									</td>
								</tr>
							) : null}
							{filteredAudits.map(audit => (
								<tr key={audit.id} className="border-b border-border last:border-0">
									<td className="py-4 pr-4">
										<input
											type="checkbox"
											checked={
												audit.submission_id
													? selectedAuditIds.includes(audit.submission_id)
													: false
											}
											onChange={() =>
												audit.submission_id
													? toggleAuditSelection(audit.submission_id)
													: undefined
											}
											disabled={!audit.submission_id}
										/>
									</td>
									<td className="py-4 pr-4 font-medium text-foreground">{audit.place}</td>
									<td className="py-4 pr-4 text-muted-foreground">{audit.auditor}</td>
									<td className="py-4 pr-4">
										<Badge
											variant="secondary"
											className="rounded-full bg-sky-50 text-sky-700 hover:bg-sky-50">
											{audit.status}
										</Badge>
									</td>
									<td className="py-4 pr-4 text-muted-foreground">
										{audit.status === "Submitted" ? (
											<div className="space-y-1">
												<div>
													<span className="font-medium text-foreground">Raw:</span>{" "}
													{audit.total_raw_score} / {totalRawScoreMaximum}{" "}
													<span className="text-muted-foreground">
														(
														{totalRawScoreMaximum
															? (
																(audit.total_raw_score / totalRawScoreMaximum) *
																100
															).toFixed(0)
															: "0"}
														%)
													</span>
												</div>
												<div>
													<span className="font-medium text-foreground">Youth Weighted:</span>{" "}
													{audit.total_weighted_score.toFixed(2)} /{" "}
													{getYouthWeightedScoreMaximum({
														access: audit.domain_weights.access ?? 0,
														activitySpaces: audit.domain_weights.activitySpaces ?? 0,
														amenities: audit.domain_weights.amenities ?? 0,
														experienceOfSpace: audit.domain_weights.experienceOfSpace ?? 0,
														aestheticsAndCare: audit.domain_weights.aestheticsAndCare ?? 0,
														useAndUsability: audit.domain_weights.useAndUsability ?? 0
													}).toFixed(2)}{" "}
													<span className="text-muted-foreground">
														(
														{(() => {
															const denominator = getYouthWeightedScoreMaximum({
																access: audit.domain_weights.access ?? 0,
																activitySpaces:
																	audit.domain_weights.activitySpaces ?? 0,
																amenities: audit.domain_weights.amenities ?? 0,
																experienceOfSpace:
																	audit.domain_weights.experienceOfSpace ?? 0,
																aestheticsAndCare:
																	audit.domain_weights.aestheticsAndCare ?? 0,
																useAndUsability:
																	audit.domain_weights.useAndUsability ?? 0
															});
															return denominator
																? (
																	(audit.total_weighted_score / denominator) *
																	100
																).toFixed(0)
																: "0";
														})()}
														%)
													</span>
												</div>
											</div>
										) : (
											<span className="text-muted-foreground/70">Available after submit</span>
										)}
									</td>
									<td className="py-4 pr-4 text-muted-foreground">
										{audit.submitted_at ? new Date(audit.submitted_at).toLocaleDateString() : "-"}
									</td>
									<td className="py-4 pr-4">
										{audit.submission_id ? (
											<Button asChild variant="outline" size="sm" className="rounded-xl">
												<Link href={`/yee/submissions/${audit.submission_id}`}>
													View Report
												</Link>
											</Button>
										) : (
											<span className="text-sm text-muted-foreground/70">
												{audit.status === "Submitted"
													? "Open via Edit Audit to restore report"
													: "Available after submit"}
											</span>
										)}
									</td>
									<td className="py-4 pr-4">
										<Button asChild variant="outline" size="sm" className="rounded-xl">
											<Link
												href={
													audit.submission_id
														? `/dashboard/audits/${audit.id}/edit/page/1?submissionId=${encodeURIComponent(audit.submission_id)}`
														: `/dashboard/audits/${audit.id}/edit/page/1`
												}>
												Edit Audit
											</Link>
										</Button>
									</td>
									<td className="py-4">
										{audit.submission_id ? (
											<Button
												type="button"
												variant="outline"
												size="sm"
												className="rounded-xl"
												onClick={() =>
													exportRows(
														rawData.filter(row => row.audit_id === audit.submission_id),
														`audit-${audit.submission_id}.csv`
													)
												}>
												View Raw Data
											</Button>
										) : (
											<span className="text-sm text-muted-foreground/70">
												{audit.status === "Submitted"
													? "Available after report is restored"
													: "Available after submit"}
											</span>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</CardContent>
			</Card>

			{selectedComparisonGroup && !compareError ? <PlaceComparisonPanel group={selectedComparisonGroup} /> : null}
		</div>
	);
}

export function LiveAdminOverview() {
	const { data: overviewData, isLoading: overviewLoading, error: overviewQueryError } = useDashboardOverview();
	const overview = {
		data: overviewData ?? null,
		loading: overviewLoading,
		error: overviewQueryError
			? overviewQueryError instanceof Error
				? overviewQueryError.message
				: "Could not load admin data."
			: null
	};
	const users = useTableData(fetchUsers);

	if (overview.loading || users.loading) return <LoadingCard label="admin dashboard" />;
	if (overview.error) return <ErrorCard message={overview.error} />;
	if (users.error) return <ErrorCard message={users.error} />;
	if (!overview.data)
		return (
			<EmptyState
				title="No admin data yet"
				description="Make sure the backend is running and you are signed in as an admin."
			/>
		);

	return (
		<div className="space-y-6">
			<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				{[
					{
						title: "Users",
						value: `${users.data?.length ?? 0}`,
						description: "All roles across the platform."
					},
					...overview.data.metrics
				]
					.slice(0, 4)
					.map(metric => (
						<Link key={metric.title} href={adminMetricHref(metric.title)} className="block">
							<Card
								className={`rounded-lg shadow-sm transition hover:shadow-md ${metricTone(metric.title).card}`}>
								<CardHeader>
									<CardDescription>{metric.title}</CardDescription>
									<CardTitle className="text-3xl">{metric.value}</CardTitle>
								</CardHeader>
								<CardContent className="space-y-3 text-sm text-muted-foreground">
									<p>{metric.description}</p>
									<div className="flex items-center justify-between">
										<Badge
											variant="secondary"
											className={`rounded-full ${metricTone(metric.title).badge}`}>
											Admin view
										</Badge>
										<span className="text-xs font-medium text-muted-foreground">Open</span>
									</div>
								</CardContent>
							</Card>
						</Link>
					))}
			</section>
			{overview.data.organization_summaries.length > 0 ? (
				<Card className="rounded-lg ">
					<CardHeader>
						<CardTitle>Organization Summary</CardTitle>
						<CardDescription>Platform-wide summary grouped by organization.</CardDescription>
					</CardHeader>
					<CardContent className="overflow-x-auto">
						<table className="min-w-full text-left text-sm">
							<thead className="text-muted-foreground">
								<tr className="border-b border-border">
									<th className="py-3 pr-4 font-medium">Organization</th>
									<th className="py-3 pr-4 font-medium">Users</th>
									<th className="py-3 pr-4 font-medium">Projects</th>
									<th className="py-3 pr-4 font-medium">Places</th>
									<th className="py-3 font-medium">Audits</th>
								</tr>
							</thead>
							<tbody>
								{overview.data.organization_summaries.map(item => (
									<tr key={item.organization} className="border-b border-border last:border-0">
										<td className="py-4 pr-4 font-medium text-foreground">{item.organization}</td>
										<td className="py-4 pr-4 text-muted-foreground">{item.users}</td>
										<td className="py-4 pr-4 text-muted-foreground">{item.projects}</td>
										<td className="py-4 pr-4 text-muted-foreground">{item.places}</td>
										<td className="py-4 text-muted-foreground">{item.audits}</td>
									</tr>
								))}
							</tbody>
						</table>
					</CardContent>
				</Card>
			) : null}
			<LiveUsersTable embedded />
		</div>
	);
}

export function LiveUsersTable({ embedded = false }: { embedded?: boolean }) {
	const { session } = useAuth();
	const [rows, setRows] = React.useState<UserRecord[]>([]);
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState<string | null>(null);
	const [actionError, setActionError] = React.useState<string | null>(null);
	const [selectedAccounts, setSelectedAccounts] = React.useState<Record<string, string>>({});
	const [submittingUserId, setSubmittingUserId] = React.useState<string | null>(null);
	const [selectedOrganizations, setSelectedOrganizations] = React.useState<string[]>([]);
	const [selectedRoles, setSelectedRoles] = React.useState<string[]>([]);
	const [selectedProjects, setSelectedProjects] = React.useState<string[]>([]);

	const accountOptions = React.useMemo(
		() =>
			Array.from(
				new Map(
					rows
						.filter(user => user.account_id && user.organization !== "Unassigned")
						.map(user => [user.account_id as string, user.organization])
				).entries()
			),
		[rows]
	);

	const loadUsers = React.useCallback(async () => {
		if (!session) return;
		setLoading(true);
		setError(null);
		try {
			const result = await fetchUsers(session);
			setRows(result);
			setSelectedAccounts(previous => {
				const next = { ...previous };
				for (const user of result) {
					if (!next[user.id] && user.account_id) {
						next[user.id] = user.account_id;
					}
				}
				return next;
			});
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not load users.");
		} finally {
			setLoading(false);
		}
	}, [session]);

	React.useEffect(() => {
		void loadUsers();
	}, [loadUsers]);

	async function handleApprove(user: UserRecord) {
		if (!session) return;
		try {
			setActionError(null);
			setSubmittingUserId(user.id);
			await approveUser(session, {
				user_id: user.id,
				...(selectedAccounts[user.id] ? { account_id: selectedAccounts[user.id] } : {})
			});
			await loadUsers();
		} catch (err) {
			setActionError(err instanceof Error ? err.message : "Could not approve user.");
		} finally {
			setSubmittingUserId(null);
		}
	}

	if (!embedded && loading) return <LoadingCard label="users" />;
	if (!embedded && error) return <ErrorCard message={error} />;
	if (!rows.length && !loading)
		return (
			<EmptyState
				title="No users yet"
				description="User records will appear here once accounts exist in the backend."
			/>
		);
	const organizationOptions = uniqueFilterOptions(rows.map(user => user.organization));
	const roleOptions = uniqueFilterOptions(rows.map(user => user.role));
	const availableProjectValues = rows
		.filter(user => includesSelected(selectedOrganizations, user.organization))
		.flatMap(user => parseAssignmentList(user.project_assignments));
	const projectOptions = uniqueFilterOptions(availableProjectValues);
	const filteredRows = rows.filter(user => {
		if (!includesSelected(selectedOrganizations, user.organization)) return false;
		if (!includesSelected(selectedRoles, user.role)) return false;
		if (!intersectsSelected(selectedProjects, parseAssignmentList(user.project_assignments))) return false;
		return true;
	});
	const filtersActive = selectedOrganizations.length > 0 || selectedRoles.length > 0 || selectedProjects.length > 0;
	function clearFilters() {
		setSelectedOrganizations([]);
		setSelectedRoles([]);
		setSelectedProjects([]);
	}

	return (
		<Card className="rounded-lg ">
			<CardHeader>
				<CardTitle>Users</CardTitle>
				<CardDescription>
					All managers, auditors, and admins across the system, including approval actions for pending
					accounts.
				</CardDescription>
			</CardHeader>
			{actionError ? <CardContent className="pt-0 text-sm text-rose-700">{actionError}</CardContent> : null}
			<CardContent className="space-y-4 overflow-x-auto">
				<div className="flex flex-wrap gap-3">
					<SearchableMultiSelectFilter
						label="Organization"
						options={organizationOptions}
						selectedValues={selectedOrganizations}
						onChange={setSelectedOrganizations}
					/>
					<SearchableMultiSelectFilter
						label="Role"
						options={roleOptions}
						selectedValues={selectedRoles}
						onChange={setSelectedRoles}
					/>
					<SearchableMultiSelectFilter
						label="Project"
						options={projectOptions}
						selectedValues={selectedProjects}
						onChange={setSelectedProjects}
					/>
					<ClearFiltersButton disabled={!filtersActive} onClick={clearFilters} />
				</div>
				<table className="min-w-full text-left text-sm">
					<thead className="text-muted-foreground">
						<tr className="border-b border-border">
							<th className="py-3 pr-4 font-medium">Organization</th>
							<th className="py-3 pr-4 font-medium">User Name</th>
							<th className="py-3 pr-4 font-medium">Role</th>
							<th className="py-3 pr-4 font-medium">Project Assignment</th>
							<th className="py-3 pr-4 font-medium">Contact Info</th>
							<th className="py-3 font-medium">Action / Status</th>
						</tr>
					</thead>
					<tbody>
						{filteredRows.length === 0 ? (
							<tr>
								<td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
									No users match the selected filters.
								</td>
							</tr>
						) : null}
						{filteredRows.map(user => (
							<tr key={user.id} className="border-b border-border last:border-0">
								<td className="py-4 pr-4 text-muted-foreground">{user.organization}</td>
								<td className="py-4 pr-4 font-medium text-foreground">{user.name}</td>
								<td className="py-4 pr-4 text-muted-foreground">{user.role}</td>
								<td className="py-4 pr-4 text-muted-foreground">{user.project_assignments}</td>
								<td className="py-4 pr-4 text-muted-foreground">
									{user.role === "MANAGER" ? user.contact_info || user.email : ""}
								</td>
								<td className="py-4">
									<div className="flex flex-col gap-2">
										<Badge
											variant="secondary"
											className="w-fit rounded-full bg-muted text-foreground hover:bg-muted">
											{user.status}
										</Badge>
										{!user.approved ? (
											<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
												{user.role === "AUDITOR" ? (
													<select
														value={selectedAccounts[user.id] ?? ""}
														onChange={event =>
															setSelectedAccounts(previous => ({
																...previous,
																[user.id]: event.target.value
															}))
														}
														className="h-9 rounded-xl border border-border bg-white px-3 text-sm text-foreground">
														<option value="">Select workspace</option>
														{accountOptions.map(([accountId, organization]) => (
															<option key={accountId} value={accountId}>
																{organization}
															</option>
														))}
													</select>
												) : null}
												<Button
													size="sm"
													className="rounded-xl bg-primary text-white hover:bg-primary/90"
													onClick={() => void handleApprove(user)}
													disabled={
														submittingUserId === user.id ||
														(user.role === "AUDITOR" &&
															!selectedAccounts[user.id] &&
															!user.account_id)
													}>
													{submittingUserId === user.id ? "Approving..." : "Approve"}
												</Button>
											</div>
										) : (
											<span className="text-sm text-muted-foreground">No action needed</span>
										)}
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</CardContent>
		</Card>
	);
}
