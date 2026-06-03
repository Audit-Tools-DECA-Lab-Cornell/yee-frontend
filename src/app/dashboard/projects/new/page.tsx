"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { useAuth } from "@/components/auth/auth-provider";
import {
	buildProjectProfilePayload,
	ProjectProfileForm,
	type ProjectProfileFormValues,
} from "@/components/dashboard/project-profile-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createProject } from "@/lib/dashboard/live-api";

const INITIAL_VALUES: ProjectProfileFormValues = {
	name: "",
	description: "",
	placeTypes: [],
	otherPlaceType: "",
	startDate: "",
	endDate: "",
	estimatedPlaces: "",
	auditorPopulationTypes: [],
	otherAuditorPopulationType: "",
	auditorInclusionExclusionCriteria: "",
	auditorNotes: "",
};

export default function NewProjectPage() {
	const router = useRouter();
	const { session } = useAuth();
	const [values, setValues] = React.useState<ProjectProfileFormValues>(INITIAL_VALUES);
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
			const project = await createProject(session, buildProjectProfilePayload(values));
			router.push(`/dashboard/projects/${project.id}`);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not create Project.");
		} finally {
			setSaving(false);
		}
	}

	return (
		<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
			<CardHeader>
				<CardTitle className="text-2xl">Create Project</CardTitle>
				<CardDescription className="max-w-3xl leading-6">
					Create the Project profile first, then continue directly into that Project page to add Places and invite Auditors without leaving the setup flow.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<ProjectProfileForm
					values={values}
					onChange={setValues}
					onSubmit={handleSubmit}
					saving={saving}
					error={error}
					submitLabel="Save Project"
					cancelHref="/dashboard/projects"
					cancelLabel="Back to Projects"
				/>
			</CardContent>
		</Card>
	);
}
