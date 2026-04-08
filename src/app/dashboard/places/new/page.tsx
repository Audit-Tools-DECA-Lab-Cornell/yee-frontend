"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPlace, fetchProjects, type ProjectRecord } from "@/lib/dashboard/live-api";

export default function NewPlacePage() {
	const router = useRouter();
	const { session } = useAuth();
	const [projects, setProjects] = React.useState<ProjectRecord[]>([]);
	const [projectId, setProjectId] = React.useState("");
	const [name, setName] = React.useState("");
	const [address, setAddress] = React.useState("");
	const [notes, setNotes] = React.useState("");
	const [loadingProjects, setLoadingProjects] = React.useState(true);
	const [saving, setSaving] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);

	React.useEffect(() => {
		if (!session) return;
		let cancelled = false;
		const run = async () => {
			try {
				const rows = await fetchProjects(session);
				if (!cancelled) {
					setProjects(rows);
					setProjectId(rows[0]?.id ?? "");
				}
			} catch (err) {
				if (!cancelled) {
					setError(err instanceof Error ? err.message : "Could not load projects.");
				}
			} finally {
				if (!cancelled) {
					setLoadingProjects(false);
				}
			}
		};
		void run();
		return () => {
			cancelled = true;
		};
	}, [session]);

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!session) {
			setError("You need to log in again.");
			return;
		}
		setSaving(true);
		setError(null);
		try {
			await createPlace(session, { project_id: projectId, name, address, notes });
			router.push("/dashboard/places");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not create place.");
		} finally {
			setSaving(false);
		}
	}

	return (
		<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
			<CardHeader>
				<CardTitle className="text-2xl">Add Place</CardTitle>
				<CardDescription className="max-w-2xl leading-6">
					This form now creates a real backend place under one of the manager&apos;s scoped projects.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
					<div className="space-y-2">
						<Label htmlFor="place-name">Place name</Label>
						<Input id="place-name" placeholder="Central Park Playground" value={name} onChange={event => setName(event.target.value)} required />
					</div>
					<div className="space-y-2">
						<Label htmlFor="place-project">Project</Label>
						<select
							id="place-project"
							value={projectId}
							onChange={event => setProjectId(event.target.value)}
							disabled={loadingProjects || projects.length === 0}
							className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none">
							{projects.length === 0 ? <option value="">No projects available</option> : null}
							{projects.map(project => (
								<option key={project.id} value={project.id}>
									{project.name}
								</option>
							))}
						</select>
					</div>
					<div className="space-y-2 sm:col-span-2">
						<Label htmlFor="place-location">Address or location</Label>
						<Input id="place-location" placeholder="New York, NY" value={address} onChange={event => setAddress(event.target.value)} required />
					</div>
					<div className="space-y-2 sm:col-span-2">
						<Label htmlFor="place-notes">Notes</Label>
						<Input id="place-notes" placeholder="Optional notes or place type" value={notes} onChange={event => setNotes(event.target.value)} />
					</div>
					{error ? <p className="sm:col-span-2 text-sm text-rose-600">{error}</p> : null}
					<div className="mt-2 flex flex-wrap gap-3 sm:col-span-2">
						<Button
							type="submit"
							className="rounded-2xl bg-[#10231f] text-white hover:bg-[#17302c]"
							disabled={saving || loadingProjects || projects.length === 0}>
							{saving ? "Saving..." : "Save place"}
						</Button>
						<Button asChild variant="outline" className="rounded-2xl">
							<Link href="/dashboard/places">Back to places</Link>
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}
