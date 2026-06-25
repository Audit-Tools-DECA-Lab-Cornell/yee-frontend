"use client";

import Link from "next/link";
import * as React from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	createManagerInvite,
	fetchManagerInvites,
	resendManagerInvite,
	revokeManagerInvite,
	type ManagerInviteRecord
} from "@/lib/dashboard/live-api";

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
			setError("You need to log in again.");
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
			setError(err instanceof Error ? err.message : "Could not create invite.");
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
			<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
				<CardHeader>
					<CardTitle className="text-2xl">Manager Invites</CardTitle>
					<CardDescription>
						Only the primary manager can invite additional managers into this organization.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Button asChild variant="outline" className="rounded-2xl">
						<Link href="/dashboard">Back to dashboard</Link>
					</Button>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
				<CardHeader>
					<CardTitle className="text-2xl">Invite New Manager</CardTitle>
					<CardDescription className="max-w-2xl leading-6">
						Invite an additional manager into your organization. They will join this same account and gain
						manager access after accepting.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<form className="space-y-4" onSubmit={handleSubmit}>
						<div className="space-y-2">
							<Label htmlFor="manager-invite-full-name">Manager full name</Label>
							<Input
								id="manager-invite-full-name"
								placeholder="Janet Loebach"
								value={fullName}
								onChange={event => setFullName(event.target.value)}
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="manager-invite-email">Manager email</Label>
							<Input
								id="manager-invite-email"
								type="email"
								placeholder="co-manager@example.com"
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
								<Link href="/dashboard">Back to dashboard</Link>
							</Button>
						</div>
					</form>

					{invite ? (
						<div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-sm leading-7 text-emerald-900">
							<p className="font-medium">Invite created for {invite.email}</p>
							<p className="mt-2">Share this link with the invited manager:</p>
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

			<Card className="rounded-[1.75rem] border-slate-200/80 bg-white shadow-sm">
				<CardHeader>
					<CardTitle className="text-2xl">Existing Manager Invites</CardTitle>
					<CardDescription>
						Track pending, accepted, and expired manager invitations for this organization.
					</CardDescription>
				</CardHeader>
				<CardContent className="overflow-x-auto">
					{loadingInvites ? (
						<p className="text-sm text-slate-600">Loading manager invites...</p>
					) : invites.length === 0 ? (
						<p className="text-sm text-slate-600">No manager invites yet.</p>
					) : (
						<table className="min-w-full text-left text-sm">
							<thead className="text-slate-500">
								<tr className="border-b border-slate-200">
									<th className="py-3 pr-4 font-medium">Email</th>
									<th className="py-3 pr-4 font-medium">Status</th>
									<th className="py-3 pr-4 font-medium">Created</th>
									<th className="py-3 pr-4 font-medium">Expires</th>
									<th className="py-3 font-medium">Actions</th>
								</tr>
							</thead>
							<tbody>
								{invites.map(row => (
									<tr key={row.id} className="border-b border-slate-100 last:border-0">
										<td className="py-4 pr-4 text-slate-900">{row.email}</td>
										<td className="py-4 pr-4 text-slate-600">{row.status}</td>
										<td className="py-4 pr-4 text-slate-600">
											{row.created_at ? new Date(row.created_at).toLocaleString() : "-"}
										</td>
										<td className="py-4 pr-4 text-slate-600">
											{new Date(row.expires_at).toLocaleString()}
										</td>
										<td className="py-4">
											<div className="flex flex-wrap gap-2">
												<Button
													type="button"
													variant="outline"
													className="rounded-2xl"
													disabled={actingInviteId === row.id || row.status === "ACCEPTED"}
													onClick={() => handleResend(row.id)}>
													{actingInviteId === row.id ? "Working..." : "Resend"}
												</Button>
												<Button
													type="button"
													variant="outline"
													className="rounded-2xl border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
													disabled={actingInviteId === row.id || row.status === "ACCEPTED"}
													onClick={() => handleRevoke(row.id)}>
													Revoke
												</Button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
