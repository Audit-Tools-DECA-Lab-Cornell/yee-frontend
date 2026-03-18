import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { audits } from "@/lib/dashboard/mock-data";

export default function AuditsPage() {
	return (
		<div className="space-y-6">
			<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
				<CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div>
						<CardTitle className="text-2xl">Audits</CardTitle>
						<CardDescription className="mt-2 max-w-2xl leading-6">
							Submitted audits can eventually support filters, scoring status, and reviewer comments.
						</CardDescription>
					</div>
					<Button asChild className="rounded-2xl bg-[#10231f] text-white hover:bg-[#17302c]">
						<Link href="/yee/audit/place-central-park">Start Audit</Link>
					</Button>
				</CardHeader>
				<CardContent className="overflow-x-auto">
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
										<Badge
											variant="secondary"
											className={
												audit.status === "Draft"
													? "rounded-full bg-slate-100 text-slate-700 hover:bg-slate-100"
													: audit.status === "Validated"
														? "rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
														: "rounded-full bg-sky-50 text-sky-700 hover:bg-sky-50"
											}>
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
