"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { ArrowRight, ArrowUpRight, FilePlus2, Layers, MailPlus, MapPinned, ShieldPlus, UserPlus } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { useAuth } from "@/features/auth/components/auth-provider";
import { ClearFiltersButton, SearchableMultiSelectFilter } from "@/features/workspaces/components/table-filters";
import { PlaceComparisonPanel } from "@/features/reporting/components/place-comparison-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TableSkeleton } from "@/components/ui/skeletons";
import { DashboardHero } from "@/components/ui/dashboard-hero";
import { DataTable, DataTableRowActions } from "@/components/ui/data-table";
import { ScoreCell } from "@/components/ui/score-cell";
import { StatusBadge, StatusBadgeFor } from "@/components/ui/status-badge";
import { getPlaceStatus } from "@/lib/status";
import {
	approveUser,
	fetchAuditors,
	fetchAudits,
	fetchPlaceComparisons,
	fetchPlaces,
	fetchProjects,
	fetchRawData,
	fetchUsers,
	type AuditorRecord,
	type AuditRecord,
	type DashboardMetric,
	type PlaceComparisonGroupRecord,
	type PlaceRecord,
	type ProjectRecord,
	type RawDataRecord,
	type UserRecord
} from "@/features/workspaces/api/live-api";
import { toCsv } from "@/lib/csv/to-csv";
import { useDashboardOverview } from "@/features/workspaces/api/use-dashboard-overview";
import { useDashboardRawData } from "@/features/workspaces/api/use-dashboard-raw-data";

function getManagerQuickLinks(isPrimaryManager: boolean) {
	return [
		{
			title: "Create Project",
			description: "Start a new study with timeline, scope, and ownership.",
			href: "/manager/projects/new",
			icon: FilePlus2
		},
		{
			title: "Add Place",
			description: "Create a new field location under one of your projects.",
			href: "/manager/places/new",
			icon: MapPinned
		},
		{
			title: "Invite New Auditor",
			description: "Send access to a new fieldworker and track assignment status.",
			href: "/manager/auditors/invite",
			icon: UserPlus
		},
		...(isPrimaryManager
			? [
					{
						title: "Invite New Manager",
						description: "Add another manager into this same organization account.",
						href: "/manager/managers/invite",
						icon: ShieldPlus
					}
				]
			: [])
	];
}

function metricHref(title: string) {
	const normalized = title.toLowerCase();
	if (normalized.includes("project")) return "/manager/projects";
	if (normalized.includes("place")) return "/manager/places";
	if (normalized.includes("auditor")) return "/manager/auditors";
	if (normalized.includes("audit")) return "/manager/audits";
	return "/manager";
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
	return <TableSkeleton aria-label={`Loading ${label}…`} />;
}

function ErrorCard({ message }: { message: string }) {
	return (
		<Card className="rounded-md border-rose-200 bg-rose-50 shadow-sm">
			<CardContent className="p-6 text-sm text-rose-700">{message}</CardContent>
		</Card>
	);
}

function EmptyState({ title, description }: { title: string; description: string }) {
	return (
		<Card className="rounded-md ">
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
					const denominator = row.total_weighted_maximum;
					if (!denominator || denominator <= 0) return sum;
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
			helper: "Places under all your projects.",
			href: "/manager/places"
		},
		{
			label: "Active Audits",
			value: auditsLogged,
			helper: "Draft and submitted audit records tied to your places.",
			href: "/manager/audits"
		},
		{
			label: "Completed Audits",
			value: String(completedAudits),
			helper: "Submitted audits currently available for reports, comparisons, and exports.",
			href: "/manager/audits"
		},
		{
			label: "Audits in Progress",
			value: String(auditsInProgress),
			helper: "Audits that are still underway and not yet locked as submitted.",
			href: "/manager/audits"
		}
	];
	const scoreSummaryItems = [
		{
			label: "Average raw score",
			value: formatScoreValue(averageRawScore),
			helper: "The average raw score across your submitted audits."
		},
		{
			label: "Average youth-weighted score",
			value: formatScoreValue(averageWeightedScore),
			helper: "The average youth-weighted score across your submitted audits."
		},
		{
			label: "Youth-weighted %",
			value: formatPercent(averageCapPercentage),
			helper: "How close your youth-weighted scores are to the maximum possible, averaged across audits."
		},
		{
			label: "Maximum raw score",
			value: `${submittedRows[0]?.total_raw_maximum ?? "—"}`,
			helper: "The most a raw score can reach. Youth-weighted maximums vary with each audit's weighting."
		}
	];
	const domainWeightBreakdown = averageDomainWeights(submittedRows);

	return (
		<div className="space-y-6">
			<DashboardHero
				badge="Youth Enabling Environments"
				title="Your dashboard is ready for projects, places, and YEE fieldwork."
				subtitle="Jump straight into your projects, places, auditors, reports, and audit records — all from one place."
				stats={managerSnapshotItems}
				actions={
					<>
						<Button asChild className="bg-white text-foreground hover:bg-emerald-50">
							<Link href="/manager/projects/new">
								Create Project
								<ArrowRight className="size-4" />
							</Link>
						</Button>
						<Button
							asChild
							variant="outline"
							className="border-white/15 bg-white/6 text-white hover:bg-white/10 hover:text-white">
							<Link href="/manager/places/new">Add Place</Link>
						</Button>
					</>
				}
			/>

			<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				{scoreSummaryItems.map(item => (
					<Card key={item.label} className="rounded-md ">
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

			<section className="rounded-md border border-border/80 bg-white p-5 shadow-sm">
				<p className="text-sm font-medium text-foreground">Why Youth Weighted averages differ</p>
				<p className="mt-2 text-sm leading-6 text-muted-foreground">
					Youth Weighted values now use normalized domain weights and per-domain averages, so they reflect
					both the participant&apos;s priorities and how strongly each domain performed relative to its own
					item set.
				</p>
				<div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
					{domainWeightBreakdown.map(item => (
						<div key={item.domain} className="rounded-md border border-border bg-muted/40 px-4 py-3">
							<p className="text-sm font-medium text-foreground">{item.label}</p>
							<p className="mt-1 text-xs text-muted-foreground">
								Average weighting across submitted audits
							</p>
							<p className="mt-2 text-sm font-semibold text-emerald-800">
								{item.average?.toFixed(1)} / 3 ({item.percent?.toFixed(0)}%)
							</p>
						</div>
					))}
				</div>
			</section>

			<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				{data.metrics.map(metric => (
					<Link key={metric.title} href={metricHref(metric.title)} className="block">
						<Card
							className={`rounded-md shadow-sm transition hover:shadow-md ${metricTone(metric.title).card}`}>
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
								{/* <div className="flex items-center justify-between">
									<Badge
										variant="secondary"
										className={`rounded-full ${metricTone(metric.title).badge}`}>
										Your organization
									</Badge>
									<span className="text-xs font-medium text-muted-foreground">Open</span>
								</div> */}
							</CardContent>
						</Card>
					</Link>
				))}
			</section>

			<section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_430px]">
				<Card className="rounded-md ">
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
								className="rounded-md bg-muted/40 px-4 py-4 text-sm leading-6 text-foreground">
								{item}
							</div>
						))}
					</CardContent>
				</Card>

				<Card className="rounded-md ">
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
									className="flex items-start gap-3 rounded-md border border-border p-4 transition-colors hover:bg-muted/40">
									<div className="rounded-md bg-[#e4f5ee] p-2 text-emerald-700">
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

/** Score cell shared by the audit tables — a null-safe ScoreCell once submitted. */
function AuditScoreCell({ audit }: { audit: AuditRecord }) {
	if (audit.status !== "Submitted") {
		return <span className="text-muted-foreground/70">Available after submit</span>;
	}
	return (
		<ScoreCell
			raw={audit.total_raw_score}
			rawMax={audit.total_raw_maximum}
			weighted={audit.total_weighted_score}
			weightedMax={audit.total_weighted_maximum}
		/>
	);
}

/** Columns for the read-only "latest audits" dashboard summary. */
const latestAuditColumns: ColumnDef<AuditRecord>[] = [
	{
		accessorKey: "place",
		header: "Place",
		cell: ({ getValue }) => <span className="font-medium text-foreground">{String(getValue())}</span>
	},
	{
		accessorKey: "auditor",
		header: "Auditor",
		cell: ({ getValue }) => <span className="text-muted-foreground">{String(getValue())}</span>
	},
	{
		accessorKey: "date",
		header: "Date",
		cell: ({ getValue }) => <span className="text-muted-foreground">{String(getValue())}</span>
	},
	{
		id: "score",
		header: "Score",
		enableSorting: false,
		cell: ({ row }) => <AuditScoreCell audit={row.original} />
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ getValue }) => <StatusBadge label={String(getValue())} tone="secondary" />
	}
];

function AuditSummaryMobileCard({ audit }: { audit: AuditRecord }) {
	return (
		<div className="space-y-2 rounded-md border border-border bg-card p-4">
			<div className="flex items-start justify-between gap-3">
				<div>
					<p className="font-medium text-foreground">{audit.place}</p>
					<p className="text-sm text-muted-foreground">
						{audit.auditor} · {audit.date}
					</p>
				</div>
				<StatusBadge label={audit.status} tone="secondary" />
			</div>
			<AuditScoreCell audit={audit} />
		</div>
	);
}

/** Stacked mobile card for the full audits table — carries selection + row actions. */
function AuditRowMobileCard({
	audit,
	isSelected,
	onToggle
}: {
	audit: AuditRecord;
	isSelected: boolean;
	onToggle: (submissionId: string) => void;
}) {
	const submissionId = audit.submission_id;
	const editHref = submissionId
		? `/manager/audits/${audit.id}/edit/page/1?submissionId=${encodeURIComponent(submissionId)}`
		: `/manager/audits/${audit.id}/edit/page/1`;
	return (
		<div className="space-y-3 rounded-md border border-border bg-card p-4">
			<div className="flex items-start gap-3">
				<input
					type="checkbox"
					aria-label={`Select audit for ${audit.place}`}
					className="mt-1"
					checked={isSelected}
					disabled={!submissionId}
					onChange={() => (submissionId ? onToggle(submissionId) : undefined)}
				/>
				<div className="min-w-0 flex-1 space-y-1">
					<div className="flex items-start justify-between gap-2">
						<p className="font-medium text-foreground">{audit.place}</p>
						<StatusBadge label={audit.status} tone="secondary" />
					</div>
					<p className="text-sm text-muted-foreground">{audit.auditor}</p>
					<AuditScoreCell audit={audit} />
				</div>
			</div>
			<DataTableRowActions
				primary={
					submissionId
						? { label: "View report", href: `/yee/submissions/${submissionId}` }
						: { label: "Edit audit", href: editHref }
				}
				actions={submissionId ? [{ label: "Edit audit", href: editHref }] : []}
			/>
		</div>
	);
}

function AuditTableCard({ title, description, audits }: { title: string; description: string; audits: AuditRecord[] }) {
	return (
		<Card className="rounded-md ">
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent>
				<DataTable
					columns={latestAuditColumns}
					data={audits}
					getRowId={row => row.id}
					emptyState={<p className="text-sm text-muted-foreground">No audit rows are available yet.</p>}
					mobileCard={audit => <AuditSummaryMobileCard audit={audit} />}
				/>
			</CardContent>
		</Card>
	);
}

function useTableData<T>(loader: (session: NonNullable<ReturnType<typeof useAuth>["session"]>) => Promise<T[]>) {
	return useDashboardData(loader);
}

function auditorChips(ids: string[]) {
	if (ids.length === 0) {
		return <span className="text-muted-foreground">No auditors assigned</span>;
	}
	return (
		<div className="flex flex-wrap gap-1.5">
			{ids.map(id => (
				<Badge key={id} variant="secondary" className="font-normal">
					{id}
				</Badge>
			))}
		</div>
	);
}

/** Column definitions shared by the manager and admin Projects tables. */
function buildProjectColumns(variant: "manager" | "admin"): ColumnDef<ProjectRecord>[] {
	const columns: ColumnDef<ProjectRecord>[] = [];
	if (variant === "admin") {
		columns.push({
			id: "organization",
			accessorFn: row => row.organization ?? "—",
			header: "Organization",
			cell: ({ getValue }) => <span className="text-muted-foreground">{String(getValue())}</span>
		});
	}
	columns.push(
		{
			accessorKey: "name",
			header: "Project name",
			cell: ({ row }) =>
				variant === "manager" ? (
					<Link
						href={`/manager/projects/${row.original.id}`}
						className="font-medium text-foreground hover:underline">
						{row.original.name}
					</Link>
				) : (
					// TODO(admin-detail-routes): link to /admin/projects/[id] once that route exists.
					<span className="font-medium text-foreground">{row.original.name}</span>
				)
		},
		{
			accessorKey: "summary",
			header: "Summary",
			enableSorting: false,
			cell: ({ getValue }) => <span className="text-muted-foreground">{String(getValue())}</span>
		},
		{
			accessorKey: "places",
			header: "Places",
			cell: ({ getValue }) => <span className="text-muted-foreground tabular-nums">{String(getValue())}</span>
		},
		{
			accessorKey: "audits",
			header: "Audits",
			cell: ({ getValue }) => <span className="text-muted-foreground tabular-nums">{String(getValue())}</span>
		},
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ getValue }) => <StatusBadge label={String(getValue())} tone="secondary" />
		}
	);
	if (variant === "manager") {
		columns.push({
			id: "actions",
			header: () => <span className="sr-only">Actions</span>,
			enableSorting: false,
			cell: ({ row }) => (
				<DataTableRowActions primary={{ label: "Open", href: `/manager/projects/${row.original.id}` }} />
			)
		});
	}
	return columns;
}

function ProjectMobileCard({ project, variant }: { project: ProjectRecord; variant: "manager" | "admin" }) {
	return (
		<div className="space-y-2 rounded-md border border-border bg-card p-4">
			<div className="flex items-start justify-between gap-3">
				<p className="font-medium text-foreground">{project.name}</p>
				<StatusBadge label={project.status} tone="secondary" />
			</div>
			{project.organization ? <p className="text-sm text-muted-foreground">{project.organization}</p> : null}
			{project.summary ? <p className="text-sm text-muted-foreground">{project.summary}</p> : null}
			<div className="flex gap-4 text-sm text-muted-foreground">
				<span>{project.places} places</span>
				<span>{project.audits} audits</span>
			</div>
			{variant === "manager" ? (
				<Button asChild variant="quiet" size="sm" className="px-0">
					<Link href={`/manager/projects/${project.id}`}>
						Open <ArrowUpRight className="size-4" />
					</Link>
				</Button>
			) : null}
		</div>
	);
}

/** Column definitions shared by the manager and admin Places tables. */
function buildPlaceColumns(variant: "manager" | "admin"): ColumnDef<PlaceRecord>[] {
	const columns: ColumnDef<PlaceRecord>[] = [];
	if (variant === "admin") {
		columns.push(
			{
				id: "organization",
				accessorFn: row => row.organization ?? "—",
				header: "Organization",
				cell: ({ getValue }) => <span className="text-muted-foreground">{String(getValue())}</span>
			},
			{
				accessorKey: "project",
				header: "Project",
				cell: ({ getValue }) => <span className="text-muted-foreground">{String(getValue())}</span>
			}
		);
	}
	columns.push({
		accessorKey: "name",
		header: "Place name",
		// TODO(admin-detail-routes): link to /admin/places/[id] once that route exists.
		cell: ({ row }) => <span className="font-medium text-foreground">{row.original.name}</span>
	});
	columns.push({
		accessorKey: "address",
		header: "Address",
		enableSorting: false,
		cell: ({ getValue }) => <span className="text-muted-foreground">{String(getValue())}</span>
	});
	columns.push({
		id: "postal_code",
		accessorFn: row => row.postal_code ?? "—",
		header: "Postal code",
		cell: ({ getValue }) => <span className="text-muted-foreground">{String(getValue())}</span>
	});
	if (variant === "manager") {
		columns.push(
			{
				accessorKey: "project",
				header: "Project",
				cell: ({ getValue }) => <span className="text-muted-foreground">{String(getValue())}</span>
			},
			{
				id: "assigned_auditors",
				accessorFn: row => row.assigned_auditors,
				header: "Assigned auditors",
				enableSorting: false,
				cell: ({ row }) => auditorChips(row.original.assigned_auditors)
			}
		);
	}
	columns.push({
		accessorKey: "audits",
		header: variant === "manager" ? "Total audits" : "Audits",
		cell: ({ getValue }) => <span className="text-muted-foreground tabular-nums">{String(getValue())}</span>
	});
	if (variant === "admin") {
		columns.push({
			accessorKey: "last_audit",
			header: "Last audit",
			cell: ({ getValue }) => <span className="text-muted-foreground">{String(getValue())}</span>
		});
	}
	columns.push({
		id: "status",
		accessorFn: row => getPlaceStatus({ auditCount: row.audits, rawStatus: row.status }).label,
		header: variant === "manager" ? "Audit state" : "Status",
		cell: ({ row }) => (
			<StatusBadgeFor
				status={getPlaceStatus({ auditCount: row.original.audits, rawStatus: row.original.status })}
			/>
		)
	});
	if (variant === "manager") {
		columns.push({
			id: "actions",
			header: () => <span className="sr-only">Actions</span>,
			enableSorting: false,
			cell: ({ row }) => (
				<DataTableRowActions
					primary={{ label: "Open", href: `/manager/places/${row.original.id}` }}
					actions={[
						{ label: "Edit place", href: `/manager/places/${row.original.id}/edit` },
						{
							label: "Assign auditors",
							href: `/manager/auditors?projectId=${row.original.project_id}&placeId=${row.original.id}`
						},
						{
							label: "View audits",
							href: `/manager/audits?projectId=${row.original.project_id}&placeId=${row.original.id}`
						}
					]}
				/>
			)
		});
	}
	return columns;
}

function PlaceMobileCard({ place, variant }: { place: PlaceRecord; variant: "manager" | "admin" }) {
	const status = getPlaceStatus({ auditCount: place.audits, rawStatus: place.status });
	return (
		<div className="space-y-2 rounded-md border border-border bg-card p-4">
			<div className="flex items-start justify-between gap-3">
				<div>
					<p className="font-medium text-foreground">{place.name}</p>
					<p className="text-sm text-muted-foreground">{place.project}</p>
				</div>
				<StatusBadgeFor status={status} />
			</div>
			<p className="text-sm text-muted-foreground">{place.address}</p>
			<p className="text-sm text-muted-foreground">{place.audits} audits</p>
			{variant === "manager" ? (
				<Button asChild variant="quiet" size="sm" className="px-0">
					<Link href={`/manager/places/${place.id}`}>
						Open <ArrowUpRight className="size-4" />
					</Link>
				</Button>
			) : null}
		</div>
	);
}

export function LiveProjectsTable() {
	const { data, loading, error } = useTableData(fetchProjects);
	const columns = React.useMemo(() => buildProjectColumns("manager"), []);
	const [selectedStatuses, setSelectedStatuses] = React.useState<string[]>([]);
	if (loading) return <LoadingCard label="projects" />;
	if (error) return <ErrorCard message={error} />;
	if (!data?.length)
		return <EmptyState title="No projects yet" description="Create your first project and it will appear here." />;

	const statusOptions = uniqueFilterOptions(data.map(project => project.status));
	const filteredProjects = data.filter(project => includesSelected(selectedStatuses, project.status));
	const filtersActive = selectedStatuses.length > 0;
	const toolbar =
		statusOptions.length > 1 ? (
			<div className="flex flex-wrap items-center gap-3">
				<SearchableMultiSelectFilter
					label="Status"
					options={statusOptions}
					selectedValues={selectedStatuses}
					onChange={setSelectedStatuses}
				/>
				<ClearFiltersButton disabled={!filtersActive} onClick={() => setSelectedStatuses([])} />
			</div>
		) : undefined;

	return (
		<div className="space-y-6">
			<DashboardHero
				size="compact"
				title="Projects"
				subtitle="Every project you own, with its place count, audit activity, and status."
				actions={
					<Button asChild className="bg-white text-foreground hover:bg-emerald-50">
						<Link href="/manager/projects/new">Create Project</Link>
					</Button>
				}
			/>
			<Card className="rounded-md">
				<CardContent>
					<DataTable
						columns={columns}
						data={filteredProjects}
						getRowId={row => row.id}
						toolbar={toolbar}
						noResults="No projects match the selected filters."
						mobileCard={project => <ProjectMobileCard project={project} variant="manager" />}
					/>
				</CardContent>
			</Card>
		</div>
	);
}

export function LivePlacesTable() {
	const { data, loading, error } = useTableData(fetchPlaces);
	const [selectedProjects, setSelectedProjects] = React.useState<string[]>([]);
	const [groupByProject, setGroupByProject] = React.useState(false);
	const columns = React.useMemo(() => buildPlaceColumns("manager"), []);

	if (loading) return <LoadingCard label="places" />;
	if (error) return <ErrorCard message={error} />;
	if (!data?.length)
		return (
			<EmptyState
				title="No places yet"
				description="Add a place under one of your projects and it will show up here."
			/>
		);

	const projectOptions = uniqueFilterOptions(data.map(place => place.project));
	const filteredPlaces = data.filter(place => includesSelected(selectedProjects, place.project));
	const filtersActive = selectedProjects.length > 0;

	const toolbar = (
		<div className="flex flex-wrap items-center gap-3">
			<SearchableMultiSelectFilter
				label="Project"
				options={projectOptions}
				selectedValues={selectedProjects}
				onChange={setSelectedProjects}
			/>
			<ClearFiltersButton disabled={!filtersActive} onClick={() => setSelectedProjects([])} />
			<Button
				type="button"
				variant={groupByProject ? "secondary" : "outline"}
				size="sm"
				className="ml-auto"
				onClick={() => setGroupByProject(value => !value)}>
				<Layers className="size-4" />
				{groupByProject ? "Ungroup" : "Group by project"}
			</Button>
		</div>
	);

	return (
		<div className="space-y-6">
			<DashboardHero
				size="compact"
				title="Places"
				subtitle="Every field location you manage — address, assigned auditors, and what to do next."
				actions={
					<Button asChild className="bg-white text-foreground hover:bg-emerald-50">
						<Link href="/manager/places/new">Add Place</Link>
					</Button>
				}
			/>
			<Card className="rounded-md">
				<CardContent>
					<DataTable
						columns={columns}
						data={filteredPlaces}
						getRowId={row => row.id}
						groupBy={groupByProject ? "project" : undefined}
						groupLabel="Project"
						toolbar={toolbar}
						noResults="No places match the selected filters."
						mobileCard={place => <PlaceMobileCard place={place} variant="manager" />}
					/>
				</CardContent>
			</Card>
		</div>
	);
}

export function AdminProjectsTable() {
	const { data, loading, error } = useTableData(fetchProjects);
	const [selectedOrganizations, setSelectedOrganizations] = React.useState<string[]>([]);
	const [selectedProjects, setSelectedProjects] = React.useState<string[]>([]);
	const columns = React.useMemo(() => buildProjectColumns("admin"), []);

	if (loading) return <LoadingCard label="projects" />;
	if (error) return <ErrorCard message={error} />;
	if (!data?.length)
		return <EmptyState title="No projects yet" description="Projects created by managers will appear here." />;

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

	const toolbar = (
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
	);

	return (
		<div className="space-y-6">
			<DashboardHero
				size="compact"
				title="Projects"
				subtitle="Projects across every organization. Filter by organization and project to narrow the list."
			/>
			<Card className="rounded-md">
				<CardContent>
					<DataTable
						columns={columns}
						data={filteredProjects}
						getRowId={row => row.id}
						toolbar={toolbar}
						noResults="No projects match the selected filters."
						mobileCard={project => <ProjectMobileCard project={project} variant="admin" />}
					/>
				</CardContent>
			</Card>
		</div>
	);
}

export function AdminPlacesTable() {
	const { data, loading, error } = useTableData(fetchPlaces);
	const [selectedOrganizations, setSelectedOrganizations] = React.useState<string[]>([]);
	const [selectedProjects, setSelectedProjects] = React.useState<string[]>([]);
	const columns = React.useMemo(() => buildPlaceColumns("admin"), []);

	if (loading) return <LoadingCard label="places" />;
	if (error) return <ErrorCard message={error} />;
	if (!data?.length)
		return <EmptyState title="No places yet" description="Places created by managers will appear here." />;

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

	const toolbar = (
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
	);

	return (
		<div className="space-y-6">
			<DashboardHero
				size="compact"
				title="Places"
				subtitle="Places across every organization. Filter by organization and project to narrow the list."
			/>
			<Card className="rounded-md">
				<CardContent>
					<DataTable
						columns={columns}
						data={filteredPlaces}
						getRowId={row => row.id}
						toolbar={toolbar}
						noResults="No places match the selected filters."
						mobileCard={place => <PlaceMobileCard place={place} variant="admin" />}
					/>
				</CardContent>
			</Card>
		</div>
	);
}

/** Column definitions for the auditor roster (display-only, no row actions). */
function buildAuditorColumns(isAdmin: boolean): ColumnDef<AuditorRecord>[] {
	return [
		{
			accessorKey: "name",
			header: "Name",
			cell: ({ getValue }) => <span className="font-medium text-foreground">{String(getValue())}</span>
		},
		{
			accessorKey: "auditor_id",
			header: "Auditor ID",
			cell: ({ getValue }) => <span className="text-muted-foreground">{String(getValue())}</span>
		},
		{
			accessorKey: "email",
			header: isAdmin ? "Contact info" : "Email / contact info",
			enableSorting: false,
			cell: ({ row }) => (
				<span className="text-muted-foreground">
					{row.original.email || (isAdmin ? "Hidden from admin" : "—")}
				</span>
			)
		},
		{
			id: "assigned_places",
			accessorFn: row => row.assigned_places.length,
			header: "Assigned places",
			enableSorting: false,
			cell: ({ row }) => (
				<span className="text-muted-foreground">
					{row.original.assigned_places.length > 0
						? row.original.assigned_places.join(", ")
						: "No places assigned"}
				</span>
			)
		},
		{
			accessorKey: "completed_audits",
			header: "Completed audits",
			cell: ({ getValue }) => <span className="text-muted-foreground tabular-nums">{String(getValue())}</span>
		},
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ getValue }) => <StatusBadge label={String(getValue())} tone="success" />
		}
	];
}

function AuditorMobileCard({ auditor, isAdmin }: { auditor: AuditorRecord; isAdmin: boolean }) {
	return (
		<div className="space-y-2 rounded-md border border-border bg-card p-4">
			<div className="flex items-start justify-between gap-3">
				<div>
					<p className="font-medium text-foreground">{auditor.name}</p>
					<p className="text-sm text-muted-foreground">{auditor.auditor_id}</p>
				</div>
				<StatusBadge label={auditor.status} tone="success" />
			</div>
			<p className="text-sm text-muted-foreground">{auditor.email || (isAdmin ? "Hidden from admin" : "—")}</p>
			<p className="text-sm text-muted-foreground">
				{auditor.assigned_places.length > 0 ? auditor.assigned_places.join(", ") : "No places assigned"}
			</p>
			<p className="text-sm text-muted-foreground">{auditor.completed_audits} completed audits</p>
		</div>
	);
}

export function LiveAuditorsTable() {
	const { session } = useAuth();
	const { data, loading, error } = useTableData(fetchAuditors);
	const isAdmin = session?.user.account_type === "ADMIN";
	const columns = React.useMemo(() => buildAuditorColumns(Boolean(isAdmin)), [isAdmin]);
	if (loading) return <LoadingCard label="auditors" />;
	if (error) return <ErrorCard message={error} />;
	if (!data?.length) {
		return (
			<DashboardHero
				size="compact"
				title="Auditors"
				subtitle="No auditors are visible in this scope yet. You can still invite an auditor now."
				actions={
					<Button asChild className="bg-white text-foreground hover:bg-emerald-50">
						<Link href="/manager/auditors/invite">
							<MailPlus className="size-4" />
							Invite New Auditor
						</Link>
					</Button>
				}
			/>
		);
	}

	return (
		<div className="space-y-6">
			<DashboardHero
				size="compact"
				title="Auditors"
				subtitle={
					isAdmin
						? "Platform-wide auditor records, shown using auditor IDs only to protect personal details."
						: "Auditors currently in this manager's scope, with contact info and place assignments."
				}
				actions={
					<>
						<Button asChild className="bg-white text-foreground hover:bg-emerald-50">
							<Link href="/manager/auditors/invite">
								<MailPlus className="size-4" />
								Invite New Auditor
							</Link>
						</Button>
						{!isAdmin && session?.user.is_primary_manager ? (
							<Button
								asChild
								variant="outline"
								className="border-white/15 bg-white/6 text-white hover:bg-white/10 hover:text-white">
								<Link href="/manager/managers/invite">
									<ShieldPlus className="size-4" />
									Invite New Manager
								</Link>
							</Button>
						) : null}
					</>
				}
			/>
			<Card className="rounded-md">
				<CardContent>
					<DataTable
						columns={columns}
						data={data}
						getRowId={row => row.id}
						mobileCard={auditor => <AuditorMobileCard auditor={auditor} isAdmin={Boolean(isAdmin)} />}
					/>
				</CardContent>
			</Card>
		</div>
	);
}

export function LiveAuditsTable() {
	const { session } = useAuth();
	// Deep links from place/project detail pages pass ?projectId=&placeId= so
	// the table opens pre-filtered to that context.
	const searchParams = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();
	const paramProjectId = searchParams.get("projectId");
	const paramPlaceId = searchParams.get("placeId");
	const [audits, setAudits] = React.useState<AuditRecord[]>([]);
	const [rawData, setRawData] = React.useState<RawDataRecord[]>([]);
	const [comparisons, setComparisons] = React.useState<PlaceComparisonGroupRecord[]>([]);
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState<string | null>(null);
	const [selectedProjectIds, setSelectedProjectIds] = React.useState<string[]>(
		paramProjectId ? [paramProjectId] : []
	);
	const [selectedPlaceIds, setSelectedPlaceIds] = React.useState<string[]>(paramPlaceId ? [paramPlaceId] : []);
	const [selectedAuditIds, setSelectedAuditIds] = React.useState<string[]>([]);
	const [syncedParams, setSyncedParams] = React.useState<string>(`${paramProjectId ?? ""}|${paramPlaceId ?? ""}`);
	const [compareError, setCompareError] = React.useState<string | null>(null);

	// Keep the filters in sync with the URL so a soft navigation that changes the
	// deep-link params (e.g. the sidebar link back to the bare /manager/audits
	// route) resets the filters instead of leaving the table filtered while the
	// URL claims otherwise. Adjusting state during render is React's recommended
	// alternative to a sync effect.
	const currentParams = `${paramProjectId ?? ""}|${paramPlaceId ?? ""}`;
	if (currentParams !== syncedParams) {
		setSyncedParams(currentParams);
		setSelectedProjectIds(paramProjectId ? [paramProjectId] : []);
		setSelectedPlaceIds(paramPlaceId ? [paramPlaceId] : []);
		setSelectedAuditIds([]);
	}

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

	const auditColumns = React.useMemo<ColumnDef<AuditRecord>[]>(
		() => [
			{
				id: "select",
				enableSorting: false,
				header: () => {
					const submissionIds = filteredAudits
						.map(audit => audit.submission_id)
						.filter((id): id is string => Boolean(id));
					const everySelected =
						submissionIds.length > 0 && submissionIds.every(id => selectedAuditIds.includes(id));
					return (
						<input
							type="checkbox"
							aria-label="Select all audits"
							checked={everySelected}
							onChange={() =>
								setSelectedAuditIds(current => {
									const ids = filteredAudits
										.map(audit => audit.submission_id)
										.filter((id): id is string => Boolean(id));
									const all = ids.length > 0 && ids.every(id => current.includes(id));
									return all
										? current.filter(id => !ids.includes(id))
										: Array.from(new Set([...current, ...ids]));
								})
							}
						/>
					);
				},
				cell: ({ row }) => {
					const submissionId = row.original.submission_id;
					return (
						<input
							type="checkbox"
							aria-label={`Select audit for ${row.original.place}`}
							checked={submissionId ? selectedAuditIds.includes(submissionId) : false}
							disabled={!submissionId}
							onChange={() =>
								submissionId
									? setSelectedAuditIds(current =>
											current.includes(submissionId)
												? current.filter(id => id !== submissionId)
												: [...current, submissionId]
										)
									: undefined
							}
						/>
					);
				}
			},
			{
				accessorKey: "place",
				header: "Place",
				cell: ({ getValue }) => <span className="font-medium text-foreground">{String(getValue())}</span>
			},
			{
				accessorKey: "auditor",
				header: "Auditor ID",
				cell: ({ getValue }) => <span className="text-muted-foreground">{String(getValue())}</span>
			},
			{
				accessorKey: "status",
				header: "Status",
				cell: ({ getValue }) => <StatusBadge label={String(getValue())} tone="secondary" />
			},
			{
				id: "score",
				header: "Score",
				enableSorting: false,
				cell: ({ row }) => <AuditScoreCell audit={row.original} />
			},
			{
				id: "submitted_at",
				accessorFn: row => row.submitted_at ?? "",
				header: "Submitted",
				cell: ({ row }) => (
					<span className="text-muted-foreground">
						{row.original.submitted_at ? new Date(row.original.submitted_at).toLocaleDateString() : "—"}
					</span>
				)
			},
			{
				id: "actions",
				header: () => <span className="sr-only">Actions</span>,
				enableSorting: false,
				cell: ({ row }) => {
					const audit = row.original;
					const editHref = audit.submission_id
						? `/manager/audits/${audit.id}/edit/page/1?submissionId=${encodeURIComponent(audit.submission_id)}`
						: `/manager/audits/${audit.id}/edit/page/1`;
					const submissionId = audit.submission_id;
					if (!submissionId) {
						return <DataTableRowActions primary={{ label: "Edit audit", href: editHref }} />;
					}
					return (
						<DataTableRowActions
							primary={{ label: "View report", href: `/yee/submissions/${submissionId}` }}
							actions={[
								{ label: "Edit audit", href: editHref },
								{
									label: "Export raw data",
									onClick: () =>
										downloadCsv(
											`audit-${submissionId}.csv`,
											rawDataToRows(rawData.filter(rawRow => rawRow.audit_id === submissionId))
										)
								}
							]}
						/>
					);
				}
			}
		],
		[filteredAudits, selectedAuditIds, rawData]
	);

	if (loading) return <LoadingCard label="audits" />;
	if (error) return <ErrorCard message={error} />;
	const filtersActive = selectedProjectIds.length > 0 || selectedPlaceIds.length > 0;

	return (
		<div className="space-y-6">
			<DashboardHero
				size="compact"
				title="Audits"
				subtitle="Filter by project or place, compare selected audits, and export all, filtered, or selected raw data."
			/>
			<Card className="rounded-md">
				<CardContent className="space-y-4 overflow-x-auto">
					{compareError ? <p className="text-sm text-rose-600">{compareError}</p> : null}
					<DataTable
						columns={auditColumns}
						data={filteredAudits}
						getRowId={row => row.id}
						noResults="No audits match the selected filters."
						mobileCard={audit => (
							<AuditRowMobileCard
								audit={audit}
								isSelected={
									audit.submission_id ? selectedAuditIds.includes(audit.submission_id) : false
								}
								onToggle={toggleAuditSelection}
							/>
						)}
						toolbar={
							<div className="flex flex-col flex-wrap items-start gap-3">
								<div className="flex flex-wrap justify-start items-start w-full gap-3">
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
											setSelectedPlaceIds(current =>
												current.filter(placeId => allowedPlaceIds.has(placeId))
											);
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
											// Drop the deep-link params too, so a refresh or a
											// shared URL does not re-apply the cleared filters.
											if (paramProjectId || paramPlaceId) {
												router.replace(pathname);
											}
										}}
									/>
								</div>
								<div className="flex flex-wrap items-center justify-start max-w-full min-w-content gap-3">
									<Button
										type="button"
										variant="outline"
										onClick={() => exportRows(rawData, "all-audits.csv")}>
										Export All
									</Button>
									<Button
										type="button"
										variant="outline"
										onClick={() => exportRows(filteredRawData, "filtered-audits.csv")}>
										Export Filtered
									</Button>
									<Button
										type="button"
										variant="outline"
										onClick={() => exportRows(selectedRawData, "selected-audits.csv")}
										disabled={selectedAuditIds.length === 0}>
										Export Selected
									</Button>
									<Button
										type="button"
										className="bg-primary text-white hover:bg-primary/90"
										onClick={handleCompare}
										disabled={selectedAuditIds.length < 2}>
										Compare Selected
									</Button>
								</div>
							</div>
						}
					/>
				</CardContent>
			</Card>

			{selectedComparisonGroup && !compareError ? <PlaceComparisonPanel group={selectedComparisonGroup} /> : null}
		</div>
	);
}

type OrgSummaryRecord = {
	organization: string;
	users: number;
	projects: number;
	places: number;
	audits: number;
};

/** Columns for the platform-wide organization summary (display-only). */
const orgSummaryColumns: ColumnDef<OrgSummaryRecord>[] = [
	{
		accessorKey: "organization",
		header: "Organization",
		cell: ({ getValue }) => <span className="font-medium text-foreground">{String(getValue())}</span>
	},
	{
		accessorKey: "users",
		header: "Users",
		cell: ({ getValue }) => <span className="text-muted-foreground tabular-nums">{String(getValue())}</span>
	},
	{
		accessorKey: "projects",
		header: "Projects",
		cell: ({ getValue }) => <span className="text-muted-foreground tabular-nums">{String(getValue())}</span>
	},
	{
		accessorKey: "places",
		header: "Places",
		cell: ({ getValue }) => <span className="text-muted-foreground tabular-nums">{String(getValue())}</span>
	},
	{
		accessorKey: "audits",
		header: "Audits",
		cell: ({ getValue }) => <span className="text-muted-foreground tabular-nums">{String(getValue())}</span>
	}
];

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
			<DashboardHero
				badge="Admin console"
				title="Platform overview across every organization."
				subtitle="Monitor users, projects, places, and audit activity for all organizations from one console."
				// action buttons to open reports and instruments
				actions={
					<>
						<Button asChild className="bg-white text-foreground hover:bg-emerald-50">
							<Link href="/reporting/live-reports">Open Reports</Link>
						</Button>
						<Button
							asChild
							className="border-white/15 bg-white/6 text-white hover:bg-white/10 hover:text-white">
							<Link href="/instruments/live-instruments">Open Instruments</Link>
						</Button>
					</>
				}
				stats={overview.data.metrics.map(metric => ({
					label: metric.title,
					value: metric.value,
					helper: metric.description
				}))}
			/>
			{overview.data.organization_summaries.length > 0 ? (
				<Card className="rounded-md space-y-0">
					<CardHeader>
						<CardTitle>Organization Summary</CardTitle>
						<CardDescription>Platform-wide summary grouped by organization.</CardDescription>
					</CardHeader>
					<CardContent>
						<DataTable
							columns={orgSummaryColumns}
							data={overview.data.organization_summaries}
							getRowId={row => row.organization}
							mobileCard={row => (
								<div className="space-y-2 rounded-md border border-border bg-card p-4">
									<p className="font-medium text-foreground">{row.organization}</p>
									<p className="text-sm tabular-nums text-muted-foreground">
										{row.users} users · {row.projects} projects · {row.places} places · {row.audits}{" "}
										audits
									</p>
								</div>
							)}
						/>
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

	const applyUsers = React.useCallback((result: UserRecord[]) => {
		setError(null);
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
	}, []);

	const loadUsers = React.useCallback(async () => {
		if (!session) return;
		try {
			applyUsers(await fetchUsers(session));
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not load users.");
		} finally {
			setLoading(false);
		}
	}, [applyUsers, session]);

	React.useEffect(() => {
		// Inline promise chain (not `void loadUsers()`) so every setState happens
		// in an async callback, and the fetch is cancelled on unmount.
		if (!session) return;
		let cancelled = false;
		fetchUsers(session)
			.then(result => {
				if (!cancelled) applyUsers(result);
			})
			.catch((err: unknown) => {
				if (!cancelled) setError(err instanceof Error ? err.message : "Could not load users.");
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [applyUsers, session]);

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

	// Status badge + inline approval control, shared by the table cell and the
	// stacked mobile card. Closes over the component's approval state, so the
	// columns are rebuilt each render (fine for this admin-only table).
	function renderUserAction(user: UserRecord) {
		return (
			<div className="flex flex-col gap-2">
				<Badge variant="secondary" className="w-fit rounded-full bg-muted text-foreground hover:bg-muted">
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
								className="h-9 rounded-md border border-border bg-white px-3 text-sm text-foreground">
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
							className="rounded-md bg-primary text-white hover:bg-primary/90"
							onClick={() => void handleApprove(user)}
							disabled={
								submittingUserId === user.id ||
								(user.role === "AUDITOR" && !selectedAccounts[user.id] && !user.account_id)
							}>
							{submittingUserId === user.id ? "Approving..." : "Approve"}
						</Button>
					</div>
				) : (
					<span className="text-sm text-muted-foreground">No action needed</span>
				)}
			</div>
		);
	}

	const userColumns: ColumnDef<UserRecord>[] = [
		{
			accessorKey: "organization",
			header: "Organization",
			cell: ({ getValue }) => <span className="text-muted-foreground">{String(getValue())}</span>
		},
		{
			accessorKey: "name",
			header: "User name",
			cell: ({ getValue }) => <span className="font-medium text-foreground">{String(getValue())}</span>
		},
		{
			accessorKey: "role",
			header: "Role",
			cell: ({ getValue }) => <span className="text-muted-foreground">{String(getValue())}</span>
		},
		{
			accessorKey: "project_assignments",
			header: "Project assignment",
			enableSorting: false,
			cell: ({ getValue }) => <span className="text-muted-foreground">{String(getValue())}</span>
		},
		{
			id: "contact",
			accessorFn: row => (row.role === "MANAGER" ? row.contact_info || row.email : ""),
			header: "Contact info",
			enableSorting: false,
			cell: ({ getValue }) => <span className="text-muted-foreground">{String(getValue())}</span>
		},
		{
			id: "action",
			header: "Action / status",
			enableSorting: false,
			cell: ({ row }) => renderUserAction(row.original)
		}
	];

	const userMobileCard = (user: UserRecord) => (
		<div className="space-y-2 rounded-md border border-border bg-card p-4">
			<div className="flex items-start justify-between gap-3">
				<div>
					<p className="font-medium text-foreground">{user.name}</p>
					<p className="text-sm text-muted-foreground">
						{user.role} · {user.organization}
					</p>
				</div>
			</div>
			{user.project_assignments ? (
				<p className="text-sm text-muted-foreground">{user.project_assignments}</p>
			) : null}
			{renderUserAction(user)}
		</div>
	);

	return (
		<div className="space-y-6">
			{embedded ? null : (
				<DashboardHero
					size="compact"
					title="Users"
					subtitle="All managers, auditors, and admins across the system, including approval actions for pending accounts."
				/>
			)}
			<Card className="rounded-md">
				{embedded ? (
					<CardHeader>
						<CardTitle>Users</CardTitle>
						<CardDescription>
							All managers, auditors, and admins across the system, including approval actions for pending
							accounts.
						</CardDescription>
					</CardHeader>
				) : null}
				{actionError ? <CardContent className="pt-0 text-sm text-rose-700">{actionError}</CardContent> : null}
				<CardContent className="space-y-4 overflow-x-auto">
					<DataTable
						columns={userColumns}
						data={filteredRows}
						getRowId={row => row.id}
						noResults="No users match the selected filters."
						mobileCard={userMobileCard}
						toolbar={
							<div className="flex flex-wrap items-center gap-3">
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
						}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
