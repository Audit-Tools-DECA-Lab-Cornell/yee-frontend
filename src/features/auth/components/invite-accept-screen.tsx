"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { useAuth } from "@/features/auth/components/auth-provider";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { PasswordField } from "@/features/auth/components/password-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { acceptInvite, getInvitePreview } from "@/features/auth/api";
import { getRouteForUser } from "@/features/auth/session";

export function InviteAcceptScreen({ token }: { token: string }) {
	const router = useRouter();
	const { adoptSession } = useAuth();
	const [email, setEmail] = React.useState("");
	const [organization, setOrganization] = React.useState<string | null>(null);
	const [loading, setLoading] = React.useState(true);
	const [name, setName] = React.useState("");
	const [password, setPassword] = React.useState("");
	const [saving, setSaving] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);

	React.useEffect(() => {
		let cancelled = false;
		const run = async () => {
			try {
				const preview = await getInvitePreview(token);
				if (!cancelled) {
					setEmail(preview.email);
					setOrganization(preview.organization);
				}
			} catch (err) {
				if (!cancelled) {
					setError(err instanceof Error ? err.message : "Invite could not be loaded.");
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
	}, [token]);

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSaving(true);
		setError(null);
		try {
			const session = await acceptInvite(token, { name, password });
			adoptSession(session);
			router.replace(getRouteForUser(session.user));
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not accept invite.");
		} finally {
			setSaving(false);
		}
	}

	return (
		<AuthShell>
			<div className="space-y-6">
				<div>
					<Badge className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 hover:bg-emerald-50">
						Invite token
					</Badge>
					<h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">Invitation received</h2>
					<p className="mt-2 text-sm leading-6 text-slate-600">
						{loading
							? "Loading invite details..."
							: email
								? `You were invited as ${email}.`
								: "Invite details unavailable."}
					</p>
				</div>
				<div className="rounded-md border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-600">
					Organization:{" "}
					<span className="font-medium text-slate-900">{organization ?? "Unknown workspace"}</span>
				</div>
				<form className="space-y-4" onSubmit={handleSubmit}>
					<div className="space-y-2">
						<Label htmlFor="invite-name">Full name</Label>
						<Input
							id="invite-name"
							value={name}
							onChange={event => setName(event.target.value)}
							placeholder="Your full name"
							required
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="invite-password">Password</Label>
						<PasswordField
							id="invite-password"
							value={password}
							onChange={setPassword}
							placeholder="Create a password"
							required
						/>
					</div>
					{error ? <p className="text-sm text-rose-600">{error}</p> : null}
					<div className="flex flex-wrap gap-3">
						<Button type="submit" disabled={loading || saving}>
							{saving ? "Accepting invite..." : "Accept invite"}
						</Button>
						<Button asChild variant="outline">
							<Link href="/login">Back to login</Link>
						</Button>
					</div>
				</form>
			</div>
		</AuthShell>
	);
}
