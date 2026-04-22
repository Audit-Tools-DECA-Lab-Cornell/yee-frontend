"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchPlaceDetail, fetchProjects, updatePlace, type ProjectRecord } from "@/lib/dashboard/live-api";

export default function EditPlacePage() {
	const params = useParams<{ placeId: string }>();
	const router = useRouter();
	const { session } = useAuth();
	const [projects, setProjects] = React.useState<ProjectRecord[]>([]);
	const [projectId, setProjectId] = React.useState("");
	const [name, setName] = React.useState("");
	const [address, setAddress] = React.useState("");
	const [postalCode, setPostalCode] = React.useState("");
	const [notes, setNotes] = React.useState("");
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
					setProjectId(place.project_id);
					setName(place.name);
					setAddress(place.address);
					setPostalCode(place.postal_code ?? "");
					setNotes(place.notes);
				}
			} catch (err) {
				if (!cancelled) setError(err instanceof Error ? err.message : "Could not load place.");
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
		if (!session) {
			setError("You need to log in again.");
			return;
		}
		setSaving(true);
		setError(null);
		try {
			await updatePlace(session, params.placeId, {
				project_id: projectId,
				name,
				address,
				postal_code: postalCode,
				notes
			});
			router.push(`/dashboard/places/${params.placeId}`);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not update place.");
		} finally {
			setSaving(false);
		}
	}

	return (
		<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
			<CardHeader>
				<CardTitle className="text-2xl">Edit Place</CardTitle>
				<CardDescription className="max-w-2xl leading-6">
					Update the place details, postal code, notes, and linked project for this place.
				</CardDescription>
			</CardHeader>
			<CardContent>
				{loading ? (
					<p className="text-sm text-slate-500">Loading place details...</p>
				) : (
					<form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
						<div className="space-y-2">
							<Label htmlFor="place-name">Place name</Label>
							<Input id="place-name" value={name} onChange={event => setName(event.target.value)} required />
						</div>
						<div className="space-y-2">
							<Label htmlFor="place-project">Project</Label>
							<select
								id="place-project"
								value={projectId}
								onChange={event => setProjectId(event.target.value)}
								className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none">
								{projects.map(project => (
									<option key={project.id} value={project.id}>
										{project.name}
									</option>
								))}
							</select>
						</div>
						<div className="space-y-2 sm:col-span-2">
							<Label htmlFor="place-address">Address or location</Label>
							<Input id="place-address" value={address} onChange={event => setAddress(event.target.value)} required />
						</div>
						<div className="space-y-2">
							<Label htmlFor="place-postal">Postal code</Label>
							<Input id="place-postal" value={postalCode} onChange={event => setPostalCode(event.target.value)} required />
						</div>
						<div className="space-y-2 sm:col-span-2">
							<Label htmlFor="place-notes">Notes</Label>
							<Input id="place-notes" value={notes} onChange={event => setNotes(event.target.value)} />
						</div>
						{error ? <p className="sm:col-span-2 text-sm text-rose-600">{error}</p> : null}
						<div className="mt-2 flex flex-wrap gap-3 sm:col-span-2">
							<Button type="submit" className="rounded-2xl bg-[#10231f] text-white hover:bg-[#17302c]" disabled={saving}>
								{saving ? "Saving..." : "Save changes"}
							</Button>
							<Button asChild variant="outline" className="rounded-2xl">
								<Link href={`/dashboard/places/${params.placeId}`}>Back to place</Link>
							</Button>
						</div>
					</form>
				)}
			</CardContent>
		</Card>
	);
}
