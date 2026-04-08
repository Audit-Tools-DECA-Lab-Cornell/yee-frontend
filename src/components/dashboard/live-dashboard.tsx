"use client";

import Link from "next/link";
import * as React from "react";
import { ArrowRight, ArrowUpRight, FilePlus2, MailPlus, MapPinned, UserPlus, Users2 } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	approveUser,
	fetchAuditors,
	fetchAudits,
	fetchDashboardOverview,
	fetchPlaces,
	fetchProjects,
	fetchUsers,
	type AuditRecord,
	type UserRecord
} from "@/lib/dashboard/live-api";

const quickLinks = [
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
		title: "Invite Auditor",
		description: "Send access to a new fieldworker and track assignment status.",
		href: "/dashboard/auditors/invite",
		icon: UserPlus
	}
];

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
		<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
			<CardContent className="p-6 text-sm text-slate-500">Loading {label}...</CardContent>
		</Card>
	);
}

function ErrorCard({ message }: { message: string }) {
	return (
		<Card className="rounded-[1.75rem] border-rose-200 bg-rose-50 shadow-sm">
			<CardContent className="p-6 text-sm text-rose-700">{message}</CardContent>
		</Card>
	);
}

function EmptyState({ title, description }: { title: string; description: string }) {
	return (
		<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
			<CardContent className="p-8 text-center">
				<p className="font-medium text-slate-900">{title}</p>
				<p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
			</CardContent>
		</Card>
	);
}

export function LiveManagerOverview() {
	const { data, loading, error } = useDashboardData(fetchDashboardOverview);

	if (loading) return <LoadingCard label="overview" />;
	if (error) return <ErrorCard message={error} />;
	if (!data) return <EmptyState title="No dashboard data yet" description="Sign in again and make sure the backend is running." />;

	return (
		<div className="space-y-6">
			<section className="overflow-hidden rounded-[2rem] border border-emerald-200/60 bg-linear-to-br from-[#10231f] via-[#17302c] to-[#21483b] text-white shadow-xl shadow-emerald-950/10">
				<div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:px-10 lg:py-10">
					<div>
						<Badge className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-white hover:bg-white/10">
							Youth Enabling Environments
						</Badge>
						<h1 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
							Your dashboard is ready for projects, places, and YEE fieldwork.
						</h1>
						<p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-50/80 sm:text-base">
							This manager view is now backed by real backend dashboard endpoints. Current scope is effectively single-tenant until
							manager-to-account scoping lands in the backend.
						</p>
						<div className="mt-6 flex flex-wrap gap-3">
							<Button asChild className="rounded-2xl bg-white text-slate-950 hover:bg-emerald-50">
								<Link href="/dashboard/projects/new">
									Create Project
									<ArrowRight className="size-4" />
								</Link>
							</Button>
							<Button asChild variant="outline" className="rounded-2xl border-white/15 bg-white/6 text-white hover:bg-white/10 hover:text-white">
								<Link href="/dashboard/places/new">Add Place</Link>
							</Button>
						</div>
					</div>
					<div className="rounded-[1.75rem] border border-white/10 bg-white/8 p-5 backdrop-blur-sm">
						<p className="text-sm font-medium text-emerald-50/80">Field snapshot</p>
						<div className="mt-5 grid gap-4">
							<div className="rounded-2xl bg-white/10 p-4">
								<p className="text-sm text-emerald-50/70">Coverage this week</p>
								<p className="mt-2 text-3xl font-semibold">{data.metrics[3]?.value ?? "00"}</p>
							</div>
							<div className="flex items-center justify-between rounded-2xl bg-white/10 p-4">
								<div>
									<p className="text-sm text-emerald-50/70">Auditors assigned</p>
									<p className="mt-1 text-xl font-semibold">{data.metrics[2]?.value ?? "00"}</p>
								</div>
								<Users2 className="size-8 text-emerald-100/80" />
							</div>
						</div>
					</div>
				</div>
			</section>

			<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				{data.metrics.map(metric => (
					<Card key={metric.title} className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
						<CardHeader className="gap-3">
							<CardDescription className="text-sm font-medium text-slate-500">{metric.title}</CardDescription>
							<CardTitle className="text-3xl font-semibold tracking-tight text-slate-950">{metric.value}</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2">
							<p className="text-sm leading-6 text-slate-600">{metric.description}</p>
							<Badge variant="secondary" className="rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
								{metric.trend}
							</Badge>
						</CardContent>
					</Card>
				))}
			</section>

			<section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
				<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
					<CardHeader>
						<CardTitle>Recent activity</CardTitle>
						<CardDescription>Latest backend activity visible in the dashboard.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						{data.recent_activity.map(item => (
							<div key={item} className="rounded-2xl bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-700">
								{item}
							</div>
						))}
					</CardContent>
				</Card>

				<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
					<CardHeader>
						<CardTitle>Manager actions</CardTitle>
						<CardDescription>Core setup actions for projects, places, and auditor assignment.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						{quickLinks.map(link => {
							const Icon = link.icon;
							return (
								<Link key={link.href} href={link.href} className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4 transition-colors hover:bg-slate-50">
									<div className="rounded-2xl bg-[#e4f5ee] p-2 text-emerald-700">
										<Icon className="size-4" />
									</div>
									<div className="min-w-0">
										<p className="text-sm font-semibold text-slate-900">{link.title}</p>
										<p className="mt-1 text-sm leading-6 text-slate-600">{link.description}</p>
									</div>
								</Link>
							);
						})}
					</CardContent>
				</Card>
			</section>

			<AuditTableCard title="Latest audit scores" description="Recent submitted or draft audits from the backend." audits={data.latest_audits} />
		</div>
	);
}

function AuditTableCard({ title, description, audits }: { title: string; description: string; audits: AuditRecord[] }) {
	return (
		<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent className="overflow-x-auto">
				{audits.length === 0 ? (
					<p className="text-sm text-slate-500">No audit rows are available yet.</p>
				) : (
					<table className="min-w-full text-left text-sm">
						<thead className="text-slate-500">
							<tr className="border-b border-slate-200">
								<th className="py-3 pr-4 font-medium">Place</th>
								<th className="py-3 pr-4 font-medium">Auditor</th>
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
									<td className="py-4 pr-4 text-slate-600">{audit.score === 0 ? "-" : audit.score}</td>
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

function useTableData<T>(loader: (session: NonNullable<ReturnType<typeof useAuth>["session"]>) => Promise<T[]>) {
	return useDashboardData(loader);
}

export function LiveProjectsTable() {
	const { data, loading, error } = useTableData(fetchProjects);
	if (loading) return <LoadingCard label="projects" />;
	if (error) return <ErrorCard message={error} />;
	if (!data?.length) return <EmptyState title="No projects yet" description="Create a project to see it appear here from the backend." />;

	return (
		<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
			<CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<CardTitle className="text-2xl">Projects</CardTitle>
					<CardDescription className="mt-2 max-w-2xl leading-6">Live project rows from the backend.</CardDescription>
				</div>
				<Button asChild className="rounded-2xl bg-[#10231f] text-white hover:bg-[#17302c]">
					<Link href="/dashboard/projects/new">Create Project</Link>
				</Button>
			</CardHeader>
			<CardContent className="overflow-x-auto">
				<table className="min-w-full text-left text-sm">
					<thead className="text-slate-500">
						<tr className="border-b border-slate-200">
							<th className="py-3 pr-4 font-medium">Project Name</th>
							<th className="py-3 pr-4 font-medium">Lead</th>
							<th className="py-3 pr-4 font-medium">Places</th>
							<th className="py-3 pr-4 font-medium">Audits</th>
							<th className="py-3 pr-4 font-medium">Status</th>
							<th className="py-3 font-medium">Action</th>
						</tr>
					</thead>
					<tbody>
						{data.map(project => (
							<tr key={project.id} className="border-b border-slate-100 last:border-0">
								<td className="py-4 pr-4 font-medium text-slate-900">{project.name}</td>
								<td className="py-4 pr-4 text-slate-600">{project.lead}</td>
								<td className="py-4 pr-4 text-slate-600">{project.places}</td>
								<td className="py-4 pr-4 text-slate-600">{project.audits}</td>
								<td className="py-4 pr-4">
									<Badge variant="secondary" className="rounded-full bg-amber-50 text-amber-700 hover:bg-amber-50">
										{project.status}
									</Badge>
								</td>
								<td className="py-4">
									<Link href={`/dashboard/projects/${project.id}`} className="inline-flex items-center gap-1 text-sm text-slate-700 hover:text-slate-950">
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
	if (loading) return <LoadingCard label="places" />;
	if (error) return <ErrorCard message={error} />;
	if (!data?.length) return <EmptyState title="No places yet" description="Add a place under a project and it will show here from the backend." />;

	return (
		<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
			<CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<CardTitle className="text-2xl">Places</CardTitle>
					<CardDescription className="mt-2 max-w-2xl leading-6">Live place rows from the backend.</CardDescription>
				</div>
				<Button asChild variant="outline" className="rounded-2xl">
					<Link href="/dashboard/places/new">Add Place</Link>
				</Button>
			</CardHeader>
			<CardContent className="overflow-x-auto">
				<table className="min-w-full text-left text-sm">
					<thead className="text-slate-500">
						<tr className="border-b border-slate-200">
							<th className="py-3 pr-4 font-medium">Place Name</th>
							<th className="py-3 pr-4 font-medium">Project</th>
							<th className="py-3 pr-4 font-medium">Audits</th>
							<th className="py-3 pr-4 font-medium">Last Audit</th>
							<th className="py-3 pr-4 font-medium">Status</th>
							<th className="py-3 font-medium">Action</th>
						</tr>
					</thead>
					<tbody>
						{data.map(place => (
							<tr key={place.id} className="border-b border-slate-100 last:border-0">
								<td className="py-4 pr-4 font-medium text-slate-900">{place.name}</td>
								<td className="py-4 pr-4 text-slate-600">{place.project}</td>
								<td className="py-4 pr-4 text-slate-600">{place.audits}</td>
								<td className="py-4 pr-4 text-slate-600">{place.last_audit}</td>
								<td className="py-4">
									<Badge variant="secondary" className="rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
										{place.status}
									</Badge>
								</td>
								<td className="py-4">
									<Link href={`/dashboard/places/${place.id}`} className="inline-flex items-center gap-1 text-sm text-slate-700 hover:text-slate-950">
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
	const { data, loading, error } = useTableData(fetchAuditors);
	if (loading) return <LoadingCard label="auditors" />;
	if (error) return <ErrorCard message={error} />;
	if (!data?.length) return <EmptyState title="No auditors yet" description="Invite or create auditor profiles in the backend to populate this table." />;

	return (
		<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
			<CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<CardTitle className="text-2xl">Auditors</CardTitle>
					<CardDescription className="mt-2 max-w-2xl leading-6">Live auditor rows from the backend.</CardDescription>
				</div>
				<Button asChild className="rounded-2xl bg-[#10231f] text-white hover:bg-[#17302c]">
					<Link href="/dashboard/auditors/invite">
						<MailPlus className="size-4" />
						Invite Auditor
					</Link>
				</Button>
			</CardHeader>
			<CardContent className="overflow-x-auto">
				<table className="min-w-full text-left text-sm">
					<thead className="text-slate-500">
						<tr className="border-b border-slate-200">
							<th className="py-3 pr-4 font-medium">Name</th>
							<th className="py-3 pr-4 font-medium">Assigned Places</th>
							<th className="py-3 pr-4 font-medium">Completed Audits</th>
							<th className="py-3 font-medium">Status</th>
						</tr>
					</thead>
					<tbody>
						{data.map(auditor => (
							<tr key={auditor.id} className="border-b border-slate-100 last:border-0">
								<td className="py-4 pr-4 font-medium text-slate-900">{auditor.name}</td>
								<td className="py-4 pr-4 text-slate-600">{auditor.assigned_places}</td>
								<td className="py-4 pr-4 text-slate-600">{auditor.completed_audits}</td>
								<td className="py-4">
									<Badge variant="secondary" className="rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
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
	const { data, loading, error } = useTableData(fetchAudits);
	if (loading) return <LoadingCard label="audits" />;
	if (error) return <ErrorCard message={error} />;
	return <AuditTableCard title="Audits" description="Live audit rows from the backend." audits={data ?? []} />;
}

export function LiveAdminOverview() {
	const overview = useDashboardData(fetchDashboardOverview);
	const users = useTableData(fetchUsers);

	if (overview.loading || users.loading) return <LoadingCard label="admin dashboard" />;
	if (overview.error) return <ErrorCard message={overview.error} />;
	if (users.error) return <ErrorCard message={users.error} />;
	if (!overview.data) return <EmptyState title="No admin data yet" description="Make sure the backend is running and you are signed in as an admin." />;

	return (
		<div className="space-y-6">
			<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				{[
					{ title: "Users", value: `${users.data?.length ?? 0}`, description: "All roles across the platform." },
					...overview.data.metrics
				].slice(0, 4).map(metric => (
					<Card key={metric.title} className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
						<CardHeader>
							<CardDescription>{metric.title}</CardDescription>
							<CardTitle className="text-3xl">{metric.value}</CardTitle>
						</CardHeader>
						<CardContent className="text-sm text-slate-600">{metric.description}</CardContent>
					</Card>
				))}
			</section>
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
	if (!rows.length && !loading) return <EmptyState title="No users yet" description="User records will appear here once accounts exist in the backend." />;

	return (
		<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
			<CardHeader>
				<CardTitle>Users</CardTitle>
				<CardDescription>All managers, auditors, and admins across the system, including approval actions for pending accounts.</CardDescription>
			</CardHeader>
			{actionError ? <CardContent className="pt-0 text-sm text-rose-700">{actionError}</CardContent> : null}
			<CardContent className="overflow-x-auto">
				<table className="min-w-full text-left text-sm">
					<thead className="text-slate-500">
						<tr className="border-b border-slate-200">
							<th className="py-3 pr-4 font-medium">Name</th>
							<th className="py-3 pr-4 font-medium">Email</th>
							<th className="py-3 pr-4 font-medium">Role</th>
							<th className="py-3 pr-4 font-medium">Organization</th>
							<th className="py-3 pr-4 font-medium">Status</th>
							<th className="py-3 font-medium">Action</th>
						</tr>
					</thead>
					<tbody>
						{rows.map(user => (
							<tr key={user.id} className="border-b border-slate-100 last:border-0">
								<td className="py-4 pr-4 font-medium text-slate-900">{user.name}</td>
								<td className="py-4 pr-4 text-slate-600">{user.email}</td>
								<td className="py-4 pr-4 text-slate-600">{user.role}</td>
								<td className="py-4 pr-4 text-slate-600">{user.organization}</td>
								<td className="py-4 pr-4">
									<Badge variant="secondary" className="rounded-full bg-slate-100 text-slate-700 hover:bg-slate-100">
										{user.status}
									</Badge>
								</td>
								<td className="py-4">
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
													className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
												>
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
												className="rounded-xl bg-[#10231f] text-white hover:bg-[#17302c]"
												onClick={() => void handleApprove(user)}
												disabled={
													submittingUserId === user.id ||
													(user.role === "AUDITOR" && !selectedAccounts[user.id] && !user.account_id)
												}
											>
												{submittingUserId === user.id ? "Approving..." : "Approve"}
											</Button>
										</div>
									) : (
										<span className="text-sm text-slate-500">No action needed</span>
									)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</CardContent>
		</Card>
	);
}
