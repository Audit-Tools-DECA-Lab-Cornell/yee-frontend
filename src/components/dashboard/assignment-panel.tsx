"use client";

import * as React from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
	createAssignment,
	fetchAuditors,
	fetchPlaces,
	type AuditorRecord,
	type PlaceRecord
} from "@/lib/dashboard/live-api";

export function AssignmentPanel() {
	const { session } = useAuth();
	const [auditors, setAuditors] = React.useState<AuditorRecord[]>([]);
	const [places, setPlaces] = React.useState<PlaceRecord[]>([]);
	const [auditorId, setAuditorId] = React.useState("");
	const [placeId, setPlaceId] = React.useState("");
	const [loading, setLoading] = React.useState(true);
	const [saving, setSaving] = React.useState(false);
	const [message, setMessage] = React.useState<string | null>(null);
	const [error, setError] = React.useState<string | null>(null);

	React.useEffect(() => {
		if (!session) return;
		let cancelled = false;
		const run = async () => {
			try {
				const [auditorRows, placeRows] = await Promise.all([fetchAuditors(session), fetchPlaces(session)]);
				if (!cancelled) {
					setAuditors(auditorRows);
					setPlaces(placeRows);
					setAuditorId(auditorRows[0]?.id ?? "");
					setPlaceId(placeRows[0]?.id ?? "");
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
	}, [session]);

	async function handleAssign(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!session) return;
		setSaving(true);
		setError(null);
		setMessage(null);
		try {
			await createAssignment(session, { auditor_id: auditorId, place_id: placeId });
			setMessage("Assignment saved.");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not assign place.");
		} finally {
			setSaving(false);
		}
	}

	return (
		<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
			<CardHeader>
				<CardTitle>Assign Place</CardTitle>
				<CardDescription>Connect an invited auditor to a place in your account so it appears in their dashboard.</CardDescription>
			</CardHeader>
			<CardContent>
				{loading ? (
					<p className="text-sm text-slate-500">Loading assignment options...</p>
				) : (
					<form className="grid gap-4 md:grid-cols-2" onSubmit={handleAssign}>
						<div className="space-y-2">
							<Label htmlFor="assignment-auditor">Auditor</Label>
							<select
								id="assignment-auditor"
								value={auditorId}
								onChange={event => setAuditorId(event.target.value)}
								className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none">
								{auditors.map(auditor => (
									<option key={auditor.id} value={auditor.id}>
										{auditor.name}
									</option>
								))}
							</select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="assignment-place">Place</Label>
							<select
								id="assignment-place"
								value={placeId}
								onChange={event => setPlaceId(event.target.value)}
								className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none">
								{places.map(place => (
									<option key={place.id} value={place.id}>
										{place.name} ({place.project})
									</option>
								))}
							</select>
						</div>
						{error ? <p className="md:col-span-2 text-sm text-rose-600">{error}</p> : null}
						{message ? <p className="md:col-span-2 text-sm text-emerald-700">{message}</p> : null}
						<div className="md:col-span-2">
							<Button type="submit" className="rounded-2xl bg-[#10231f] text-white hover:bg-[#17302c]" disabled={saving || !auditorId || !placeId}>
								{saving ? "Assigning..." : "Assign place"}
							</Button>
						</div>
					</form>
				)}
			</CardContent>
		</Card>
	);
}
