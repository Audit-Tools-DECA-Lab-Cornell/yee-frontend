import { MailPlus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auditors } from "@/lib/dashboard/mock-data";

export default function AuditorsPage() {
	return (
		<div className="space-y-6">
			<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
				<CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div>
						<CardTitle className="text-2xl">Auditors</CardTitle>
						<CardDescription className="mt-2 max-w-2xl leading-6">
							Managers can invite auditors, track assignment coverage, and see who is ready for fieldwork.
						</CardDescription>
					</div>
					<Button className="rounded-2xl bg-[#10231f] text-white hover:bg-[#17302c]">
						<MailPlus className="size-4" />
						Invite Auditor
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
							{auditors.map(auditor => (
								<tr key={auditor.id} className="border-b border-slate-100 last:border-0">
									<td className="py-4 pr-4 font-medium text-slate-900">{auditor.name}</td>
									<td className="py-4 pr-4 text-slate-600">{auditor.assignedPlaces}</td>
									<td className="py-4 pr-4 text-slate-600">{auditor.completedAudits}</td>
									<td className="py-4">
										<Badge
											variant="secondary"
											className={
												auditor.status === "Pending approval"
													? "rounded-full bg-amber-50 text-amber-700 hover:bg-amber-50"
													: "rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
											}>
											{auditor.status}
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
