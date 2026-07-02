"use client";

import { useParams, useRouter } from "next/navigation";
import * as React from "react";

import { useAuth } from "@/features/auth/components/auth-provider";
import {
	buildPlaceProfilePayload,
	derivePlaceProfileFormValues,
	PlaceProfileForm,
	type PlaceProfileFormValues
} from "@/features/manager/components/place-profile-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchPlaceDetail, fetchProjects, updatePlace, type ProjectRecord } from "@/features/workspaces/api/live-api";

export default function EditPlacePage() {
	const params = useParams<{ placeId: string }>();
	const router = useRouter();
	const { session } = useAuth();
	const [projects, setProjects] = React.useState<ProjectRecord[]>([]);
	const [values, setValues] = React.useState<PlaceProfileFormValues | null>(null);
	const [loading, setLoading] = React.useState(true);
	const [saving, setSaving] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);

	React.useEffect(() => {
		if (!session) return;
		let cancelled = false;
		const run = async () => {
			try {
				const [place, projectRows] = await Promise.all([
					fetchPlaceDetail(session, params.placeId),
					fetchProjects(session)
				]);
				if (!cancelled) {
					setProjects(projectRows);
					setValues(derivePlaceProfileFormValues(place));
				}
			} catch (err) {
				if (!cancelled) setError(err instanceof Error ? err.message : "Could not load Place.");
			} finally {
				if (!cancelled) setLoading(false);
			}
		};
		void run();
		return () => {
			cancelled = true;
		};
	}, [params.placeId, session]);

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!session || !values) {
			setError("You need to log in again.");
			return;
		}
		setSaving(true);
		setError(null);
		try {
			await updatePlace(session, params.placeId, buildPlaceProfilePayload(values));
			router.push(`/manager/places/${params.placeId}`);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not update Place.");
		} finally {
			setSaving(false);
		}
	}

	return (
		<Card className="rounded-lg border-slate-200/80 bg-white shadow-sm">
			<CardHeader>
				<CardTitle className="text-2xl">Edit Place</CardTitle>
				<CardDescription className="max-w-3xl leading-6">
					Update the Place profile, detailed location, anticipated timing, and Auditor setup information
					without leaving the manager workflow.
				</CardDescription>
			</CardHeader>
			<CardContent>
				{loading || !values ? (
					<p className="text-sm text-slate-500">Loading Place details...</p>
				) : (
					<PlaceProfileForm
						values={values}
						onChange={setValues}
						onSubmit={handleSubmit}
						projects={projects}
						loadingProjects={loading}
						saving={saving}
						error={error}
						submitLabel="Save Place"
						cancelHref={`/manager/places/${params.placeId}`}
						cancelLabel="Back to Place"
					/>
				)}
			</CardContent>
		</Card>
	);
}
