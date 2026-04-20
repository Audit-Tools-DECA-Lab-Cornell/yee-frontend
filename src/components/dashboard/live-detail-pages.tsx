"use client";

import Link from "next/link";
import * as React from "react";
import { ArrowRight, ClipboardList, FileBarChart2, MapPin, Users2 } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { PlaceComparisonPanel } from "@/components/reporting/place-comparison-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	fetchPlaceDetail,
	fetchProjectDetail,
	type AuditRecord,
	type PlaceAuditorRecord,
	type PlaceDetailRecord,
	type ProjectAuditorRecord,
	type ProjectDetailRecord,
	type ProjectPlaceRecord
} from "@/lib/dashboard/live-api";

function LoadingState({ label }: { label: string }) {
	return (
		<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
			<CardContent className="p-6 text-sm text-slate-500">Loading {label}...</CardContent>
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

function DetailMetric({
	label,
	value,
	description
}: {
	label: string;
	value: string;
	description: string;
}) {
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

function useProtectedLoader<T>(loader: (accessToken: NonNullable<ReturnType<typeof useAuth>["session"]>) => Promise<T>) {
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
	}, [loader, session]);

	return { data, loading, error };
}

function LatestAuditTable({ audits }: { audits: AuditRecord[] }) {
	return (
		<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
			<CardHeader>
				<CardTitle>Latest audits</CardTitle>
				<CardDescription>Recent audit activity already linked to this scope.</CardDescription>
			</CardHeader>
			<CardContent className="overflow-x-auto">
				{audits.length === 0 ? (
					<EmptyTable message="No audits have been recorded here yet." />
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
										<Badge variant="secondary" className="rounded-full bg-sky-50 text-sky-700 hover:bg-sky-50">
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
				<CardTitle>Places in this project</CardTitle>
				<CardDescription>These places are currently attached to the project and available for YEE work.</CardDescription>
			</CardHeader>
			<CardContent className="overflow-x-auto">
				{rows.length === 0 ? (
					<EmptyTable message="No places have been added to this project yet." />
				) : (
					<table className="min-w-full text-left text-sm">
						<thead className="text-slate-500">
							<tr className="border-b border-slate-200">
								<th className="py-3 pr-4 font-medium">Place</th>
								<th className="py-3 pr-4 font-medium">Address</th>
								<th className="py-3 pr-4 font-medium">Audits</th>
								<th className="py-3 pr-4 font-medium">Last audit</th>
								<th className="py-3 pr-4 font-medium">Status</th>
								<th className="py-3 font-medium">Action</th>
							</tr>
						</thead>
						<tbody>
							{rows.map(place => (
								<tr key={place.id} className="border-b border-slate-100 last:border-0">
									<td className="py-4 pr-4 font-medium text-slate-900">{place.name}</td>
									<td className="py-4 pr-4 text-slate-600">{place.address}</td>
									<td className="py-4 pr-4 text-slate-600">{place.audits}</td>
									<td className="py-4 pr-4 text-slate-600">{place.last_audit}</td>
									<td className="py-4 pr-4">
										<Badge variant="secondary" className="rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
											{place.status}
										</Badge>
									</td>
									<td className="py-4">
										<Link href={`/dashboard/places/${place.id}`} className="inline-flex items-center gap-1 text-sm text-slate-700 hover:text-slate-950">
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

function ProjectAuditorsTable({ rows }: { rows: ProjectAuditorRecord[] }) {
	return (
		<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
			<CardHeader>
				<CardTitle>Assigned auditors</CardTitle>
				<CardDescription>Auditors linked to at least one place inside this project.</CardDescription>
			</CardHeader>
			<CardContent className="overflow-x-auto">
				{rows.length === 0 ? (
					<EmptyTable message="No auditors have been assigned to places in this project yet." />
				) : (
					<table className="min-w-full text-left text-sm">
						<thead className="text-slate-500">
							<tr className="border-b border-slate-200">
								<th className="py-3 pr-4 font-medium">Auditor</th>
								<th className="py-3 pr-4 font-medium">Generated ID</th>
								<th className="py-3 pr-4 font-medium">Assigned places</th>
								<th className="py-3 pr-4 font-medium">Completed audits</th>
								<th className="py-3 font-medium">Status</th>
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
										<Badge variant="secondary" className="rounded-full bg-slate-100 text-slate-700 hover:bg-slate-100">
											{auditor.status}
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

function PlaceAuditorsTable({ rows }: { rows: PlaceAuditorRecord[] }) {
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
								<th className="py-3 font-medium">Last audit</th>
							</tr>
						</thead>
						<tbody>
							{rows.map(auditor => (
								<tr key={auditor.id} className="border-b border-slate-100 last:border-0">
									<td className="py-4 pr-4 font-medium text-slate-900">{auditor.name}</td>
									<td className="py-4 pr-4 text-slate-600">{auditor.auditor_id}</td>
									<td className="py-4 pr-4">
										<Badge variant="secondary" className="rounded-full bg-slate-100 text-slate-700 hover:bg-slate-100">
											{auditor.status}
										</Badge>
									</td>
									<td className="py-4 pr-4 text-slate-600">{auditor.audit_count}</td>
									<td className="py-4 text-slate-600">{auditor.last_audit}</td>
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
	const loader = React.useCallback(
		(session: NonNullable<ReturnType<typeof useAuth>["session"]>) => fetchProjectDetail(session, projectId),
		[projectId]
	);
	const { data, loading, error } = useProtectedLoader<ProjectDetailRecord>(loader);

	if (loading) return <LoadingState label="project profile" />;
	if (error) return <ErrorState message={error} />;
	if (!data) return <ErrorState message="Project data could not be loaded." />;

	return (
		<div className="space-y-6">
			<section className="overflow-hidden rounded-[2rem] border border-emerald-200/60 bg-linear-to-br from-[#10231f] via-[#17302c] to-[#21483b] text-white shadow-xl shadow-emerald-950/10">
				<div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:px-10 lg:py-10">
					<div>
						<Badge className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-white hover:bg-white/10">Project profile</Badge>
						<h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{data.name}</h1>
						<p className="mt-4 max-w-3xl text-sm leading-7 text-emerald-50/85 sm:text-base">{data.description}</p>
						<div className="mt-5 flex flex-wrap gap-2 text-sm text-emerald-50/85">
							<Badge className="rounded-full bg-white/10 px-3 py-1 text-white hover:bg-white/10">{data.organization}</Badge>
							<Badge className="rounded-full bg-white/10 px-3 py-1 text-white hover:bg-white/10">{data.status}</Badge>
						</div>
					</div>
					<div className="rounded-[1.75rem] border border-white/10 bg-white/8 p-5 backdrop-blur-sm">
						<p className="text-sm font-medium text-emerald-50/80">Project actions</p>
						<div className="mt-5 grid gap-3">
							<Button asChild className="rounded-2xl bg-white text-slate-950 hover:bg-emerald-50">
								<Link href="/dashboard/places/new">Add place to project</Link>
							</Button>
							<Button asChild variant="outline" className="rounded-2xl border-white/15 bg-white/6 text-white hover:bg-white/10 hover:text-white">
								<Link href="/dashboard/reports">Open reports</Link>
							</Button>
						</div>
					</div>
				</div>
			</section>

			<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				<DetailMetric label="Places" value={`${data.total_places}`} description="Active places currently attached to this project." />
				<DetailMetric label="All audits" value={`${data.total_audits}`} description="Draft and submitted audits recorded under this project." />
				<DetailMetric label="Submitted audits" value={`${data.submitted_audits}`} description="Audits already available for reporting and export." />
				<DetailMetric label="Assigned auditors" value={`${data.assigned_auditors}`} description="Auditors currently assigned to project places." />
			</section>

			<div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
				<ProjectPlacesTable rows={data.places} />
				<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
					<CardHeader>
						<CardTitle>What this page now covers</CardTitle>
						<CardDescription>This route is no longer a placeholder. It reflects the real project scope already stored in the backend.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4 text-sm leading-6 text-slate-600">
						<div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
							<MapPin className="mt-0.5 size-4 text-emerald-700" />
							<p>Places table shows live place rows for this project with address, audit count, and latest audit date.</p>
						</div>
						<div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
							<Users2 className="mt-0.5 size-4 text-emerald-700" />
							<p>Assigned auditors use the existing backend assignment data and keep generated auditor IDs visible.</p>
						</div>
						<div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
							<ClipboardList className="mt-0.5 size-4 text-emerald-700" />
							<p>Latest audit activity comes from the same live dashboard audit source used elsewhere in the product.</p>
						</div>
					</CardContent>
				</Card>
			</div>

			<ProjectAuditorsTable rows={data.auditors} />
			<LatestAuditTable audits={data.latest_audits} />
		</div>
	);
}

export function LivePlaceDetail({ placeId }: { placeId: string }) {
	const loader = React.useCallback(
		(session: NonNullable<ReturnType<typeof useAuth>["session"]>) => fetchPlaceDetail(session, placeId),
		[placeId]
	);
	const { data, loading, error } = useProtectedLoader<PlaceDetailRecord>(loader);

	if (loading) return <LoadingState label="place profile" />;
	if (error) return <ErrorState message={error} />;
	if (!data) return <ErrorState message="Place data could not be loaded." />;

	return (
		<div className="space-y-6">
			<section className="overflow-hidden rounded-[2rem] border border-sky-200/60 bg-linear-to-br from-[#0f172a] via-[#17324d] to-[#14532d] text-white shadow-xl shadow-sky-950/10">
				<div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:px-10 lg:py-10">
					<div>
						<Badge className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-white hover:bg-white/10">Place profile</Badge>
						<h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{data.name}</h1>
						<p className="mt-4 flex items-start gap-2 text-sm leading-7 text-sky-50/85 sm:text-base">
							<MapPin className="mt-1 size-4 shrink-0" />
							<span>
								{data.address}
								{data.postal_code ? ` (${data.postal_code})` : ""}
							</span>
						</p>
						<p className="mt-4 max-w-3xl text-sm leading-7 text-sky-50/85 sm:text-base">{data.notes}</p>
						<div className="mt-5 flex flex-wrap gap-2 text-sm text-sky-50/85">
							<Badge className="rounded-full bg-white/10 px-3 py-1 text-white hover:bg-white/10">{data.project_name}</Badge>
							<Badge className="rounded-full bg-white/10 px-3 py-1 text-white hover:bg-white/10">{data.status}</Badge>
						</div>
					</div>
					<div className="rounded-[1.75rem] border border-white/10 bg-white/8 p-5 backdrop-blur-sm">
						<p className="text-sm font-medium text-sky-50/80">Place actions</p>
						<div className="mt-5 grid gap-3">
							<Button asChild className="rounded-2xl bg-white text-slate-950 hover:bg-sky-50">
								<Link href={`/dashboard/projects/${data.project_id}`}>Open project</Link>
							</Button>
							<Button asChild variant="outline" className="rounded-2xl border-white/15 bg-white/6 text-white hover:bg-white/10 hover:text-white">
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
				<DetailMetric label="Assigned auditors" value={`${data.assigned_auditors}`} description="Auditors currently allowed to complete YEE work at this place." />
				<DetailMetric label="All audits" value={`${data.total_audits}`} description="Audit records linked to this place across current activity." />
				<DetailMetric label="Submitted audits" value={`${data.submitted_audits}`} description="Completed YEE submissions available for scoring and reporting." />
				<DetailMetric label="Last audit" value={data.last_audit} description="Most recent submitted audit currently available in the backend." />
			</section>

			<PlaceAuditorsTable rows={data.auditors} />

			{data.comparisons.audits.length === 0 ? (
				<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
					<CardHeader>
						<CardTitle>Comparison view</CardTitle>
						<CardDescription>This place is ready for comparisons as soon as submitted YEE audits exist.</CardDescription>
					</CardHeader>
					<CardContent className="text-sm leading-6 text-slate-600">
						No submitted audits are linked to this place yet, so there is nothing to compare or export here.
					</CardContent>
				</Card>
			) : (
				<PlaceComparisonPanel group={data.comparisons} />
			)}
		</div>
	);
}
