import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { places } from "@/lib/dashboard/mock-data";

export default function PlacesPage() {
	return (
		<div className="space-y-6">
			<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
				<CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div>
						<CardTitle className="text-2xl">Places</CardTitle>
						<CardDescription className="mt-2 max-w-2xl leading-6">
							Locations are grouped under projects and can later be connected to filters, detail pages, and assignment actions.
						</CardDescription>
					</div>
					<Button variant="outline" className="rounded-2xl">
						Add place
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
								<th className="py-3 font-medium">Status</th>
							</tr>
						</thead>
						<tbody>
							{places.map(place => (
								<tr key={place.id} className="border-b border-slate-100 last:border-0">
									<td className="py-4 pr-4 font-medium text-slate-900">{place.name}</td>
									<td className="py-4 pr-4 text-slate-600">{place.project}</td>
									<td className="py-4 pr-4 text-slate-600">{place.audits}</td>
									<td className="py-4 pr-4 text-slate-600">{place.lastAudit}</td>
									<td className="py-4">
										<Badge
											variant="secondary"
											className={
												place.status === "Needs review"
													? "rounded-full bg-amber-50 text-amber-700 hover:bg-amber-50"
													: place.status === "Scheduled"
														? "rounded-full bg-sky-50 text-sky-700 hover:bg-sky-50"
														: "rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
											}>
											{place.status}
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
