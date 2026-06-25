"use client";

import Link from "next/link";
import * as React from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAuditorInvite, type AuditorInviteRecord } from "@/lib/dashboard/live-api";

export default function InviteAuditorPage() {
	const { session } = useAuth();
	const [email, setEmail] = React.useState("");
	const [saving, setSaving] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);
	const [invite, setInvite] = React.useState<AuditorInviteRecord | null>(null);

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!session) {
			setError("You need to log in again.");
			return;
		}
		setSaving(true);
		setError(null);
		try {
			const result = await createAuditorInvite(session, { email });
			setInvite(result);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not create invite.");
		} finally {
			setSaving(false);
		}
	}

	return (
		<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
			<CardHeader>
				<CardTitle className="text-2xl">Invite New Auditor</CardTitle>
				<CardDescription className="max-w-2xl leading-6">
					Create a real auditor invite link tied to your manager account workspace.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<form className="space-y-4" onSubmit={handleSubmit}>
					<div className="space-y-2">
						<Label htmlFor="invite-email">Auditor email</Label>
						<Input
							id="invite-email"
							type="email"
							placeholder="fieldworker@example.com"
							value={email}
							onChange={event => setEmail(event.target.value)}
							required
						/>
					</div>
					{error ? <p className="text-sm text-rose-600">{error}</p> : null}
					<div className="flex flex-wrap gap-3">
						<Button
							type="submit"
							className="rounded-2xl bg-[#10231f] text-white hover:bg-[#17302c]"
							disabled={saving}>
							{saving ? "Creating invite..." : "Create invite"}
						</Button>
						<Button asChild variant="outline" className="rounded-2xl">
							<Link href="/dashboard/auditors">Back to auditors</Link>
						</Button>
					</div>
				</form>

				{invite ? (
					<div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-sm leading-7 text-emerald-900">
						<p className="font-medium">Invite created for {invite.email}</p>
						<p className="mt-2">Share this link with the invited auditor:</p>
						<p className="mt-2 break-all rounded-2xl bg-white px-4 py-3 font-mono text-xs text-slate-700">
							{invite.invite_url}
						</p>
						<p className="mt-2 text-emerald-800">
							Expires at: {new Date(invite.expires_at).toLocaleString()}
						</p>
					</div>
				) : null}
			</CardContent>
		</Card>
	);
}
