"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchProjectDetail, updateProject } from "@/lib/dashboard/live-api";

export default function EditProjectPage() {
	const params = useParams<{ projectId: string }>();
	const router = useRouter();
	const { session } = useAuth();
	const [name, setName] = React.useState("");
	const [description, setDescription] = React.useState("");
	const [loading, setLoading] = React.useState(true);
	const [saving, setSaving] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);

	React.useEffect(() => {
		if (!session) return;
		let cancelled = false;
		const run = async () => {
			try {
				const project = await fetchProjectDetail(session, params.projectId);
				if (!cancelled) {
					setName(project.name);
					setDescription(project.description);
				}
			} catch (err) {
				if (!cancelled) setError(err instanceof Error ? err.message : "Could not load project.");
			} finally {
				if (!cancelled) setLoading(false);
			}
		};
		void run();
		return () => {
			cancelled = true;
		};
	}, [params.projectId, session]);

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!session) {
			setError("You need to log in again.");
			return;
		}
		setSaving(true);
		setError(null);
		try {
			await updateProject(session, params.projectId, { name, description });
			router.push(`/dashboard/projects/${params.projectId}`);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not update project.");
		} finally {
			setSaving(false);
		}
	}

	return (
		<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
			<CardHeader>
				<CardTitle className="text-2xl">Edit Project</CardTitle>
				<CardDescription className="max-w-2xl leading-6">
					Update the project name and summary for this manager-scoped project.
				</CardDescription>
			</CardHeader>
			<CardContent>
				{loading ? (
					<p className="text-sm text-slate-500">Loading project details...</p>
				) : (
					<form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
						<div className="space-y-2 sm:col-span-2">
							<Label htmlFor="project-name">Project name</Label>
							<Input id="project-name" value={name} onChange={event => setName(event.target.value)} required />
						</div>
						<div className="space-y-2 sm:col-span-2">
							<Label htmlFor="project-summary">Summary</Label>
							<Input id="project-summary" value={description} onChange={event => setDescription(event.target.value)} />
						</div>
						{error ? <p className="sm:col-span-2 text-sm text-rose-600">{error}</p> : null}
						<div className="mt-2 flex flex-wrap gap-3 sm:col-span-2">
							<Button type="submit" className="rounded-2xl bg-[#10231f] text-white hover:bg-[#17302c]" disabled={saving}>
								{saving ? "Saving..." : "Save changes"}
							</Button>
							<Button asChild variant="outline" className="rounded-2xl">
								<Link href={`/dashboard/projects/${params.projectId}`}>Back to project</Link>
							</Button>
						</div>
					</form>
				)}
			</CardContent>
		</Card>
	);
}
