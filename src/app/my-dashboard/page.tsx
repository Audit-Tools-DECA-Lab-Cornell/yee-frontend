import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { audits, places } from "@/lib/dashboard/mock-data";

const assignedPlaces = places.slice(0, 3);
const myAudits = audits.slice(0, 3);

export default function AuditorDashboardPage() {
	return (
		<div className="space-y-6">
			<section className="overflow-hidden rounded-[2rem] border border-emerald-200/60 bg-linear-to-br from-[#10231f] via-[#17302c] to-[#21483b] text-white shadow-xl shadow-emerald-950/10">
				<div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:px-10 lg:py-10">
					<div>
						<Badge className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-white hover:bg-white/10">
							Assigned fieldwork
						</Badge>
						<h1 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
							Your auditor dashboard is focused on fieldwork, not management.
						</h1>
						<p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-50/80 sm:text-base">
							See only your places, your audit history, and your next action so the interface stays clear in the field.
						</p>
						<div className="mt-6 flex flex-wrap gap-3">
							<Button asChild className="rounded-2xl bg-white text-slate-950 hover:bg-emerald-50">
								<Link href="/yee/audit/place-central-park">Start Audit</Link>
							</Button>
							<Button
								asChild
								variant="outline"
								className="rounded-2xl border-white/15 bg-white/6 text-white hover:bg-white/10 hover:text-white">
								<Link href="/my-dashboard/audits">Continue Drafts</Link>
							</Button>
						</div>
					</div>

					<div className="rounded-[1.75rem] border border-white/10 bg-white/8 p-5 backdrop-blur-sm">
						<p className="text-sm font-medium text-emerald-50/80">My field snapshot</p>
						<div className="mt-5 grid gap-4">
							<div className="rounded-2xl bg-white/10 p-4">
								<p className="text-sm text-emerald-50/70">Assigned places</p>
								<p className="mt-2 text-3xl font-semibold">{assignedPlaces.length}</p>
							</div>
							<div className="rounded-2xl bg-white/10 p-4">
								<p className="text-sm text-emerald-50/70">Completed audits</p>
								<p className="mt-2 text-3xl font-semibold">8</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
				<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
					<CardHeader>
						<CardTitle>Assigned places</CardTitle>
						<CardDescription>Only the places assigned to this auditor are shown here.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						{assignedPlaces.map(place => (
							<div key={place.id} className="rounded-2xl border border-slate-200 p-4">
								<p className="font-medium text-slate-900">{place.name}</p>
								<p className="mt-1 text-sm text-slate-600">{place.project}</p>
							</div>
						))}
					</CardContent>
				</Card>

				<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
					<CardHeader>
						<CardTitle>Next actions</CardTitle>
						<CardDescription>Auditors should get direct work actions, not management actions.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						<Button asChild className="w-full rounded-2xl bg-[#10231f] text-white hover:bg-[#17302c]">
							<Link href="/yee/audit/place-central-park">Start Audit</Link>
						</Button>
						<Button asChild variant="outline" className="w-full rounded-2xl">
							<Link href="/my-dashboard/audits">View My Audits</Link>
						</Button>
					</CardContent>
				</Card>
			</section>

			<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
				<CardHeader>
					<CardTitle>Recent audit history</CardTitle>
					<CardDescription>Only personal history should appear in the auditor workspace.</CardDescription>
				</CardHeader>
				<CardContent className="overflow-x-auto">
					<table className="min-w-full text-left text-sm">
						<thead className="text-slate-500">
							<tr className="border-b border-slate-200">
								<th className="py-3 pr-4 font-medium">Place</th>
								<th className="py-3 pr-4 font-medium">Date</th>
								<th className="py-3 pr-4 font-medium">Score</th>
								<th className="py-3 font-medium">Status</th>
							</tr>
						</thead>
						<tbody>
							{myAudits.map(audit => (
								<tr key={audit.id} className="border-b border-slate-100 last:border-0">
									<td className="py-4 pr-4 font-medium text-slate-900">{audit.place}</td>
									<td className="py-4 pr-4 text-slate-600">{audit.date}</td>
									<td className="py-4 pr-4 text-slate-600">{audit.score === 0 ? "-" : audit.score}</td>
									<td className="py-4">
										<Badge variant="secondary" className="rounded-full bg-slate-100 text-slate-700 hover:bg-slate-100">
											{audit.status}
										</Badge>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</CardContent>
			</Card>
		</div>
	);
}
