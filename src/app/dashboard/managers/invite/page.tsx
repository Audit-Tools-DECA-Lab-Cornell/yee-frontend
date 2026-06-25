"use client";

import Link from "next/link";
import * as React from "react";
import { CheckCircle2, MailPlus } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
	createManagerInvite,
	fetchManagerInvites,
	resendManagerInvite,
	revokeManagerInvite,
	type ManagerInviteRecord
} from "@/lib/dashboard/live-api";
import { formatDateTime } from "@/lib/format";

export default function InviteManagerPage() {
	const { session } = useAuth();
	const [fullName, setFullName] = React.useState("");
	const [email, setEmail] = React.useState("");
	const [saving, setSaving] = React.useState(false);
	const [loadingInvites, setLoadingInvites] = React.useState(true);
	const [error, setError] = React.useState<string | null>(null);
	const [invite, setInvite] = React.useState<ManagerInviteRecord | null>(null);
	const [invites, setInvites] = React.useState<ManagerInviteRecord[]>([]);
	const [actingInviteId, setActingInviteId] = React.useState<string | null>(null);

	const loadInvites = React.useCallback(async () => {
		if (!session) return;
		setLoadingInvites(true);
		try {
			const result = await fetchManagerInvites(session);
			setInvites(result);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not load manager invites.");
		} finally {
			setLoadingInvites(false);
		}
	}, [session]);

	React.useEffect(() => {
		void loadInvites();
	}, [loadInvites]);

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!session) {
			setError("Your session has expired. Please sign in again.");
			return;
		}
		setSaving(true);
		setError(null);
		try {
			const result = await createManagerInvite(session, { full_name: fullName, email });
			setInvite(result);
			setFullName("");
			setEmail("");
			await loadInvites();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not create invite. Please try again.");
		} finally {
			setSaving(false);
		}
	}

	async function handleResend(inviteId: string) {
		if (!session) return;
		setActingInviteId(inviteId);
		setError(null);
		try {
			const refreshed = await resendManagerInvite(session, inviteId);
			setInvite(previous => (previous?.id === inviteId ? { ...previous, ...refreshed } : previous));
			await loadInvites();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not resend invite.");
		} finally {
			setActingInviteId(null);
		}
	}

	async function handleRevoke(inviteId: string) {
		if (!session) return;
		setActingInviteId(inviteId);
		setError(null);
		try {
			await revokeManagerInvite(session, inviteId);
			setInvites(current => current.filter(row => row.id !== inviteId));
			if (invite?.id === inviteId) {
				setInvite(null);
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not revoke invite.");
		} finally {
			setActingInviteId(null);
		}
	}

	if (session && session.user.account_type === "MANAGER" && !session.user.is_primary_manager) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Manager Invites</CardTitle>
					<CardDescription>
						Only the primary manager can invite additional managers into this organization.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Button asChild variant="outline">
						<Link href="/dashboard">Back to dashboard</Link>
					</Button>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Invite a manager</CardTitle>
					<CardDescription className="max-w-2xl">
						Invite an additional manager into your organization. They will join this same account and gain
						manager access after accepting the invite and completing their profile.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<form className="space-y-4" onSubmit={handleSubmit} noValidate>
						<Field label="Manager full name" htmlFor="manager-invite-full-name" required>
							<Input
								id="manager-invite-full-name"
								name="name"
								type="text"
								autoComplete="name"
								placeholder="Janet Loebach"
								value={fullName}
								onChange={event => setFullName(event.target.value)}
								required
							/>
						</Field>

						<Field label="Manager email" htmlFor="manager-invite-email" required>
							<Input
								id="manager-invite-email"
								name="email"
								type="email"
								autoComplete="off"
								spellCheck={false}
								placeholder="co-manager@example.com"
								value={email}
								onChange={event => setEmail(event.target.value)}
								required
							/>
						</Field>

						{error ? (
							<p
								role="alert"
								aria-live="polite"
								className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
								{error}
							</p>
						) : null}

						<div className="flex flex-wrap gap-3">
							<Button type="submit" isLoading={saving}>
								{saving ? "Creating invite..." : "Create invite"}
							</Button>
							<Button asChild variant="outline">
								<Link href="/dashboard">Back to dashboard</Link>
							</Button>
						</div>
					</form>

					{invite ? (
						<div
							className="rounded-lg border border-[var(--yee-green-200)] bg-[var(--yee-green-50)] p-5 text-sm space-y-3"
							role="status"
							aria-live="polite">
							<div className="flex items-center gap-2 text-[var(--yee-green-900)]">
								<CheckCircle2 className="size-4" aria-hidden="true" />
								<p className="font-semibold">Invite created for {invite.email}</p>
							</div>
							<p className="text-muted-foreground">Copy and share this link with the invited manager:</p>
							<p className="break-all rounded-lg border border-border bg-card px-4 py-3 font-mono text-xs text-foreground">
								{invite.invite_url}
							</p>
							<p className="text-xs text-muted-foreground">
								Expires at: {formatDateTime(invite.expires_at)}
							</p>
						</div>
					) : null}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Existing manager invites</CardTitle>
					<CardDescription>
						Track pending, accepted, and expired manager invitations for this organization.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{loadingInvites ? (
						<div className="space-y-3">
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-4 w-3/4" />
						</div>
					) : invites.length === 0 ? (
						<EmptyState
							icon={MailPlus}
							title="No invites sent yet"
							description="Create an invite above to bring a co-manager into your organization."
						/>
					) : (
						<div className="overflow-x-auto rounded-lg border border-border">
							<table className="min-w-full text-left text-sm" aria-label="Manager invites">
								<caption className="sr-only">Manager invites: {invites.length} total</caption>
								<thead>
									<tr className="border-b border-border bg-muted/40">
										<th
											scope="col"
											className="py-3 pl-4 pr-4 text-xs font-medium text-muted-foreground">
											Email
										</th>
										<th scope="col" className="py-3 pr-4 text-xs font-medium text-muted-foreground">
											Status
										</th>
										<th scope="col" className="py-3 pr-4 text-xs font-medium text-muted-foreground">
											Created
										</th>
										<th scope="col" className="py-3 pr-4 text-xs font-medium text-muted-foreground">
											Expires
										</th>
										<th scope="col" className="py-3 pr-4 text-xs font-medium text-muted-foreground">
											Actions
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-border">
									{invites.map(row => (
										<tr key={row.id} className="hover:bg-muted/30 transition-colors">
											<td className="py-3 pl-4 pr-4 font-medium text-foreground">{row.email}</td>
											<td className="py-3 pr-4 text-muted-foreground">{row.status}</td>
											<td className="py-3 pr-4 text-muted-foreground tabular-nums">
												{row.created_at ? formatDateTime(row.created_at) : "\u2014"}
											</td>
											<td className="py-3 pr-4 text-muted-foreground tabular-nums">
												{formatDateTime(row.expires_at)}
											</td>
											<td className="py-3 pr-4">
												<div className="flex flex-wrap gap-2">
													<Button
														type="button"
														variant="outline"
														size="sm"
														isLoading={actingInviteId === row.id}
														disabled={
															actingInviteId === row.id || row.status === "ACCEPTED"
														}
														onClick={() => handleResend(row.id)}>
														{actingInviteId === row.id ? "Working..." : "Resend"}
													</Button>
													<Button
														type="button"
														variant="outline"
														size="sm"
														className="border-destructive/30 text-destructive hover:bg-destructive/5"
														disabled={
															actingInviteId === row.id || row.status === "ACCEPTED"
														}
														onClick={() => handleRevoke(row.id)}>
														Revoke
													</Button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
