"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

import { useAuth } from "@/features/auth/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { FormSkeleton } from "@/components/ui/skeletons";
import {
	createAssignment,
	fetchAuditors,
	fetchPlaces,
	fetchProjects,
	type AuditorRecord,
	type PlaceRecord,
	type ProjectRecord
} from "@/features/workspaces/api/live-api";

export function AssignmentPanel({
	initialProjectId,
	initialPlaceId,
	compact = false,
	hideProjectSelector = false,
	title = "Assign Auditors to Places and Projects",
	description = "Choose a project, then assign one or more auditors to one or more places. Selecting every place in a project covers the whole project.",
	onAssigned
}: {
	initialProjectId?: string;
	initialPlaceId?: string;
	compact?: boolean;
	hideProjectSelector?: boolean;
	title?: string;
	description?: string;
	onAssigned?: () => void;
}) {
	const searchParams = useSearchParams();
	const { session } = useAuth();
	const [projects, setProjects] = React.useState<ProjectRecord[]>([]);
	const [auditors, setAuditors] = React.useState<AuditorRecord[]>([]);
	const [places, setPlaces] = React.useState<PlaceRecord[]>([]);
	const [projectId, setProjectId] = React.useState("");
	const [selectedAuditorIds, setSelectedAuditorIds] = React.useState<string[]>([]);
	const [selectedPlaceIds, setSelectedPlaceIds] = React.useState<string[]>([]);
	const [loading, setLoading] = React.useState(true);
	const [saving, setSaving] = React.useState(false);
	const [message, setMessage] = React.useState<string | null>(null);
	const [error, setError] = React.useState<string | null>(null);
	const requestedProjectId = initialProjectId ?? searchParams.get("projectId") ?? "";
	const requestedPlaceId = initialPlaceId ?? searchParams.get("placeId") ?? "";

	React.useEffect(() => {
		if (!session) return;
		let cancelled = false;
		const run = async () => {
			try {
				const [projectRows, auditorRows, placeRows] = await Promise.all([
					fetchProjects(session),
					fetchAuditors(session),
					fetchPlaces(session)
				]);
				if (!cancelled) {
					setProjects(projectRows);
					setAuditors(auditorRows);
					setPlaces(placeRows);
					const nextProjectId =
						projectRows.find(project => project.id === requestedProjectId)?.id ?? projectRows[0]?.id ?? "";
					setProjectId(nextProjectId);
				}
			} catch (err) {
				if (!cancelled) {
					setError(err instanceof Error ? err.message : "Could not load assignment data.");
				}
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		};
		void run();
		return () => {
			cancelled = true;
		};
	}, [requestedProjectId, session]);

	const visiblePlaces = React.useMemo(
		() => places.filter(place => place.project_id === projectId),
		[places, projectId]
	);
	const allAuditorsSelected =
		auditors.length > 0 && auditors.every(auditor => selectedAuditorIds.includes(auditor.id));

	// Pre-select the requested place during render (once it becomes visible)
	// instead of in an effect, avoiding a cascading re-render.
	const [appliedRequestedPlaceId, setAppliedRequestedPlaceId] = React.useState<string | null>(null);
	if (
		requestedPlaceId &&
		requestedPlaceId !== appliedRequestedPlaceId &&
		visiblePlaces.some(place => place.id === requestedPlaceId)
	) {
		setAppliedRequestedPlaceId(requestedPlaceId);
		setSelectedPlaceIds(current => (current.includes(requestedPlaceId) ? current : [...current, requestedPlaceId]));
	}

	const allVisibleSelected =
		visiblePlaces.length > 0 && visiblePlaces.every(place => selectedPlaceIds.includes(place.id));

	function toggleValue(values: string[], value: string) {
		return values.includes(value) ? values.filter(item => item !== value) : [...values, value];
	}

	function selectAllPlaces() {
		setSelectedPlaceIds(visiblePlaces.map(place => place.id));
	}

	function toggleSelectAllAuditors() {
		if (allAuditorsSelected) {
			setSelectedAuditorIds([]);
			return;
		}
		setSelectedAuditorIds(auditors.map(auditor => auditor.id));
	}

	function toggleSelectAllPlaces() {
		if (allVisibleSelected) {
			setSelectedPlaceIds(current => current.filter(id => !visiblePlaces.some(place => place.id === id)));
			return;
		}
		setSelectedPlaceIds(current => Array.from(new Set([...current, ...visiblePlaces.map(place => place.id)])));
	}

	async function handleAssign(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!session) return;
		setSaving(true);
		setError(null);
		setMessage(null);
		try {
			const result = await createAssignment(session, {
				project_id: projectId,
				auditor_ids: selectedAuditorIds,
				place_ids: selectedPlaceIds
			});
			setMessage(
				`Saved ${result.created_count} new assignments${result.existing_count ? `, skipped ${result.existing_count} existing` : ""}.`
			);
			onAssigned?.();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not save assignments.");
		} finally {
			setSaving(false);
		}
	}

	return (
		<Card className="rounded-md border border-slate-200/80 bg-white shadow-sm">
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent>
				{loading ? (
					<FormSkeleton rows={4} />
				) : (
					<form className="space-y-6" onSubmit={handleAssign}>
						{hideProjectSelector ? null : (
							<div className="space-y-2">
								<Label htmlFor="assignment-project">Project</Label>
								<select
									id="assignment-project"
									value={projectId}
									onChange={event => {
										setProjectId(event.target.value);
										setSelectedPlaceIds([]);
									}}
									className="flex h-9 w-full rounded-control border border-slate-200 bg-white px-3 text-sm shadow-xs outline-none">
									{projects.map(project => (
										<option key={project.id} value={project.id}>
											{project.name}
										</option>
									))}
								</select>
							</div>
						)}

						<div className={`grid gap-6 ${compact ? "" : "lg:grid-cols-2"}`}>
							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<Label>Auditors</Label>
									<div className="flex items-center gap-2">
										<p className="text-xs text-slate-500">{selectedAuditorIds.length} selected</p>
										<label className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700">
											<input
												type="checkbox"
												checked={allAuditorsSelected}
												onChange={toggleSelectAllAuditors}
											/>
											Select all
										</label>
									</div>
								</div>
								<div className="max-h-72 space-y-2 overflow-auto rounded-md border border-slate-200 p-3">
									{auditors.map(auditor => (
										<label
											key={auditor.id}
											className="flex cursor-pointer items-start gap-3 rounded-md border border-slate-100 p-3 hover:bg-slate-50">
											<input
												type="checkbox"
												checked={selectedAuditorIds.includes(auditor.id)}
												onChange={() =>
													setSelectedAuditorIds(current => toggleValue(current, auditor.id))
												}
												className="mt-1"
											/>
											<div>
												<p className="font-medium text-slate-900">{auditor.name}</p>
												<p className="text-xs text-slate-500">{auditor.auditor_id}</p>
												<p className="text-sm text-slate-600">
													{auditor.email || "No contact email"}
												</p>
											</div>
										</label>
									))}
								</div>
							</div>

							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<Label>Places</Label>
									<div className="flex items-center gap-2">
										<p className="text-xs text-slate-500">{selectedPlaceIds.length} selected</p>
										<label className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700">
											<input
												type="checkbox"
												checked={allVisibleSelected}
												onChange={toggleSelectAllPlaces}
											/>
											Select all
										</label>
										<Button type="button" variant="outline" size="sm" onClick={selectAllPlaces}>
											All places in project
										</Button>
									</div>
								</div>
								<div className="max-h-72 space-y-2 overflow-auto rounded-md border border-slate-200 p-3">
									{visiblePlaces.length === 0 ? (
										<p className="text-sm text-slate-500">No places found for this project yet.</p>
									) : (
										visiblePlaces.map(place => (
											<label
												key={place.id}
												className="flex cursor-pointer items-start gap-3 rounded-md border border-slate-100 p-3 hover:bg-slate-50">
												<input
													type="checkbox"
													checked={selectedPlaceIds.includes(place.id)}
													onChange={() =>
														setSelectedPlaceIds(current => toggleValue(current, place.id))
													}
													className="mt-1"
												/>
												<div>
													<p className="font-medium text-slate-900">{place.name}</p>
													<p className="text-sm text-slate-600">{place.address}</p>
													{place.postal_code ? (
														<p className="text-xs text-slate-500">
															Postal code: {place.postal_code}
														</p>
													) : null}
												</div>
											</label>
										))
									)}
								</div>
							</div>
						</div>

						{error ? <p className="text-sm text-rose-600">{error}</p> : null}
						{message ? <p className="text-sm text-emerald-700">{message}</p> : null}

						<Button
							type="submit"
							disabled={
								saving || !projectId || selectedAuditorIds.length === 0 || selectedPlaceIds.length === 0
							}>
							{saving ? "Saving assignments..." : "Save assignments"}
						</Button>
					</form>
				)}
			</CardContent>
		</Card>
	);
}
