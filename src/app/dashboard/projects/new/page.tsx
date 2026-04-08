"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createProject } from "@/lib/dashboard/live-api";

export default function NewProjectPage() {
	const router = useRouter();
	const { session } = useAuth();
	const [name, setName] = React.useState("");
	const [description, setDescription] = React.useState("");
	const [saving, setSaving] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!session) {
			setError("You need to log in again.");
			return;
		}
		setSaving(true);
		setError(null);
		try {
			await createProject(session, { name, description });
			router.push("/dashboard/projects");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not create project.");
		} finally {
			setSaving(false);
		}
	}

	return (
		<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
			<CardHeader>
				<CardTitle className="text-2xl">Create Project</CardTitle>
				<CardDescription className="max-w-2xl leading-6">
					This form now creates a real backend project inside the signed-in manager&apos;s account scope.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
					<div className="space-y-2 sm:col-span-2">
						<Label htmlFor="project-name">Project name</Label>
						<Input id="project-name" placeholder="Healthy Streets" value={name} onChange={event => setName(event.target.value)} required />
					</div>
					<div className="space-y-2 sm:col-span-2">
						<Label htmlFor="project-summary">Summary</Label>
						<Input
							id="project-summary"
							placeholder="Short project purpose and scope"
							value={description}
							onChange={event => setDescription(event.target.value)}
						/>
					</div>
					{error ? <p className="sm:col-span-2 text-sm text-rose-600">{error}</p> : null}
					<div className="mt-2 flex flex-wrap gap-3 sm:col-span-2">
						<Button type="submit" className="rounded-2xl bg-[#10231f] text-white hover:bg-[#17302c]" disabled={saving}>
							{saving ? "Saving..." : "Save project"}
						</Button>
						<Button asChild variant="outline" className="rounded-2xl">
							<Link href="/dashboard/projects">Back to projects</Link>
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}
