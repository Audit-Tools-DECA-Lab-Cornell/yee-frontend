"use client";

import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

import { useAuth } from "@/features/auth/components/auth-provider";
import {
	buildPlaceProfilePayload,
	PlaceProfileForm,
	type PlaceProfileFormValues
} from "@/features/manager/components/place-profile-form";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardHero } from "@/components/ui/dashboard-hero";
import { createPlace, fetchProjects, type ProjectRecord } from "@/features/workspaces/api/live-api";

const INITIAL_VALUES: PlaceProfileFormValues = {
	projectId: "",
	name: "",
	address: "",
	city: "",
	province: "",
	country: "",
	postalCode: "",
	placeType: "",
	otherPlaceType: "",
	startDate: "",
	endDate: "",
	estimatedAuditors: "",
	auditorPopulationTypes: [],
	otherAuditorPopulationType: "",
	auditorInclusionExclusionCriteria: "",
	auditorNotes: "",
	latitude: null,
	longitude: null
};

export default function NewPlacePage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { session } = useAuth();
	const [projects, setProjects] = React.useState<ProjectRecord[]>([]);
	const [values, setValues] = React.useState<PlaceProfileFormValues>(INITIAL_VALUES);
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
					const requestedProjectId = searchParams.get("projectId");
					const hasRequestedProject = rows.some(project => project.id === requestedProjectId);
					setValues(current => ({
						...current,
						projectId: hasRequestedProject ? (requestedProjectId ?? "") : (rows[0]?.id ?? "")
					}));
				}
			} catch (err) {
				if (!cancelled) {
					setError(err instanceof Error ? err.message : "Could not load Projects.");
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
	}, [searchParams, session]);

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!session) {
			setError("You need to log in again.");
			return;
		}
		setSaving(true);
		setError(null);
		try {
			await createPlace(session, buildPlaceProfilePayload(values));
			router.push("/manager/places");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not create Place.");
		} finally {
			setSaving(false);
		}
	}

	return (
		<div className="space-y-6">
			<DashboardHero
				size="compact"
				badge="Places"
				title="Add Place"
				subtitle="Add location details, place type, anticipated timing, and auditor setup for this place in your project."
			/>
			<Card className="rounded-md border-slate-200/80 bg-white shadow-sm">
				<CardContent className="pt-6">
					<PlaceProfileForm
						values={values}
						onChange={setValues}
						onSubmit={handleSubmit}
						projects={projects}
						loadingProjects={loadingProjects}
						saving={saving}
						error={error}
						submitLabel="Save Place"
						cancelHref="/manager/places"
						cancelLabel="Back to Places"
					/>
				</CardContent>
			</Card>
		</div>
	);
}
