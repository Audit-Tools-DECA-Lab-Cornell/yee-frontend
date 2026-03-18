import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { users } from "@/lib/dashboard/mock-data";

export default function AdminUsersPage() {
	return (
		<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
			<CardHeader>
				<CardTitle>Users</CardTitle>
				<CardDescription>All managers, auditors, and admins across the system.</CardDescription>
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
									<Badge variant="secondary" className="rounded-full bg-slate-100 text-slate-700 hover:bg-slate-100">
										{user.status}
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
