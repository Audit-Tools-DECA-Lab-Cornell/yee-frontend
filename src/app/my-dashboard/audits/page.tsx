import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { audits } from "@/lib/dashboard/mock-data";

export default function MyAuditsPage() {
	return (
		<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
			<CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<CardTitle>My Audits</CardTitle>
					<CardDescription>Drafts, submitted work, and history for the current auditor only.</CardDescription>
				</div>
				<Button asChild variant="outline" className="rounded-2xl">
					<Link href="/yee/audit/place-central-park">Start another audit</Link>
				</Button>
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
						{audits.slice(0, 3).map(audit => (
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
	);
}
