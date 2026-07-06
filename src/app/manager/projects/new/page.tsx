"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { useAuth } from "@/features/auth/components/auth-provider";
import {
	buildProjectProfilePayload,
	ProjectProfileForm,
	type ProjectProfileFormValues
} from "@/features/manager/components/project-profile-form";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardHero } from "@/components/ui/dashboard-hero";
import { createProject } from "@/features/workspaces/api/live-api";

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
	auditorNotes: ""
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
			router.push(`/manager/projects/${project.id}`);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not create Project.");
		} finally {
			setSaving(false);
		}
	}

	return (
		<div className="space-y-6">
			<DashboardHero
				size="compact"
				badge="Projects"
				title="Create Project"
				subtitle="Create the Project profile first, then continue directly into that Project page to add Places and invite Auditors without leaving the setup flow."
			/>
			<Card className="rounded-md border-slate-200/80 bg-white shadow-sm">
				<CardContent className="pt-6">
					<ProjectProfileForm
						values={values}
						onChange={setValues}
						onSubmit={handleSubmit}
						saving={saving}
						error={error}
						submitLabel="Save Project"
						cancelHref="/manager/projects"
						cancelLabel="Back to Projects"
					/>
				</CardContent>
			</Card>
		</div>
	);
}
