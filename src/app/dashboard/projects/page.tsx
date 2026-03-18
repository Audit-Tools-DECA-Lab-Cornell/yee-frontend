import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { projects } from "@/lib/dashboard/mock-data";

export default function ProjectsPage() {
	return (
		<div className="space-y-6">
			<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
				<CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div>
						<CardTitle className="text-2xl">Projects</CardTitle>
						<CardDescription className="mt-2 max-w-2xl leading-6">
							Manager view for current studies. Each project can later link to its own detail page once routing and API data
							are ready.
						</CardDescription>
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
							{projects.map(project => (
								<tr key={project.id} className="border-b border-slate-100 last:border-0">
									<td className="py-4 pr-4 font-medium text-slate-900">{project.name}</td>
									<td className="py-4 pr-4 text-slate-600">{project.lead}</td>
									<td className="py-4 pr-4 text-slate-600">{project.places}</td>
									<td className="py-4 pr-4 text-slate-600">{project.audits}</td>
									<td className="py-4 pr-4">
										<Badge
											variant="secondary"
											className="rounded-full bg-amber-50 text-amber-700 hover:bg-amber-50">
											{project.status}
										</Badge>
									</td>
									<td className="py-4">
										<Button variant="ghost" className="rounded-2xl px-0 text-slate-700 hover:bg-transparent hover:text-slate-950">
											Open
											<ArrowUpRight className="size-4" />
										</Button>
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
