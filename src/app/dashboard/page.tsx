import Link from "next/link";
import { ArrowRight, FilePlus2, MapPinned, UserPlus, Users2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { audits, dashboardMetrics, recentActivity } from "@/lib/dashboard/mock-data";

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
		href: "/dashboard/auditors",
		icon: UserPlus
	}
];

export default function DashboardPage() {
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
							This manager view is now action-oriented: create projects, add places, invite auditors, and review
							results from the same workspace.
						</p>
						<div className="mt-6 flex flex-wrap gap-3">
							<Button asChild className="rounded-2xl bg-white text-slate-950 hover:bg-emerald-50">
								<Link href="/dashboard/projects/new">
									Create Project
									<ArrowRight className="size-4" />
								</Link>
							</Button>
							<Button
								asChild
								variant="outline"
								className="rounded-2xl border-white/15 bg-white/6 text-white hover:bg-white/10 hover:text-white">
								<Link href="/dashboard/places/new">Add Place</Link>
							</Button>
						</div>
					</div>

					<div className="rounded-[1.75rem] border border-white/10 bg-white/8 p-5 backdrop-blur-sm">
						<p className="text-sm font-medium text-emerald-50/80">Field snapshot</p>
						<div className="mt-5 grid gap-4">
							<div className="rounded-2xl bg-white/10 p-4">
								<p className="text-sm text-emerald-50/70">Coverage this week</p>
								<p className="mt-2 text-3xl font-semibold">84%</p>
							</div>
							<div className="flex items-center justify-between rounded-2xl bg-white/10 p-4">
								<div>
									<p className="text-sm text-emerald-50/70">Auditors assigned</p>
									<p className="mt-1 text-xl font-semibold">25</p>
								</div>
								<Users2 className="size-8 text-emerald-100/80" />
							</div>
						</div>
					</div>
				</div>
			</section>

			<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				{dashboardMetrics.map(metric => (
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
						<CardDescription>Latest project and fieldwork changes in the workspace.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						{recentActivity.map(item => (
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
								<Link
									key={link.href}
									href={link.href}
									className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4 transition-colors hover:bg-slate-50">
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

			<section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
				<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
					<CardHeader>
						<CardTitle>Latest audit scores</CardTitle>
						<CardDescription>Example recent submissions so the dashboard feels realistic before APIs arrive.</CardDescription>
					</CardHeader>
					<CardContent className="overflow-x-auto">
						<table className="min-w-full text-left text-sm">
							<thead className="text-slate-500">
								<tr className="border-b border-slate-200">
									<th className="py-3 pr-4 font-medium">Place</th>
									<th className="py-3 pr-4 font-medium">Auditor</th>
									<th className="py-3 pr-4 font-medium">Date</th>
									<th className="py-3 font-medium">Score</th>
								</tr>
							</thead>
							<tbody>
								{audits.slice(0, 4).map(audit => (
									<tr key={audit.id} className="border-b border-slate-100 last:border-0">
										<td className="py-4 pr-4 font-medium text-slate-900">{audit.place}</td>
										<td className="py-4 pr-4 text-slate-600">{audit.auditor}</td>
										<td className="py-4 pr-4 text-slate-600">{audit.date}</td>
										<td className="py-4">
											<Badge
												className="rounded-full bg-sky-50 text-sky-700 hover:bg-sky-50"
												variant="secondary">
												{audit.score === 0 ? "Draft" : `${audit.score}/100`}
											</Badge>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</CardContent>
				</Card>

				<Card className="rounded-[1.75rem] border-slate-200/80 bg-[#fffdf8] shadow-sm">
					<CardHeader>
						<CardTitle>Operator checklist</CardTitle>
						<CardDescription>What this manager dashboard is now ready to support next.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4 text-sm leading-6 text-slate-600">
						<p>Replace the mock metrics and records with API-driven React Query hooks.</p>
						<p>Connect create-project, add-place, and invite-auditor flows to backend forms and mutations.</p>
						<Button asChild variant="outline" className="rounded-2xl">
							<Link href="/dashboard/auditors">Open Auditors</Link>
						</Button>
					</CardContent>
				</Card>
			</section>
		</div>
	);
}
