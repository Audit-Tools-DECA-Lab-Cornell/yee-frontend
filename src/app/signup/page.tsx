"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordField } from "@/components/auth/password-field";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getRouteForUser } from "@/lib/auth/session";

export default function SignupPage() {
	const router = useRouter();
	const { signup, session, loading } = useAuth();
	const [name, setName] = React.useState("");
	const [email, setEmail] = React.useState("");
	const [password, setPassword] = React.useState("");
	const [organization, setOrganization] = React.useState("");
	const [submitting, setSubmitting] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);

	// State for the "existing organization conflict" confirm dialog.
	const [confirmOpen, setConfirmOpen] = React.useState(false);
	const [conflictMessage, setConflictMessage] = React.useState("");

	async function submitSignup(confirmNewOrganization: boolean) {
		await signup({
			name,
			email,
			password,
			organization,
			account_type: "MANAGER",
			confirm_new_organization: confirmNewOrganization || undefined,
		});
	}

	React.useEffect(() => {
		if (!loading && session) {
			router.replace(getRouteForUser(session.user));
		}
	}, [loading, router, session]);

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSubmitting(true);
		setError(null);

		try {
			await submitSignup(false);
			router.push(`/verify-email?email=${encodeURIComponent(email)}`);
		} catch (err) {
			const message = err instanceof Error ? err.message : "Signup failed.";

			/*
			 * COUPLING NOTE: The backend signals an organization conflict via a
			 * specific message string. Preferred fix: a typed error code (e.g.
			 * { code: "NEW_ORG_CONFLICT" }) in the response body. Until the backend
			 * is updated, we match on the substring below.
			 *
			 * If the string match fails AND this is not a standard field-validation
			 * error, the full message is still surfaced to the user so nothing is
			 * silently lost.
			 */
			if (message.includes("Creating a new organization will remove you from that organization")) {
				setConflictMessage(message);
				setConfirmOpen(true);
				setSubmitting(false);
				return;
			}

			setError(message);
		} finally {
			setSubmitting(false);
		}
	}

	async function handleConfirmNewOrg() {
		setSubmitting(true);
		setError(null);
		try {
			await submitSignup(true);
			router.push(`/login?email=${encodeURIComponent(email)}`);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Signup failed.");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<>
		<AuthShell
			eyebrow="New Account"
			title="Create an account before joining projects or fieldwork."
			description="Signup now reflects the real app idea from your notes: managers and auditors share one frontend, but their path after signup depends on approval and profile state.">
			<div className="space-y-6">
				<div>
					<Badge className="rounded-full bg-sky-50 px-3 py-1 text-sky-700 hover:bg-sky-50">
						Shared frontend repo
					</Badge>
					<h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
						Create an organization account
					</h2>
					<p className="mt-2 text-sm leading-6 text-slate-600">
						This signup is for the primary manager who is creating a new organization account.
						Auditors and additional managers should join through manager-issued invites.
					</p>
					<p className="mt-2 text-sm leading-6 text-slate-500">
						If you were already invited as a secondary manager, the system will warn you before
						letting this signup create a separate organization.
					</p>
				</div>

				<form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
					<div className="space-y-2 sm:col-span-2">
						<Label htmlFor="name">Full name</Label>
						<Input
							id="name"
							placeholder="Andisha Safdariyan"
							value={name}
							onChange={(event) => setName(event.target.value)}
							required
						/>
					</div>
					<div className="space-y-2 sm:col-span-2">
						<Label htmlFor="signup-email">Email</Label>
						<Input
							id="signup-email"
							type="email"
							placeholder="name@university.edu"
							value={email}
							onChange={(event) => setEmail(event.target.value)}
							required
						/>
					</div>
					<div className="space-y-2 sm:col-span-2">
						<Label htmlFor="organization">Organization / Institution</Label>
						<Input
							id="organization"
							placeholder="Youth Enabling Environments Collaborative"
							value={organization}
							onChange={(event) => setOrganization(event.target.value)}
							required
						/>
					</div>
					<div className="space-y-2 sm:col-span-2">
						<Label htmlFor="password">Password</Label>
						<PasswordField
							id="password"
							placeholder="Create a password"
							value={password}
							onChange={setPassword}
							required
						/>
					</div>
					{error ? <p className="sm:col-span-2 text-sm text-rose-600">{error}</p> : null}
					<div className="sm:col-span-2">
						<Button
							type="submit"
							className="w-full rounded-2xl bg-[#10231f] text-white hover:bg-[#17302c]"
							disabled={submitting}>
							{submitting ? "Creating account\u2026" : "Create account"}
						</Button>
					</div>
				</form>

				<p className="text-sm text-slate-600">
					Already have an account?{" "}
					<Link href="/login" className="font-medium text-emerald-700 hover:text-emerald-800">
						Log in
					</Link>
				</p>
			</div>
		</AuthShell>
		<ConfirmDialog
			open={confirmOpen}
			onOpenChange={setConfirmOpen}
			title="Create a new organization?"
			description={conflictMessage}
			variant="default"
			confirmLabel="Yes, create new organization"
			cancelLabel="Cancel"
			onConfirm={handleConfirmNewOrg}
		/>
		</>
	);
}
