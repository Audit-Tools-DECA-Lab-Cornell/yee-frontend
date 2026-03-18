import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NewProjectPage() {
	return (
		<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
			<CardHeader>
				<CardTitle className="text-2xl">Create Project</CardTitle>
				<CardDescription className="max-w-2xl leading-6">
					First manager CRUD entry point. This form is intentionally lightweight for now so the route exists and the action
					feels real.
				</CardDescription>
			</CardHeader>
			<CardContent className="grid gap-4 sm:grid-cols-2">
				<div className="space-y-2 sm:col-span-2">
					<Label htmlFor="project-name">Project name</Label>
					<Input id="project-name" placeholder="Healthy Streets" />
				</div>
				<div className="space-y-2">
					<Label htmlFor="project-owner">Project lead</Label>
					<Input id="project-owner" placeholder="Dr. Reyes" />
				</div>
				<div className="space-y-2">
					<Label htmlFor="project-timeline">Timeline</Label>
					<Input id="project-timeline" placeholder="Spring 2026" />
				</div>
				<div className="space-y-2 sm:col-span-2">
					<Label htmlFor="project-summary">Summary</Label>
					<Input id="project-summary" placeholder="Short project purpose and scope" />
				</div>
				<div className="mt-2 flex flex-wrap gap-3 sm:col-span-2">
					<Button className="rounded-2xl bg-[#10231f] text-white hover:bg-[#17302c]">Save project</Button>
					<Button asChild variant="outline" className="rounded-2xl">
						<Link href="/dashboard/projects">Back to projects</Link>
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
