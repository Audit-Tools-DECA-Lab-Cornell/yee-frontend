"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { AuthShell } from "@/components/auth/auth-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getRouteForUser } from "@/lib/auth/session";

export default function CompleteProfilePage() {
	const router = useRouter();
	const { session, loading, completeProfile } = useAuth();
	const [name, setName] = React.useState("");
	const [submitting, setSubmitting] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);

	React.useEffect(() => {
		if (loading) return;
		if (!session) {
			router.replace("/login");
			return;
		}
		setName(session.user.name ?? "");
		if (session.user.next_step !== "COMPLETE_PROFILE") {
			router.replace(getRouteForUser(session.user));
		}
	}, [loading, router, session]);

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSubmitting(true);
		setError(null);

		try {
			const nextSession = await completeProfile(name);
			router.replace(getRouteForUser(nextSession.user));
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not complete profile.");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<AuthShell
			eyebrow="Profile Setup"
			title="Complete profile details before entering the dashboard."
			description="This step is now connected to backend onboarding state so profile completion changes the next route for the signed-in user.">
			<div className="space-y-6">
				<div>
					<Badge className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 hover:bg-emerald-50">
						Profile completion
					</Badge>
					<h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">Complete your profile</h2>
					<p className="mt-2 text-sm leading-6 text-slate-600">
						The backend currently requires a display name to finish onboarding. Additional profile fields can be layered in later.
					</p>
				</div>

				<form className="space-y-4" onSubmit={handleSubmit}>
					<div className="space-y-2">
						<Label htmlFor="name">Display name</Label>
						<Input id="name" placeholder="Andisha Safdariyan" value={name} onChange={event => setName(event.target.value)} required />
					</div>
					{error ? <p className="text-sm text-rose-600">{error}</p> : null}
					<div className="grid gap-3 sm:grid-cols-2">
						<Button type="submit" className="rounded-2xl bg-[#10231f] text-white hover:bg-[#17302c]" disabled={submitting}>
							{submitting ? "Saving..." : "Save and continue"}
						</Button>
						<Button asChild variant="outline" className="rounded-2xl">
							<Link href="/login">Back to login</Link>
						</Button>
					</div>
				</form>
			</div>
		</AuthShell>
	);
}
