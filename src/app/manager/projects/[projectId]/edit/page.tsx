"use client";

import { useParams, useRouter } from "next/navigation";
import * as React from "react";

import { useAuth } from "@/features/auth/components/auth-provider";
import {
	buildProjectProfilePayload,
	deriveProjectProfileFormValues,
	ProjectProfileForm,
	type ProjectProfileFormValues
} from "@/features/manager/components/project-profile-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormSkeleton } from "@/components/ui/skeletons";
import { fetchProjectDetail, updateProject } from "@/features/workspaces/api/live-api";

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
			router.push(`/manager/projects/${params.projectId}`);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not update Project.");
		} finally {
			setSaving(false);
		}
	}

	return (
		<Card className="rounded-md border-slate-200/80 bg-white shadow-sm">
			<CardHeader>
				<CardTitle className="text-2xl">Edit Project</CardTitle>
				<CardDescription className="max-w-3xl leading-6">
					Update the profile, scope, and auditor setup for this project.
				</CardDescription>
			</CardHeader>
			<CardContent>
				{loading || !values ? (
					<FormSkeleton />
				) : (
					<ProjectProfileForm
						values={values}
						onChange={setValues}
						onSubmit={handleSubmit}
						saving={saving}
						error={error}
						submitLabel="Save Project"
						cancelHref={`/manager/projects/${params.projectId}`}
						cancelLabel="Back to Project"
					/>
				)}
			</CardContent>
		</Card>
	);
}
