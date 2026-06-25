"use client";

import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { ArrowRight, ClipboardList, FileBarChart2, MapPin, Users2 } from "lucide-react";

import { AssignmentPanel } from "@/components/dashboard/assignment-panel";
import { useAuth } from "@/components/auth/auth-provider";
import { PlaceComparisonPanel } from "@/components/reporting/place-comparison-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
	deleteAssignment,
	fetchPlaceDetail,
	fetchProjectDetail,
	type AuditRecord,
	type PlaceAuditorRecord,
	type PlaceDetailRecord,
	type ProjectAuditorRecord,
	type ProjectDetailRecord,
	type ProjectPlaceRecord
} from "@/lib/dashboard/live-api";

function buildStaticMapUrl(apiKey: string | undefined, query: string) {
	if (!apiKey || !query) return null;
	return `https://maps.googleapis.com/maps/api/staticmap?key=${encodeURIComponent(apiKey)}&size=1200x520&scale=2&zoom=15&maptype=roadmap&center=${encodeURIComponent(query)}&markers=color:0x10231f|${encodeURIComponent(query)}`;
}

function LoadingState({ label }: { label: string }) {
	return (
		<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
			<CardContent className="p-6 text-sm text-slate-500">Loading {label}\u2026</CardContent>
		</Card>
	);
}

function ErrorState({ message }: { message: string }) {
	return (
		<Card className="rounded-[1.75rem] border-rose-200 bg-rose-50 shadow-sm">
			<CardContent className="p-6 text-sm text-rose-700">{message}</CardContent>
		</Card>
	);
}

function EmptyTable({ message }: { message: string }) {
	return <p className="text-sm leading-6 text-slate-500">{message}</p>;
}

function DetailMetric({ label, value, description }: { label: string; value: string; description: string }) {
	return (
		<Card className="rounded-[1.5rem] border-slate-200/80 bg-white shadow-sm">
			<CardHeader className="pb-3">
				<CardDescription>{label}</CardDescription>
				<CardTitle className="text-3xl font-semibold tracking-tight text-slate-950">{value}</CardTitle>
			</CardHeader>
			<CardContent className="text-sm leading-6 text-slate-600">{description}</CardContent>
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
		<Card className="rounded-[1.5rem] border-slate-200/80 bg-white shadow-sm">
			<CardHeader className="pb-3">
				<CardDescription>{label}</CardDescription>
				<CardTitle className="text-2xl font-semibold tracking-tight text-slate-950">{actionLabel}</CardTitle>
			</CardHeader>
			<CardContent className="flex items-center justify-between gap-4 text-sm leading-6 text-slate-600">
				<p>{description}</p>
				<Button asChild className="rounded-2xl bg-[#10231f] text-white hover:bg-[#17302c]">
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

function LatestAuditTable({ audits }: { audits: AuditRecord[] }) {
	return (
		<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
			<CardHeader>
				<CardTitle>Latest Audits</CardTitle>
				<CardDescription>Recent Audit activity already linked to this scope.</CardDescription>
			</CardHeader>
			<CardContent className="overflow-x-auto">
				{audits.length === 0 ? (
					<EmptyTable message="No Audits have been recorded here yet." />
				) : (
					<table className="min-w-full text-left text-sm">
						<thead className="text-slate-500">
							<tr className="border-b border-slate-200">
								<th className="py-3 pr-4 font-medium">Place</th>
								<th className="py-3 pr-4 font-medium">Auditor ID</th>
								<th className="py-3 pr-4 font-medium">Date</th>
								<th className="py-3 pr-4 font-medium">Score</th>
								<th className="py-3 font-medium">Status</th>
							</tr>
						</thead>
						<tbody>
							{audits.map(audit => (
								<tr key={audit.id} className="border-b border-slate-100 last:border-0">
									<td className="py-4 pr-4 font-medium text-slate-900">{audit.place}</td>
									<td className="py-4 pr-4 text-slate-600">{audit.auditor}</td>
									<td className="py-4 pr-4 text-slate-600">{audit.date}</td>
									<td className="py-4 pr-4 text-slate-600">{audit.score || "-"}</td>
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

function ProjectPlacesTable({ rows }: { rows: ProjectPlaceRecord[] }) {
	return (
		<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
			<CardHeader>
				<CardTitle>Places in this Project</CardTitle>
				<CardDescription>
					These Places are currently attached to the Project and available for YEE work.
				</CardDescription>
			</CardHeader>
			<CardContent className="overflow-x-auto">
				{rows.length === 0 ? (
					<EmptyTable message="No Places have been added to this Project yet." />
				) : (
					<table className="min-w-full text-left text-sm">
						<thead className="text-slate-500">
							<tr className="border-b border-slate-200">
								<th className="py-3 pr-4 font-medium">Place</th>
								<th className="py-3 pr-4 font-medium">Address</th>
								<th className="py-3 pr-4 font-medium">Audits</th>
								<th className="py-3 pr-4 font-medium">Submitted Audits</th>
								<th className="py-3 pr-4 font-medium">Status</th>
								<th className="py-3 font-medium">Action</th>
							</tr>
						</thead>
						<tbody>
							{rows.map(place => (
								<tr
									key={place.id}
									className="border-b border-slate-100 last:border-0 transition hover:bg-slate-50">
									<td className="py-4 pr-4 font-medium text-slate-900">
										<Link
											href={`/dashboard/places/${place.id}`}
											className="hover:text-slate-950 hover:underline">
											{place.name}
										</Link>
									</td>
									<td className="py-4 pr-4 text-slate-600">{place.address}</td>
									<td className="py-4 pr-4 text-slate-600">{place.audits}</td>
									<td className="py-4 pr-4 text-slate-600">{place.last_audit}</td>
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
											className="inline-flex items-center gap-1 text-sm text-slate-700 hover:text-slate-950">
											Open
											<ArrowRight className="size-4" />
										</Link>
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

function ProjectAuditorsTable({
	rows,
	onRemove,
	removingAuditorId
}: {
	rows: ProjectAuditorRecord[];
	onRemove?: (auditor: ProjectAuditorRecord) => void;
	removingAuditorId?: string | null;
}) {
	return (
		<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
			<CardHeader>
				<CardTitle>Assigned Auditors</CardTitle>
				<CardDescription>Auditors linked to at least one Place inside this Project.</CardDescription>
			</CardHeader>
			<CardContent className="overflow-x-auto">
				{rows.length === 0 ? (
					<EmptyTable message="No Auditors have been assigned to Places in this Project yet." />
				) : (
					<table className="min-w-full text-left text-sm">
						<thead className="text-slate-500">
							<tr className="border-b border-slate-200">
								<th className="py-3 pr-4 font-medium">Auditor</th>
								<th className="py-3 pr-4 font-medium">Generated ID</th>
								<th className="py-3 pr-4 font-medium">Assigned Places</th>
								<th className="py-3 pr-4 font-medium">Completed Audits</th>
								<th className="py-3 pr-4 font-medium">Status</th>
								<th className="py-3 font-medium">Action</th>
							</tr>
						</thead>
						<tbody>
							{rows.map(auditor => (
								<tr key={auditor.id} className="border-b border-slate-100 last:border-0">
									<td className="py-4 pr-4 font-medium text-slate-900">{auditor.name}</td>
									<td className="py-4 pr-4 text-slate-600">{auditor.auditor_id}</td>
									<td className="py-4 pr-4 text-slate-600">{auditor.assigned_places}</td>
									<td className="py-4 pr-4 text-slate-600">{auditor.completed_audits}</td>
									<td className="py-4">
										<Badge
											variant="secondary"
											className="rounded-full bg-slate-100 text-slate-700 hover:bg-slate-100">
											{auditor.status}
										</Badge>
									</td>
									<td className="py-4">
										{onRemove ? (
											<Button
												type="button"
												variant="outline"
												className="rounded-2xl"
												disabled={removingAuditorId === auditor.id}
												onClick={() => onRemove(auditor)}>
												{removingAuditorId === auditor.id
													? "Removing..."
													: "Remove from project"}
											</Button>
										) : null}
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

function PlaceAuditorsTable({
	rows,
	onRemove,
	removingAuditorId
}: {
	rows: PlaceAuditorRecord[];
	onRemove?: (auditor: PlaceAuditorRecord) => void;
	removingAuditorId?: string | null;
}) {
	return (
		<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
			<CardHeader>
				<CardTitle>Assigned auditors</CardTitle>
				<CardDescription>Place assignments and submission status for each auditor.</CardDescription>
			</CardHeader>
			<CardContent className="overflow-x-auto">
				{rows.length === 0 ? (
					<EmptyTable message="No auditors have been assigned to this place yet." />
				) : (
					<table className="min-w-full text-left text-sm">
						<thead className="text-slate-500">
							<tr className="border-b border-slate-200">
								<th className="py-3 pr-4 font-medium">Auditor</th>
								<th className="py-3 pr-4 font-medium">Generated ID</th>
								<th className="py-3 pr-4 font-medium">Status</th>
								<th className="py-3 pr-4 font-medium">Submitted audits</th>
								<th className="py-3 pr-4 font-medium">Last audit</th>
								<th className="py-3 font-medium">Action</th>
							</tr>
						</thead>
						<tbody>
							{rows.map(auditor => (
								<tr key={auditor.id} className="border-b border-slate-100 last:border-0">
									<td className="py-4 pr-4 font-medium text-slate-900">{auditor.name}</td>
									<td className="py-4 pr-4 text-slate-600">{auditor.auditor_id}</td>
									<td className="py-4 pr-4">
										<Badge
											variant="secondary"
											className="rounded-full bg-slate-100 text-slate-700 hover:bg-slate-100">
											{auditor.status}
										</Badge>
									</td>
									<td className="py-4 pr-4 text-slate-600">{auditor.audit_count}</td>
									<td className="py-4 pr-4 text-slate-600">{auditor.last_audit}</td>
									<td className="py-4">
										{onRemove ? (
											<Button
												type="button"
												variant="outline"
												className="rounded-2xl"
												disabled={removingAuditorId === auditor.id}
												onClick={() => onRemove(auditor)}>
												{removingAuditorId === auditor.id ? "Removing..." : "Unassign"}
											</Button>
										) : null}
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
				<section className="overflow-hidden rounded-[2rem] border border-emerald-200/60 bg-linear-to-br from-[#10231f] via-[#17302c] to-[#21483b] text-white shadow-xl shadow-emerald-950/10">
					<div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:px-10 lg:py-10">
						<div>
							<Badge className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-white hover:bg-white/10">
								Project profile
							</Badge>
							<h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{data.name}</h1>
							<p className="mt-4 max-w-3xl text-sm leading-7 text-emerald-50/85 sm:text-base">
								{data.description}
							</p>
							<div className="mt-5 flex flex-wrap gap-2 text-sm text-emerald-50/85">
								<Badge className="rounded-full bg-white/10 px-3 py-1 text-white hover:bg-white/10">
									{data.organization}
								</Badge>
								<Badge className="rounded-full bg-white/10 px-3 py-1 text-white hover:bg-white/10">
									{data.status}
								</Badge>
							</div>
						</div>
						<div className="rounded-[1.75rem] border border-white/10 bg-white/8 p-5 backdrop-blur-sm">
							<p className="text-sm font-medium text-emerald-50/80">Project actions</p>
							<div className="mt-5 grid gap-3">
								<Button asChild className="rounded-2xl bg-white text-slate-950 hover:bg-emerald-50">
									<Link href={`/dashboard/places/new?projectId=${data.id}`}>Add Places</Link>
								</Button>
								<Button
									asChild
									variant="outline"
									className="rounded-2xl border-white/15 bg-white/6 text-white hover:bg-white/10 hover:text-white">
									<Link href={`/dashboard/auditors?projectId=${data.id}`}>
										Manage Auditor Assignments
									</Link>
								</Button>
								<Button
									asChild
									variant="outline"
									className="rounded-2xl border-white/15 bg-white/6 text-white hover:bg-white/10 hover:text-white">
									<Link href={`/dashboard/projects/${data.id}/edit`}>Edit Project</Link>
								</Button>
								<Button
									asChild
									variant="outline"
									className="rounded-2xl border-white/15 bg-white/6 text-white hover:bg-white/10 hover:text-white">
									<Link href="/dashboard/reports">Open Reports</Link>
								</Button>
							</div>
						</div>
					</div>
				</section>

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
					<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
						<CardHeader>
							<CardTitle>Project setup details</CardTitle>
							<CardDescription>
								Managers can set up as many Projects as they need and keep Project and Place naming
								consistent before inviting Auditors.
							</CardDescription>
						</CardHeader>
						<CardContent className="grid gap-4 sm:grid-cols-2 text-sm leading-6 text-slate-700">
							<div className="rounded-2xl bg-slate-50 p-4 sm:col-span-2">
								<p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
									Project overview / aims
								</p>
								<p className="mt-2">{data.description}</p>
							</div>
							<div className="rounded-2xl bg-slate-50 p-4">
								<p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
									Types of Places to be Audited
								</p>
								<p className="mt-2">
									{data.place_types.length > 0 ? data.place_types.join(", ") : "Not specified yet."}
								</p>
							</div>
							<div className="rounded-2xl bg-slate-50 p-4">
								<p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
									Estimated number of Places
								</p>
								<p className="mt-2">{data.estimated_places ?? "Not specified yet."}</p>
							</div>
							<div className="rounded-2xl bg-slate-50 p-4">
								<p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
									Anticipated Start Date
								</p>
								<p className="mt-2">{data.start_date ?? "Not specified yet."}</p>
							</div>
							<div className="rounded-2xl bg-slate-50 p-4">
								<p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
									Anticipated End Date
								</p>
								<p className="mt-2">{data.end_date ?? "Not specified yet."}</p>
							</div>
						</CardContent>
					</Card>

					<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
						<CardHeader>
							<CardTitle>Auditor setup details</CardTitle>
							<CardDescription>
								Managers can invite Auditors to all Places or select Places, then return here to review
								coverage without leaving the Project flow.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4 text-sm leading-6 text-slate-700">
							<div className="rounded-2xl bg-slate-50 p-4">
								<p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
									Population type
								</p>
								<p className="mt-2">
									{data.auditor_population_types.length > 0
										? data.auditor_population_types.join(", ")
										: "Not specified yet."}
								</p>
							</div>
							<div className="rounded-2xl bg-slate-50 p-4">
								<p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
									Inclusion / exclusion criteria
								</p>
								<p className="mt-2">
									{data.auditor_inclusion_exclusion_criteria || "Not specified yet."}
								</p>
							</div>
							<div className="rounded-2xl bg-slate-50 p-4">
								<p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
									Other notes about Auditors
								</p>
								<p className="mt-2">{data.auditor_notes || "Not specified yet."}</p>
							</div>
						</CardContent>
					</Card>
				</section>

				<div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
					<ProjectPlacesTable rows={data.places} />
					<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
						<CardHeader>
							<CardTitle>Project workflow</CardTitle>
							<CardDescription>
								Use this Project page to move from setup into Places, Auditors, Audits, and reporting.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4 text-sm leading-6 text-slate-600">
							<div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
								<MapPin className="mt-0.5 size-4 text-emerald-700" />
								<p>
									Place rows show the live Project scope so you can move directly into each Place
									profile and see how many Audits already exist.
								</p>
							</div>
							<div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
								<Users2 className="mt-0.5 size-4 text-emerald-700" />
								<p>
									Assigned Auditors stay grouped here so managers can review coverage and add more
									fieldworkers without leaving the Project flow.
								</p>
							</div>
							<div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
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

	React.useEffect(() => {
		setMapImageFailed(false);
	}, [
		googleMapsApiKey,
		data?.lat,
		data?.lng,
		data?.address,
		data?.city,
		data?.province,
		data?.country,
		data?.postal_code
	]);

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
				<section className="overflow-hidden rounded-[2rem] border border-sky-200/60 bg-linear-to-br from-[#0f172a] via-[#17324d] to-[#14532d] text-white shadow-xl shadow-sky-950/10">
					<div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:px-10 lg:py-10">
						<div>
							<Badge className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-white hover:bg-white/10">
								Place profile
							</Badge>
							<h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{data.name}</h1>
							<p className="mt-4 flex items-start gap-2 text-sm leading-7 text-sky-50/85 sm:text-base">
								<MapPin className="mt-1 size-4 shrink-0" />
								<span>
									{data.address}
									{data.postal_code ? ` (${data.postal_code})` : ""}
								</span>
							</p>
							<p className="mt-3 max-w-3xl text-sm leading-7 text-sky-50/85 sm:text-base">
								{[data.city, data.province, data.country].filter(Boolean).join(", ") ||
									"Detailed location not added yet."}
							</p>
							<div className="mt-5 flex flex-wrap gap-2 text-sm text-sky-50/85">
								<Badge className="rounded-full bg-white/10 px-3 py-1 text-white hover:bg-white/10">
									{data.project_name}
								</Badge>
								<Badge className="rounded-full bg-white/10 px-3 py-1 text-white hover:bg-white/10">
									{data.status}
								</Badge>
								{data.place_type ? (
									<Badge className="rounded-full bg-white/10 px-3 py-1 text-white hover:bg-white/10">
										{data.place_type}
									</Badge>
								) : null}
							</div>
						</div>
						<div className="rounded-[1.75rem] border border-white/10 bg-white/8 p-5 backdrop-blur-sm">
							<p className="text-sm font-medium text-sky-50/80">Place actions</p>
							<div className="mt-5 grid gap-3">
								<Button asChild className="rounded-2xl bg-white text-slate-950 hover:bg-sky-50">
									<Link href={`/dashboard/projects/${data.project_id}`}>Open project</Link>
								</Button>
								<Button
									asChild
									variant="outline"
									className="rounded-2xl border-white/15 bg-white/6 text-white hover:bg-white/10 hover:text-white">
									<Link href={`/dashboard/places/${data.id}/edit`}>Edit place</Link>
								</Button>
								<Button
									asChild
									variant="outline"
									className="rounded-2xl border-white/15 bg-white/6 text-white hover:bg-white/10 hover:text-white">
									<Link href={`/dashboard/auditors?projectId=${data.project_id}&placeId=${data.id}`}>
										Manage Auditor Assignments
									</Link>
								</Button>
								<Button
									asChild
									variant="outline"
									className="rounded-2xl border-white/15 bg-white/6 text-white hover:bg-white/10 hover:text-white">
									<Link href={`/dashboard/audits?projectId=${data.project_id}&placeId=${data.id}`}>
										View Audits
									</Link>
								</Button>
								<Button
									asChild
									variant="outline"
									className="rounded-2xl border-white/15 bg-white/6 text-white hover:bg-white/10 hover:text-white">
									<Link href="/dashboard/reports">
										View comparison reports
										<FileBarChart2 className="size-4" />
									</Link>
								</Button>
							</div>
						</div>
					</div>
				</section>

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
						href={`/dashboard/audits?projectId=${data.project_id}&placeId=${data.id}`}
						description="Review draft and submitted audits already linked to this place from the manager workspace."
					/>
				</section>

				<section className="grid gap-4 xl:grid-cols-2">
					<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
						<CardHeader>
							<CardTitle>Place setup details</CardTitle>
							<CardDescription>
								Managers can define consistent Place naming, location details, timing, and Place Type
								before assigning Auditor access.
							</CardDescription>
						</CardHeader>
						<CardContent className="grid gap-4 sm:grid-cols-2 text-sm leading-6 text-slate-700">
							<div className="rounded-2xl bg-slate-50 p-4">
								<p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
									Place Type
								</p>
								<p className="mt-2">{data.place_type || "Not specified yet."}</p>
							</div>
							<div className="rounded-2xl bg-slate-50 p-4">
								<p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
									Estimated number of Auditors
								</p>
								<p className="mt-2">{data.estimated_auditors ?? "Not specified yet."}</p>
							</div>
							<div className="rounded-2xl bg-slate-50 p-4">
								<p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
									Anticipated Start Date
								</p>
								<p className="mt-2">{data.start_date ?? "Not specified yet."}</p>
							</div>
							<div className="rounded-2xl bg-slate-50 p-4">
								<p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
									Anticipated End Date
								</p>
								<p className="mt-2">{data.end_date ?? "Not specified yet."}</p>
							</div>
							<div className="rounded-2xl bg-slate-50 p-4 sm:col-span-2">
								<p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
									Detailed location
								</p>
								<p className="mt-2">
									{[data.city, data.province, data.country].filter(Boolean).join(", ") ||
										"Detailed location not specified yet."}
								</p>
							</div>
						</CardContent>
					</Card>

					<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
						<CardHeader>
							<CardTitle>Auditor setup details</CardTitle>
							<CardDescription>
								Auditors can be assigned at the Project level or narrowed to select Places, and these
								notes help managers keep that access setup consistent.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4 text-sm leading-6 text-slate-700">
							<div className="rounded-2xl bg-slate-50 p-4">
								<p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
									Population type
								</p>
								<p className="mt-2">
									{data.auditor_population_types.length > 0
										? data.auditor_population_types.join(", ")
										: "Not specified yet."}
								</p>
							</div>
							<div className="rounded-2xl bg-slate-50 p-4">
								<p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
									Inclusion / exclusion criteria
								</p>
								<p className="mt-2">
									{data.auditor_inclusion_exclusion_criteria || "Not specified yet."}
								</p>
							</div>
							<div className="rounded-2xl bg-slate-50 p-4">
								<p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
									Other notes about Auditors
								</p>
								<p className="mt-2">{data.auditor_notes || "Not specified yet."}</p>
							</div>
						</CardContent>
					</Card>
				</section>

				{googleMapsHref ? (
					<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
						<CardHeader>
							<CardTitle>Map preview</CardTitle>
							<CardDescription>
								Review the Place snapshot here, then open Google Maps if you need a closer location
								check.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
								{staticMapUrl && !mapImageFailed ? (
									<div className="overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white">
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
									<p className="rounded-[1.25rem] border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
										Map snapshot unavailable right now, but the Google Maps link below is still
										ready for this Place.
									</p>
								)}
								<p className="mt-4 text-sm leading-6 text-slate-600">
									Use the location details below to review the Place in Google Maps without blocking
									the manager dashboard on an embedded map request.
								</p>
								<div className="mt-4 flex flex-wrap gap-3">
									<Button asChild className="rounded-2xl bg-[#10231f] text-white hover:bg-[#17302c]">
										<a href={googleMapsHref} target="_blank" rel="noreferrer">
											Open in Google Maps
										</a>
									</Button>
									{data.lat !== null &&
									data.lat !== undefined &&
									data.lng !== null &&
									data.lng !== undefined ? (
										<p className="self-center text-xs text-slate-500">
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

				{data.comparisons.audits.length === 0 ? (
					<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
						<CardHeader>
							<CardTitle>Comparison view</CardTitle>
							<CardDescription>
								This place is ready for comparisons as soon as submitted YEE audits exist.
							</CardDescription>
						</CardHeader>
						<CardContent className="text-sm leading-6 text-slate-600">
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
