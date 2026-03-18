import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NewPlacePage() {
	return (
		<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
			<CardHeader>
				<CardTitle className="text-2xl">Add Place</CardTitle>
				<CardDescription className="max-w-2xl leading-6">
					Use this route to create a new place inside a project. It is set up as a placeholder manager action page for now.
				</CardDescription>
			</CardHeader>
			<CardContent className="grid gap-4 sm:grid-cols-2">
				<div className="space-y-2">
					<Label htmlFor="place-name">Place name</Label>
					<Input id="place-name" placeholder="Central Park Playground" />
				</div>
				<div className="space-y-2">
					<Label htmlFor="place-project">Project</Label>
					<Input id="place-project" placeholder="Healthy Streets" />
				</div>
				<div className="space-y-2">
					<Label htmlFor="place-type">Place type</Label>
					<Input id="place-type" placeholder="Playground" />
				</div>
				<div className="space-y-2">
					<Label htmlFor="place-location">Location</Label>
					<Input id="place-location" placeholder="New York, NY" />
				</div>
				<div className="mt-2 flex flex-wrap gap-3 sm:col-span-2">
					<Button className="rounded-2xl bg-[#10231f] text-white hover:bg-[#17302c]">Save place</Button>
					<Button asChild variant="outline" className="rounded-2xl">
						<Link href="/dashboard/places">Back to places</Link>
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
