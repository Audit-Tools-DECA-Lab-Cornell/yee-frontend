"use client";

import { useParams, useRouter } from "next/navigation";
import * as React from "react";

import { useAuth } from "@/components/auth/auth-provider";
import {
	buildProjectProfilePayload,
	deriveProjectProfileFormValues,
	ProjectProfileForm,
	type ProjectProfileFormValues
} from "@/components/dashboard/project-profile-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchProjectDetail, updateProject } from "@/lib/dashboard/live-api";

export default function EditProjectPage() {
	const params = useParams<{ projectId: string }>();
	const router = useRouter();
	const { session } = useAuth();
	const [values, setValues] = React.useState<ProjectProfileFormValues | null>(null);
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
					setValues(deriveProjectProfileFormValues(project));
				}
			} catch (err) {
				if (!cancelled) setError(err instanceof Error ? err.message : "Could not load Project.");
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
		if (!session || !values) {
			setError("You need to log in again.");
			return;
		}
		setSaving(true);
		setError(null);
		try {
			await updateProject(session, params.projectId, buildProjectProfilePayload(values));
			router.push(`/dashboard/projects/${params.projectId}`);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not update Project.");
		} finally {
			setSaving(false);
		}
	}

	return (
		<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
			<CardHeader>
				<CardTitle className="text-2xl">Edit Project</CardTitle>
				<CardDescription className="max-w-3xl leading-6">
					Update the Project profile, scope, and Auditor setup details without leaving the manager workflow.
				</CardDescription>
			</CardHeader>
			<CardContent>
				{loading || !values ? (
					<p className="text-sm text-slate-500">Loading Project details...</p>
				) : (
					<ProjectProfileForm
						values={values}
						onChange={setValues}
						onSubmit={handleSubmit}
						saving={saving}
						error={error}
						submitLabel="Save Project"
						cancelHref={`/dashboard/projects/${params.projectId}`}
						cancelLabel="Back to Project"
					/>
				)}
			</CardContent>
		</Card>
	);
}
