"use client";

import Link from "next/link";
import * as React from "react";
import { CheckCircle2 } from "lucide-react";

import { useAuth } from "@/features/auth/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardHero } from "@/components/ui/dashboard-hero";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createAuditorInvite, type AuditorInviteRecord } from "@/features/workspaces/api/live-api";
import { formatDateTime } from "@/lib/format";

export default function InviteAuditorPage() {
	const { session } = useAuth();
	const [email, setEmail] = React.useState("");
	const [saving, setSaving] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);
	const [invite, setInvite] = React.useState<AuditorInviteRecord | null>(null);

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!session) {
			setError("Your session has expired. Please sign in again.");
			return;
		}
		setSaving(true);
		setError(null);
		try {
			const result = await createAuditorInvite(session, { email });
			setInvite(result);
			setEmail("");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not create invite. Please try again.");
		} finally {
			setSaving(false);
		}
	}

	return (
		<div className="space-y-6">
			<DashboardHero
				size="compact"
				badge="Auditors"
				title="Invite an auditor"
				subtitle="Create an invite link for a fieldworker. They will receive a link to set up their auditor account and join your organization."
			/>
			<Card>
				<CardContent className="space-y-6 pt-6">
					<form className="space-y-4" onSubmit={handleSubmit} noValidate>
						<Field label="Auditor email" htmlFor="invite-email" required>
							<Input
								id="invite-email"
								name="email"
								type="email"
								autoComplete="off"
								spellCheck={false}
								placeholder="fieldworker@example.com"
								value={email}
								onChange={event => setEmail(event.target.value)}
								required
							/>
						</Field>

						{error ? (
							<p
								role="alert"
								aria-live="polite"
								className="rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
								{error}
							</p>
						) : null}

						<div className="flex flex-wrap gap-3">
							<Button type="submit" isLoading={saving}>
								{saving ? "Creating invite..." : "Create invite"}
							</Button>
							<Button asChild variant="outline">
								<Link href="/manager/auditors">Back to auditors</Link>
							</Button>
						</div>
					</form>

					{invite ? (
						<div
							className="rounded-md border border-[var(--yee-green-200)] bg-[var(--yee-green-50)] p-5 text-sm space-y-3"
							role="status"
							aria-live="polite">
							<div className="flex items-center gap-2 text-[var(--yee-green-900)]">
								<CheckCircle2 className="size-4" aria-hidden="true" />
								<p className="font-semibold">Invite created for {invite.email}</p>
							</div>
							<p className="text-muted-foreground">Copy and share this link with the invited auditor:</p>
							<p className="break-all rounded-md border border-border bg-card px-4 py-3 font-mono text-xs text-foreground">
								{invite.invite_url}
							</p>
							<p className="text-xs text-muted-foreground">
								Expires at: {formatDateTime(invite.expires_at)}
							</p>
						</div>
					) : null}
				</CardContent>
			</Card>
		</div>
	);
}
