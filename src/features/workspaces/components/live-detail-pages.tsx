"use client";

import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { ArrowRight, ClipboardList, FileBarChart2, MapPin, Users2 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { AssignmentPanel } from "@/features/manager/components/assignment-panel";
import { useAuth } from "@/features/auth/components/auth-provider";
import { PlaceComparisonPanel } from "@/features/reporting/components/place-comparison-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { DashboardHero } from "@/components/ui/dashboard-hero";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import type { StatusTone } from "@/lib/status";
import { TableSkeleton } from "@/components/ui/skeletons";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
	deleteAssignment,
	fetchPlaceDetail,
	fetchProjectDetail,
	type AuditRecord,
	type PlaceAuditorRecord,
	type PlaceComparisonAuditRecord,
	type PlaceDetailRecord,
	type ProjectAuditorRecord,
	type ProjectDetailRecord,
	type ProjectPlaceRecord
} from "@/features/workspaces/api/live-api";
/**
 * Muted, field-specific placeholder for an empty setup-detail value — instead of
 * a wall of identical "Not specified yet." lines that read like real data.
 */
function emptyHint(text: string) {
	return <span className="text-muted-foreground/70 italic">{text}</span>;
}

function buildStaticMapUrl(apiKey: string | undefined, query: string) {
	if (!apiKey || !query) return null;
	return `https://maps.googleapis.com/maps/api/staticmap?key=${encodeURIComponent(apiKey)}&size=1200x520&scale=2&zoom=15&maptype=roadmap&center=${encodeURIComponent(query)}&markers=color:0x10231f|${encodeURIComponent(query)}`;
}

function LoadingState({ label }: { label: string }) {
	return <TableSkeleton aria-label={`Loading ${label}…`} />;
}

function ErrorState({ message }: { message: string }) {
	return (
		<Card className="rounded-md border-rose-200 bg-rose-50 shadow-sm">
			<CardContent className="p-6 text-sm text-rose-700">{message}</CardContent>
		</Card>
	);
}

/** Map a free-text status string to a shared StatusBadge tone. */
function statusTone(status: string): StatusTone {
	const value = status.toLowerCase();
	if (/(active|submitted|complete|up to date|assigned|ready|locked)/.test(value)) return "success";
	if (/(draft|progress|pending|await|invite)/.test(value)) return "warning";
	return "secondary";
}

function DetailMetric({ label, value, description }: { label: string; value: string; description: string }) {
	return (
		<Card className="rounded-md border-border/80 bg-white shadow-sm">
			<CardHeader className="pb-3">
				<CardDescription>{label}</CardDescription>
				<CardTitle className="text-3xl font-semibold tracking-tight text-foreground">{value}</CardTitle>
			</CardHeader>
			<CardContent className="text-sm leading-6 text-muted-foreground">{description}</CardContent>
		</Card>
	);
}

function DetailActionCard({
	label,
	description,
	href,
	actionLabel
}: {
	label: string;
	description: string;
	href: string;
	actionLabel: string;
}) {
	return (
		<Card className="rounded-md border-border/80 bg-white shadow-sm">
			<CardHeader className="pb-3">
				<CardDescription>{label}</CardDescription>
				<CardTitle className="text-2xl font-semibold tracking-tight text-foreground">{actionLabel}</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col items-center justify-between gap-4 text-sm leading-6 text-muted-foreground">
				<p>{description}</p>
				<Button asChild className="w-full bg-primary text-white hover:bg-primary/90">
					<Link href={href}>
						{actionLabel}
						<ArrowRight className="size-4" />
					</Link>
				</Button>
			</CardContent>
		</Card>
	);
}

function useProtectedLoader<T>(
	loader: (accessToken: NonNullable<ReturnType<typeof useAuth>["session"]>) => Promise<T>
) {
	const { session } = useAuth();
	const [data, setData] = React.useState<T | null>(null);
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState<string | null>(null);
	const [reloadKey, setReloadKey] = React.useState(0);

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
					setError(err instanceof Error ? err.message : "Could not load detail data.");
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
	}, [loader, reloadKey, session]);

	return {
		data,
		loading,
		error,
		reload: () => setReloadKey(current => current + 1)
	};
}

const latestAuditColumns: ColumnDef<AuditRecord>[] = [
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
		accessorKey: "date",
		header: "Date",
		cell: ({ getValue }) => <span className="text-muted-foreground">{String(getValue())}</span>
	},
	{
		accessorKey: "score",
		header: "Score",
		cell: ({ getValue }) => <span className="text-muted-foreground tabular-nums">{String(getValue() || "—")}</span>
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ getValue }) => <StatusBadge label={String(getValue())} tone={statusTone(String(getValue()))} />
	}
];

function AuditMobileCard({ audit }: { audit: AuditRecord }) {
	return (
		<div className="space-y-2 rounded-md border border-border bg-card p-4">
			<div className="flex items-start justify-between gap-3">
				<p className="font-medium text-foreground">{audit.place}</p>
				<StatusBadge label={audit.status} tone={statusTone(audit.status)} />
			</div>
			<p className="text-sm text-muted-foreground">
				{audit.auditor} · {audit.date}
			</p>
			<p className="text-sm tabular-nums text-muted-foreground">Score: {audit.score || "—"}</p>
		</div>
	);
}

function LatestAuditTable({ audits }: { audits: AuditRecord[] }) {
	return (
		<Card className="rounded-md border-border/80 bg-white shadow-sm">
			<CardHeader>
				<CardTitle>Latest Audits</CardTitle>
				<CardDescription>Recent Audit activity already linked to this scope.</CardDescription>
			</CardHeader>
			<CardContent>
				<DataTable
					columns={latestAuditColumns}
					data={audits}
					getRowId={row => row.id}
					hideColumnMenu
					emptyState={
						<EmptyState title="No audits yet" description="No Audits have been recorded here yet." />
					}
					mobileCard={audit => <AuditMobileCard audit={audit} />}
				/>
			</CardContent>
		</Card>
	);
}

const projectPlaceColumns: ColumnDef<ProjectPlaceRecord>[] = [
	{
		accessorKey: "name",
		header: "Place",
		cell: ({ row }) => (
			<Link href={`/manager/places/${row.original.id}`} className="font-medium text-foreground hover:underline">
				{row.original.name}
			</Link>
		)
	},
	{
		accessorKey: "address",
		header: "Address",
		cell: ({ getValue }) => <span className="text-muted-foreground">{String(getValue())}</span>
	},
	{
		accessorKey: "audits",
		header: "Audits",
		cell: ({ getValue }) => <span className="text-muted-foreground tabular-nums">{String(getValue())}</span>
	},
	{
		accessorKey: "last_audit",
		header: "Submitted Audits",
		cell: ({ getValue }) => <span className="text-muted-foreground tabular-nums">{String(getValue())}</span>
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ getValue }) => <StatusBadge label={String(getValue())} tone={statusTone(String(getValue()))} />
	},
	{
		id: "action",
		header: "",
		enableSorting: false,
		cell: ({ row }) => (
			<Link
				href={`/manager/places/${row.original.id}`}
				className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
				Open <ArrowRight className="size-4" />
			</Link>
		)
	}
];

function PlaceRowMobileCard({ place }: { place: ProjectPlaceRecord }) {
	return (
		<Link
			href={`/manager/places/${place.id}`}
			className="block space-y-2 rounded-md border border-border bg-card p-4">
			<div className="flex items-start justify-between gap-3">
				<p className="font-medium text-foreground">{place.name}</p>
				<StatusBadge label={place.status} tone={statusTone(place.status)} />
			</div>
			<p className="text-sm text-muted-foreground">{place.address}</p>
			<p className="text-sm tabular-nums text-muted-foreground">
				{place.audits} audits · {place.last_audit} submitted
			</p>
		</Link>
	);
}

function ProjectPlacesTable({ rows }: { rows: ProjectPlaceRecord[] }) {
	return (
		<Card className="rounded-md border-border/80 bg-white shadow-sm">
			<CardHeader>
				<CardTitle>Places in this Project</CardTitle>
				<CardDescription>
					These Places are currently attached to the Project and available for YEE work.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<DataTable
					columns={projectPlaceColumns}
					data={rows}
					getRowId={row => row.id}
					hideColumnMenu
					emptyState={
						<EmptyState
							title="No places yet"
							description="No Places have been added to this Project yet."
						/>
					}
					mobileCard={place => <PlaceRowMobileCard place={place} />}
				/>
			</CardContent>
		</Card>
	);
}

function ProjectAuditorsTable({
	rows,
	onRemove,
	removingAuditorId
}: {
	rows: ProjectAuditorRecord[];
	onRemove?: (auditor: ProjectAuditorRecord) => void;
	removingAuditorId?: string | null;
}) {
	const columns = React.useMemo<ColumnDef<ProjectAuditorRecord>[]>(() => {
		const base: ColumnDef<ProjectAuditorRecord>[] = [
			{
				accessorKey: "name",
				header: "Auditor",
				cell: ({ getValue }) => <span className="font-medium text-foreground">{String(getValue())}</span>
			},
			{
				accessorKey: "auditor_id",
				header: "Generated ID",
				cell: ({ getValue }) => <span className="text-muted-foreground">{String(getValue())}</span>
			},
			{
				accessorKey: "assigned_places",
				header: "Assigned Places",
				cell: ({ getValue }) => <span className="text-muted-foreground tabular-nums">{String(getValue())}</span>
			},
			{
				accessorKey: "completed_audits",
				header: "Completed Audits",
				cell: ({ getValue }) => <span className="text-muted-foreground tabular-nums">{String(getValue())}</span>
			},
			{
				accessorKey: "status",
				header: "Status",
				cell: ({ getValue }) => <StatusBadge label={String(getValue())} tone={statusTone(String(getValue()))} />
			}
		];
		if (onRemove) {
			base.push({
				id: "action",
				header: "",
				enableSorting: false,
				cell: ({ row }) => (
					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled={removingAuditorId === row.original.id}
						onClick={() => onRemove(row.original)}>
						{removingAuditorId === row.original.id ? "Removing…" : "Remove from project"}
					</Button>
				)
			});
		}
		return base;
	}, [onRemove, removingAuditorId]);

	return (
		<Card className="rounded-md border-border/80 bg-white shadow-sm">
			<CardHeader>
				<CardTitle>Assigned Auditors</CardTitle>
				<CardDescription>Auditors linked to at least one Place inside this Project.</CardDescription>
			</CardHeader>
			<CardContent>
				<DataTable
					columns={columns}
					data={rows}
					getRowId={row => row.id}
					hideColumnMenu
					emptyState={
						<EmptyState
							title="No auditors yet"
							description="No Auditors have been assigned to Places in this Project yet."
						/>
					}
					mobileCard={auditor => (
						<div className="space-y-2 rounded-md border border-border bg-card p-4">
							<div className="flex items-start justify-between gap-3">
								<p className="font-medium text-foreground">{auditor.name}</p>
								<StatusBadge label={auditor.status} tone={statusTone(auditor.status)} />
							</div>
							<p className="text-sm text-muted-foreground">{auditor.auditor_id}</p>
							<p className="text-sm tabular-nums text-muted-foreground">
								{auditor.assigned_places} places · {auditor.completed_audits} completed
							</p>
							{onRemove ? (
								<Button
									type="button"
									variant="outline"
									size="sm"
									className="w-full"
									disabled={removingAuditorId === auditor.id}
									onClick={() => onRemove(auditor)}>
									{removingAuditorId === auditor.id ? "Removing…" : "Remove from project"}
								</Button>
							) : null}
						</div>
					)}
				/>
			</CardContent>
		</Card>
	);
}

function PlaceAuditorsTable({
	rows,
	onRemove,
	removingAuditorId
}: {
	rows: PlaceAuditorRecord[];
	onRemove?: (auditor: PlaceAuditorRecord) => void;
	removingAuditorId?: string | null;
}) {
	const columns = React.useMemo<ColumnDef<PlaceAuditorRecord>[]>(() => {
		const base: ColumnDef<PlaceAuditorRecord>[] = [
			{
				accessorKey: "name",
				header: "Auditor",
				cell: ({ getValue }) => <span className="font-medium text-foreground">{String(getValue())}</span>
			},
			{
				accessorKey: "auditor_id",
				header: "Generated ID",
				cell: ({ getValue }) => <span className="text-muted-foreground">{String(getValue())}</span>
			},
			{
				accessorKey: "status",
				header: "Status",
				cell: ({ getValue }) => <StatusBadge label={String(getValue())} tone={statusTone(String(getValue()))} />
			},
			{
				accessorKey: "audit_count",
				header: "Submitted audits",
				cell: ({ getValue }) => <span className="text-muted-foreground tabular-nums">{String(getValue())}</span>
			},
			{
				accessorKey: "last_audit",
				header: "Last audit",
				cell: ({ getValue }) => <span className="text-muted-foreground">{String(getValue())}</span>
			}
		];
		if (onRemove) {
			base.push({
				id: "action",
				header: "",
				enableSorting: false,
				cell: ({ row }) => (
					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled={removingAuditorId === row.original.id}
						onClick={() => onRemove(row.original)}>
						{removingAuditorId === row.original.id ? "Removing…" : "Unassign"}
					</Button>
				)
			});
		}
		return base;
	}, [onRemove, removingAuditorId]);

	return (
		<Card className="rounded-md border-border/80 bg-white shadow-sm">
			<CardHeader>
				<CardTitle>Assigned auditors</CardTitle>
				<CardDescription>Place assignments and submission status for each auditor.</CardDescription>
			</CardHeader>
			<CardContent>
				<DataTable
					columns={columns}
					data={rows}
					getRowId={row => row.id}
					hideColumnMenu
					emptyState={
						<EmptyState
							title="No auditors yet"
							description="No auditors have been assigned to this place yet."
						/>
					}
					mobileCard={auditor => (
						<div className="space-y-2 rounded-md border border-border bg-card p-4">
							<div className="flex items-start justify-between gap-3">
								<p className="font-medium text-foreground">{auditor.name}</p>
								<StatusBadge label={auditor.status} tone={statusTone(auditor.status)} />
							</div>
							<p className="text-sm text-muted-foreground">{auditor.auditor_id}</p>
							<p className="text-sm tabular-nums text-muted-foreground">
								{auditor.audit_count} submitted · last {auditor.last_audit}
							</p>
							{onRemove ? (
								<Button
									type="button"
									variant="outline"
									size="sm"
									className="w-full"
									disabled={removingAuditorId === auditor.id}
									onClick={() => onRemove(auditor)}>
									{removingAuditorId === auditor.id ? "Removing…" : "Unassign"}
								</Button>
							) : null}
						</div>
					)}
				/>
			</CardContent>
		</Card>
	);
}

const submittedReportColumns: ColumnDef<PlaceComparisonAuditRecord>[] = [
	{
		accessorKey: "auditor_id",
		header: "Auditor ID",
		cell: ({ getValue }) => <span className="font-medium text-foreground">{String(getValue())}</span>
	},
	{
		accessorKey: "date",
		header: "Submitted",
		cell: ({ getValue }) => <span className="text-muted-foreground">{String(getValue())}</span>
	},
	{
		id: "raw",
		header: "Total Raw Score",
		cell: ({ row }) => (
			<span className="text-muted-foreground tabular-nums">
				{row.original.total_raw_score} / {row.original.total_raw_maximum}
			</span>
		)
	},
	{
		id: "weighted",
		header: "Total Youth Weighted Average",
		cell: ({ row }) => (
			<span className="text-muted-foreground tabular-nums">
				{row.original.total_weighted_score.toFixed(2)} / {row.original.total_weighted_maximum.toFixed(2)}
			</span>
		)
	},
	{
		id: "report",
		header: "",
		enableSorting: false,
		cell: ({ row }) => (
			<Link
				href={`/yee/submissions/${row.original.audit_id}`}
				className="text-sm font-medium text-primary underline-offset-4 hover:underline">
				Open report
			</Link>
		)
	}
];

function SubmittedReportMobileCard({ record }: { record: PlaceComparisonAuditRecord }) {
	return (
		<Link
			href={`/yee/submissions/${record.audit_id}`}
			className="block space-y-1.5 rounded-md border border-border bg-card p-4">
			<div className="flex items-center justify-between gap-3">
				<p className="font-medium text-foreground">{record.auditor_id}</p>
				<span className="text-xs text-muted-foreground">{record.date}</span>
			</div>
			<p className="text-sm tabular-nums text-muted-foreground">
				Raw {record.total_raw_score} / {record.total_raw_maximum} · Youth{" "}
				{record.total_weighted_score.toFixed(2)} / {record.total_weighted_maximum.toFixed(2)}
			</p>
			<p className="text-sm font-medium text-primary">Open report →</p>
		</Link>
	);
}

export function LiveProjectDetail({ projectId }: { projectId: string }) {
	const { session } = useAuth();
	const loader = React.useCallback(
		(session: NonNullable<ReturnType<typeof useAuth>["session"]>) => fetchProjectDetail(session, projectId),
		[projectId]
	);
	const { data, loading, error, reload } = useProtectedLoader<ProjectDetailRecord>(loader);
	const [removingAuditorId, setRemovingAuditorId] = React.useState<string | null>(null);
	const [confirmOpen, setConfirmOpen] = React.useState(false);
	const [pendingRemoveAuditor, setPendingRemoveAuditor] = React.useState<ProjectAuditorRecord | null>(null);

	if (loading) return <LoadingState label="project profile" />;
	if (error) return <ErrorState message={error} />;
	if (!data) return <ErrorState message="Project data could not be loaded." />;
	const projectIdValue = data.id;

	function handleRemoveAuditor(auditor: ProjectAuditorRecord) {
		setPendingRemoveAuditor(auditor);
		setConfirmOpen(true);
	}

	async function doRemoveAuditor(auditor: ProjectAuditorRecord) {
		if (!session) return;
		try {
			setRemovingAuditorId(auditor.id);
			await deleteAssignment(session, {
				project_id: projectIdValue,
				auditor_id: auditor.id
			});
			reload();
		} finally {
			setRemovingAuditorId(null);
		}
	}

	return (
		<>
			<div className="space-y-6">
				<DashboardHero
					badge="Project profile"
					title={data.name}
					subtitle={data.description}
					meta={
						<>
							<Badge className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-white hover:bg-white/10">
								{data.organization}
							</Badge>
							<Badge className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-white hover:bg-white/10">
								{data.status}
							</Badge>
						</>
					}
					actions={
						<div className="flex flex-col items-start w-full gap-3">
							<Button asChild className="bg-white text-foreground w-full hover:bg-emerald-50">
								<Link href={`/manager/places/new?projectId=${data.id}`}>Add Places</Link>
							</Button>
							<Button
								asChild
								variant="outline"
								className="border-white/15 bg-white/6 text-white w-full hover:bg-white/10 hover:text-white">
								<Link href={`/manager/auditors?projectId=${data.id}`}>Manage Auditor Assignments</Link>
							</Button>
							<Button
								asChild
								variant="outline"
								className="border-white/15 bg-white/6 text-white w-full hover:bg-white/10 hover:text-white">
								<Link href={`/manager/projects/${data.id}/edit`}>Edit Project</Link>
							</Button>
							<Button
								asChild
								variant="outline"
								className="border-white/15 bg-white/6 text-white w-full hover:bg-white/10 hover:text-white">
								<Link href="/manager/reports">Open Reports</Link>
							</Button>
						</div>
					}
				/>

				<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
					<DetailMetric
						label="Places"
						value={`${data.total_places}`}
						description="Active places currently attached to this project."
					/>
					<DetailMetric
						label="All Audits"
						value={`${data.total_audits}`}
						description="Draft and submitted Audits recorded under this Project."
					/>
					<DetailMetric
						label="Submitted Audits"
						value={`${data.submitted_audits}`}
						description="Audits already available for reporting and export."
					/>
					<DetailMetric
						label="Assigned Auditors"
						value={`${data.assigned_auditors}`}
						description="Auditors currently assigned to Project Places."
					/>
				</section>

				<section className="grid gap-4 xl:grid-cols-2">
					<Card className="rounded-md border-border/80 bg-white shadow-sm">
						<CardHeader>
							<CardTitle>Project setup details</CardTitle>
							<CardDescription>
								Add as many projects as you need. Consistent project and place names keep everything
								easy to find later.
							</CardDescription>
						</CardHeader>
						<CardContent className="grid gap-4 sm:grid-cols-2 text-sm leading-6 text-foreground">
							<div className="rounded-md bg-muted/40 p-4 sm:col-span-2">
								<p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
									Project overview / aims
								</p>
								<p className="mt-2">{data.description}</p>
							</div>
							<div className="rounded-md bg-muted/40 p-4">
								<p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
									Types of Places to be Audited
								</p>
								<p className="mt-2">
									{data.place_types.length > 0
										? data.place_types.join(", ")
										: emptyHint("No place types chosen yet")}
								</p>
							</div>
							<div className="rounded-md bg-muted/40 p-4">
								<p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
									Estimated number of Places
								</p>
								<p className="mt-2">{data.estimated_places ?? emptyHint("No estimate added yet")}</p>
							</div>
							<div className="rounded-md bg-muted/40 p-4">
								<p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
									Anticipated Start Date
								</p>
								<p className="mt-2">{data.start_date ?? emptyHint("No start date set")}</p>
							</div>
							<div className="rounded-md bg-muted/40 p-4">
								<p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
									Anticipated End Date
								</p>
								<p className="mt-2">{data.end_date ?? emptyHint("No end date set")}</p>
							</div>
						</CardContent>
					</Card>

					<Card className="rounded-md border-border/80 bg-white shadow-sm">
						<CardHeader>
							<CardTitle>Auditor setup details</CardTitle>
							<CardDescription>
								Invite auditors to every place in this project, or just to specific ones. Come back here
								anytime to review coverage.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4 text-sm leading-6 text-foreground">
							<div className="rounded-md bg-muted/40 p-4">
								<p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
									Population type
								</p>
								<p className="mt-2">
									{data.auditor_population_types.length > 0
										? data.auditor_population_types.join(", ")
										: emptyHint("No population type chosen yet")}
								</p>
							</div>
							<div className="rounded-md bg-muted/40 p-4">
								<p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
									Inclusion / exclusion criteria
								</p>
								<p className="mt-2">
									{data.auditor_inclusion_exclusion_criteria || emptyHint("No criteria added yet")}
								</p>
							</div>
							<div className="rounded-md bg-muted/40 p-4">
								<p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
									Other notes about Auditors
								</p>
								<p className="mt-2">{data.auditor_notes || emptyHint("No notes added yet")}</p>
							</div>
						</CardContent>
					</Card>
				</section>

				<div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
					<ProjectPlacesTable rows={data.places} />
					<Card className="rounded-md border-border/80 bg-white shadow-sm">
						<CardHeader>
							<CardTitle>Project workflow</CardTitle>
							<CardDescription>
								Use this Project page to move from setup into Places, Auditors, Audits, and reporting.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
							<div className="flex items-start gap-3 rounded-md bg-muted/40 p-4">
								<MapPin className="mt-0.5 size-4 text-emerald-700" />
								<p>
									Place rows show the live Project scope so you can move directly into each Place
									profile and see how many Audits already exist.
								</p>
							</div>
							<div className="flex items-start gap-3 rounded-md bg-muted/40 p-4">
								<Users2 className="mt-0.5 size-4 text-emerald-700" />
								<p>
									Assigned Auditors stay grouped here so managers can review coverage and add more
									fieldworkers without leaving the Project flow.
								</p>
							</div>
							<div className="flex items-start gap-3 rounded-md bg-muted/40 p-4">
								<ClipboardList className="mt-0.5 size-4 text-emerald-700" />
								<p>
									Latest Audit activity stays visible here so it is easier to jump from Project setup
									into Audits and reports.
								</p>
							</div>
						</CardContent>
					</Card>
				</div>

				<ProjectAuditorsTable
					rows={data.auditors}
					onRemove={handleRemoveAuditor}
					removingAuditorId={removingAuditorId}
				/>
				<AssignmentPanel
					initialProjectId={data.id}
					hideProjectSelector
					title="Manage auditor assignments for this project"
					description="Choose one or more auditors and connect them to the places inside this project without leaving the project page."
					onAssigned={reload}
				/>
				<LatestAuditTable audits={data.latest_audits} />
			</div>
			<ConfirmDialog
				open={confirmOpen}
				onOpenChange={setConfirmOpen}
				title="Remove auditor"
				description={`Remove ${pendingRemoveAuditor?.name ?? "this auditor"} from all assignments in this project?`}
				variant="destructive"
				confirmLabel="Remove"
				onConfirm={async () => {
					if (pendingRemoveAuditor) await doRemoveAuditor(pendingRemoveAuditor);
				}}
			/>
		</>
	);
}

export function LivePlaceDetail({ placeId }: { placeId: string }) {
	const { session } = useAuth();
	const loader = React.useCallback(
		(session: NonNullable<ReturnType<typeof useAuth>["session"]>) => fetchPlaceDetail(session, placeId),
		[placeId]
	);
	const { data, loading, error, reload } = useProtectedLoader<PlaceDetailRecord>(loader);
	const [mapImageFailed, setMapImageFailed] = React.useState(false);
	const [placeConfirmOpen, setPlaceConfirmOpen] = React.useState(false);
	const [pendingRemovePlaceAuditor, setPendingRemovePlaceAuditor] = React.useState<PlaceAuditorRecord | null>(null);
	const [removingAuditorId, setRemovingAuditorId] = React.useState<string | null>(null);
	const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

	// Reset the failure flag during render when the map inputs change,
	// instead of in an effect, avoiding a cascading re-render.
	const mapInputsKey = [
		googleMapsApiKey,
		data?.lat,
		data?.lng,
		data?.address,
		data?.city,
		data?.province,
		data?.country,
		data?.postal_code
	].join("|");
	const [prevMapInputsKey, setPrevMapInputsKey] = React.useState(mapInputsKey);
	if (mapInputsKey !== prevMapInputsKey) {
		setPrevMapInputsKey(mapInputsKey);
		setMapImageFailed(false);
	}

	if (loading) return <LoadingState label="place profile" />;
	if (error) return <ErrorState message={error} />;
	if (!data) return <ErrorState message="Place data could not be loaded." />;
	const projectIdValue = data.project_id;
	const placeIdValue = data.id;

	function handleRemoveAuditor(auditor: PlaceAuditorRecord) {
		setPendingRemovePlaceAuditor(auditor);
		setPlaceConfirmOpen(true);
	}

	async function doRemovePlaceAuditor(auditor: PlaceAuditorRecord) {
		if (!session) return;
		try {
			setRemovingAuditorId(auditor.id);
			await deleteAssignment(session, {
				project_id: projectIdValue,
				auditor_id: auditor.id,
				place_id: placeIdValue
			});
			reload();
		} finally {
			setRemovingAuditorId(null);
		}
	}
	const mapQuery =
		data.lat !== null && data.lat !== undefined && data.lng !== null && data.lng !== undefined
			? `${data.lat},${data.lng}`
			: [data.address, data.city, data.province, data.country, data.postal_code].filter(Boolean).join(", ");
	const googleMapsHref = mapQuery
		? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`
		: null;
	const staticMapUrl = buildStaticMapUrl(googleMapsApiKey, mapQuery);

	return (
		<>
			<div className="space-y-6">
				<DashboardHero
					badge="Place profile"
					title={data.name}
					subtitle={
						<span className="flex flex-col gap-1">
							<span className="flex items-start gap-2">
								<MapPin className="mt-1 size-4 shrink-0" />
								<span>
									{data.address}
									{data.postal_code ? ` (${data.postal_code})` : ""}
								</span>
							</span>
							<span className="text-emerald-50/70">
								{[data.city, data.province, data.country].filter(Boolean).join(", ") ||
									"Detailed location not added yet."}
							</span>
						</span>
					}
					meta={
						<>
							<Badge className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-white hover:bg-white/10">
								{data.project_name}
							</Badge>
							<Badge className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-white hover:bg-white/10">
								{data.status}
							</Badge>
							{data.place_type ? (
								<Badge className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-white hover:bg-white/10">
									{data.place_type}
								</Badge>
							) : null}
						</>
					}
					actions={
						<div className="flex flex-col items-start w-full gap-3">
							<Button asChild className="bg-white text-foreground w-full hover:bg-emerald-50">
								<Link href={`/manager/projects/${data.project_id}`}>Open project</Link>
							</Button>
							<Button
								asChild
								variant="outline"
								className="border-white/15 bg-white/6 text-white w-full hover:bg-white/10 hover:text-white">
								<Link href={`/manager/places/${data.id}/edit`}>Edit place</Link>
							</Button>
							<Button
								asChild
								variant="outline"
								className="border-white/15 bg-white/6 text-white w-full hover:bg-white/10 hover:text-white">
								<Link href={`/manager/auditors?projectId=${data.project_id}&placeId=${data.id}`}>
									Manage Auditor Assignments
								</Link>
							</Button>
							<Button
								asChild
								variant="outline"
								className="border-white/15 bg-white/6 text-white w-full hover:bg-white/10 hover:text-white">
								<Link href={`/manager/audits?projectId=${data.project_id}&placeId=${data.id}`}>
									View Audits
								</Link>
							</Button>
							<Button
								asChild
								variant="outline"
								className="border-white/15 bg-white/6 text-white w-full hover:bg-white/10 hover:text-white">
								<Link href="/manager/reports">
									Open reports dashboard
									<FileBarChart2 className="size-4" />
								</Link>
							</Button>
						</div>
					}
				/>

				<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
					<DetailMetric
						label="Assigned auditors"
						value={`${data.assigned_auditors}`}
						description="Auditors currently allowed to complete YEE work at this place."
					/>
					<DetailMetric
						label="All audits"
						value={`${data.total_audits}`}
						description="Audit records linked to this place across current activity."
					/>
					<DetailMetric
						label="Submitted audits"
						value={`${data.submitted_audits}`}
						description="Completed YEE submissions available for scoring and reporting."
					/>
					<DetailActionCard
						label="View Audits"
						actionLabel="Open Audits"
						href={`/manager/audits?projectId=${data.project_id}&placeId=${data.id}`}
						description="Review draft and submitted audits already linked to this place from the manager workspace."
					/>
				</section>

				<section className="grid gap-4 xl:grid-cols-2">
					<Card className="rounded-md border-border/80 bg-white shadow-sm">
						<CardHeader>
							<CardTitle>Place setup details</CardTitle>
							<CardDescription>
								Set the place name, location, timing, and type here before you assign auditor access.
								This keeps every place consistent.
							</CardDescription>
						</CardHeader>
						<CardContent className="grid gap-4 sm:grid-cols-2 text-sm leading-6 text-foreground">
							<div className="rounded-md bg-muted/40 p-4">
								<p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
									Place Type
								</p>
								<p className="mt-2">{data.place_type || emptyHint("No place type chosen yet")}</p>
							</div>
							<div className="rounded-md bg-muted/40 p-4">
								<p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
									Estimated number of Auditors
								</p>
								<p className="mt-2">{data.estimated_auditors ?? emptyHint("No estimate added yet")}</p>
							</div>
							<div className="rounded-md bg-muted/40 p-4">
								<p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
									Anticipated Start Date
								</p>
								<p className="mt-2">{data.start_date ?? emptyHint("No start date set")}</p>
							</div>
							<div className="rounded-md bg-muted/40 p-4">
								<p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
									Anticipated End Date
								</p>
								<p className="mt-2">{data.end_date ?? emptyHint("No end date set")}</p>
							</div>
							<div className="rounded-md bg-muted/40 p-4 sm:col-span-2">
								<p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
									Detailed location
								</p>
								<p className="mt-2">
									{[data.city, data.province, data.country].filter(Boolean).join(", ") ||
										emptyHint("No location added yet")}
								</p>
							</div>
						</CardContent>
					</Card>

					<Card className="rounded-md border-border/80 bg-white shadow-sm">
						<CardHeader>
							<CardTitle>Auditor setup details</CardTitle>
							<CardDescription>
								Assign auditors to the whole project or to specific places. These notes help you keep
								access consistent.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4 text-sm leading-6 text-foreground">
							<div className="rounded-md bg-muted/40 p-4">
								<p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
									Population type
								</p>
								<p className="mt-2">
									{data.auditor_population_types.length > 0
										? data.auditor_population_types.join(", ")
										: emptyHint("No population type chosen yet")}
								</p>
							</div>
							<div className="rounded-md bg-muted/40 p-4">
								<p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
									Inclusion / exclusion criteria
								</p>
								<p className="mt-2">
									{data.auditor_inclusion_exclusion_criteria || emptyHint("No criteria added yet")}
								</p>
							</div>
							<div className="rounded-md bg-muted/40 p-4">
								<p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
									Other notes about Auditors
								</p>
								<p className="mt-2">{data.auditor_notes || emptyHint("No notes added yet")}</p>
							</div>
						</CardContent>
					</Card>
				</section>

				{googleMapsHref ? (
					<Card className="rounded-md border-border/80 bg-white shadow-sm">
						<CardHeader>
							<CardTitle>Map preview</CardTitle>
							<CardDescription>
								Review the Place snapshot here, then open Google Maps if you need a closer location
								check.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="rounded-md border border-border bg-muted/40 p-5">
								{staticMapUrl && !mapImageFailed ? (
									<div className="overflow-hidden rounded-md border border-border bg-white">
										<Image
											src={staticMapUrl}
											alt="Google Maps location preview"
											width={1200}
											height={520}
											className="h-64 w-full object-cover"
											onError={() => setMapImageFailed(true)}
										/>
									</div>
								) : (
									<p className="rounded-md border border-dashed border-slate-300 bg-white p-4 text-sm text-muted-foreground">
										Map snapshot unavailable right now, but the Google Maps link below is still
										ready for this Place.
									</p>
								)}
								<p className="mt-4 text-sm leading-6 text-muted-foreground">
									Use the location details below to review the Place in Google Maps without blocking
									the manager dashboard on an embedded map request.
								</p>
								<div className="mt-4 flex flex-wrap gap-3">
									<Button asChild className="bg-primary text-white hover:bg-primary/90">
										<a href={googleMapsHref} target="_blank" rel="noreferrer">
											Open in Google Maps
										</a>
									</Button>
									{data.lat !== null &&
									data.lat !== undefined &&
									data.lng !== null &&
									data.lng !== undefined ? (
										<p className="self-center text-xs text-muted-foreground">
											GPS pin: {data.lat.toFixed(5)}, {data.lng.toFixed(5)}
										</p>
									) : null}
								</div>
							</div>
						</CardContent>
					</Card>
				) : null}

				<PlaceAuditorsTable
					rows={data.auditors}
					onRemove={handleRemoveAuditor}
					removingAuditorId={removingAuditorId}
				/>
				<AssignmentPanel
					initialProjectId={data.project_id}
					initialPlaceId={data.id}
					hideProjectSelector
					compact
					title="Manage auditor assignments for this place"
					description="Select auditors and attach them to this place immediately. The table above will refresh after the assignment is saved."
					onAssigned={reload}
				/>

				<Card className="rounded-md border-border/80 bg-white shadow-sm">
					<CardHeader>
						<CardTitle>Submitted reports</CardTitle>
						<CardDescription>
							Open the full read-only report for each YEE audit submitted at this place.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<DataTable
							columns={submittedReportColumns}
							data={data.comparisons.audits}
							getRowId={row => row.audit_id}
							hideColumnMenu
							emptyState={
								<EmptyState
									title="No reports yet"
									description="No reports have been submitted for this place yet. As soon as an assigned auditor submits a YEE audit, its report appears here."
								/>
							}
							mobileCard={record => <SubmittedReportMobileCard record={record} />}
						/>
					</CardContent>
				</Card>

				{data.comparisons.audits.length === 0 ? (
					<Card className="rounded-md border-border/80 bg-white shadow-sm">
						<CardHeader>
							<CardTitle>Comparison view</CardTitle>
							<CardDescription>
								This place is ready for comparisons as soon as submitted YEE audits exist.
							</CardDescription>
						</CardHeader>
						<CardContent className="text-sm leading-6 text-muted-foreground">
							No submitted audits are linked to this place yet, so there is nothing to compare or export
							here.
						</CardContent>
					</Card>
				) : (
					<PlaceComparisonPanel group={data.comparisons} />
				)}
			</div>
			<ConfirmDialog
				open={placeConfirmOpen}
				onOpenChange={setPlaceConfirmOpen}
				title="Unassign auditor"
				description={`Unassign ${pendingRemovePlaceAuditor?.name ?? "this auditor"} from this place?`}
				variant="destructive"
				confirmLabel="Unassign"
				onConfirm={async () => {
					if (pendingRemovePlaceAuditor) await doRemovePlaceAuditor(pendingRemovePlaceAuditor);
				}}
			/>
		</>
	);
}
