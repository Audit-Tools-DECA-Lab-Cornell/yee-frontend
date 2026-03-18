import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { audits, places, projects, users } from "@/lib/dashboard/mock-data";

const adminMetrics = [
	{ title: "Users", value: `${users.length}`, description: "All roles across the platform." },
	{ title: "Projects", value: `${projects.length}`, description: "Projects across organizations." },
	{ title: "Places", value: `${places.length}`, description: "Places currently tracked." },
	{ title: "Audits", value: `${audits.length}`, description: "Submissions available for review." }
];

export default function AdminPage() {
	return (
		<div className="space-y-6">
			<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				{adminMetrics.map(metric => (
					<Card key={metric.title} className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
						<CardHeader>
							<CardDescription>{metric.title}</CardDescription>
							<CardTitle className="text-3xl">{metric.value}</CardTitle>
						</CardHeader>
						<CardContent className="text-sm text-slate-600">{metric.description}</CardContent>
					</Card>
				))}
			</section>

			<section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
				<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
					<CardHeader>
						<CardTitle>User management snapshot</CardTitle>
						<CardDescription>Admin sees all account states and roles at once.</CardDescription>
					</CardHeader>
					<CardContent className="overflow-x-auto">
						<table className="min-w-full text-left text-sm">
							<thead className="text-slate-500">
								<tr className="border-b border-slate-200">
									<th className="py-3 pr-4 font-medium">Name</th>
									<th className="py-3 pr-4 font-medium">Role</th>
									<th className="py-3 pr-4 font-medium">Organization</th>
									<th className="py-3 font-medium">Status</th>
								</tr>
							</thead>
							<tbody>
								{users.map(user => (
									<tr key={user.id} className="border-b border-slate-100 last:border-0">
										<td className="py-4 pr-4 font-medium text-slate-900">{user.name}</td>
										<td className="py-4 pr-4 text-slate-600">{user.role}</td>
										<td className="py-4 pr-4 text-slate-600">{user.organization}</td>
										<td className="py-4">
											<Badge
												variant="secondary"
												className={
													user.status === "Pending approval"
														? "rounded-full bg-amber-50 text-amber-700 hover:bg-amber-50"
														: "rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
												}>
												{user.status}
											</Badge>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</CardContent>
				</Card>

				<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
					<CardHeader>
						<CardTitle>Admin focus</CardTitle>
						<CardDescription>System-wide tools belong here, not in manager or auditor views.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3 text-sm leading-6 text-slate-600">
						<p>Review all users, projects, places, audits, and future export tools from one role.</p>
						<p>When backend support lands, this is where permissions, organizations, and platform settings should connect.</p>
					</CardContent>
				</Card>
			</section>
		</div>
	);
}
