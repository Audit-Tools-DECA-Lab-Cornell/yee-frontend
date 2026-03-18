import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { places } from "@/lib/dashboard/mock-data";

export default function MyPlacesPage() {
	return (
		<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
			<CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<CardTitle>My Places</CardTitle>
					<CardDescription>Auditor-scoped place list with direct start-audit access.</CardDescription>
				</div>
				<Button asChild className="rounded-2xl bg-[#10231f] text-white hover:bg-[#17302c]">
					<Link href="/yee/audit/place-central-park">Start Audit</Link>
				</Button>
			</CardHeader>
			<CardContent className="space-y-3">
				{places.slice(0, 3).map(place => (
					<div key={place.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<p className="font-medium text-slate-900">{place.name}</p>
							<p className="mt-1 text-sm text-slate-600">{place.project}</p>
						</div>
						<Button asChild variant="outline" className="rounded-2xl">
							<Link href={`/yee/audit/${place.id}`}>Open Audit</Link>
						</Button>
					</div>
				))}
			</CardContent>
		</Card>
	);
}
