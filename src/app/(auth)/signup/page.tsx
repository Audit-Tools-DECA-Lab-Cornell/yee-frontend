"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { useAuth } from "@/features/auth/components/auth-provider";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { PasswordField } from "@/features/auth/components/password-field";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getRouteForUser } from "@/features/auth/session";

export default function SignupPage() {
	const router = useRouter();
	const { signup, session, loading } = useAuth();
	const [name, setName] = React.useState("");
	const [email, setEmail] = React.useState("");
	const [password, setPassword] = React.useState("");
	const [organization, setOrganization] = React.useState("");
	const [submitting, setSubmitting] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);

	const [confirmOpen, setConfirmOpen] = React.useState(false);
	const [conflictMessage, setConflictMessage] = React.useState("");

	async function submitSignup(confirmNewOrganization: boolean) {
		await signup({
			name,
			email,
			password,
			organization,
			account_type: "MANAGER",
			confirm_new_organization: confirmNewOrganization || undefined
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
			 * specific message string. Preferred fix: a typed error code in the
			 * response body. Until the backend is updated, we match on the substring.
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
			<AuthShell>
				<div className="space-y-6">
					<div className="space-y-1.5">
						<h2 className="text-2xl font-semibold tracking-tight text-foreground">
							Create an organization account
						</h2>
						<p className="text-sm text-muted-foreground leading-relaxed">
							This signup is for the primary manager creating a new organization account. Auditors and
							additional managers join through manager-issued invites.
						</p>
					</div>

					<form className="space-y-4" onSubmit={handleSubmit} noValidate>
						<Field label="Full name" htmlFor="name" required>
							<Input
								id="name"
								name="name"
								type="text"
								autoComplete="name"
								placeholder="Andisha Safdariyan"
								value={name}
								onChange={event => setName(event.target.value)}
								required
							/>
						</Field>

						<Field label="Email" htmlFor="signup-email" required>
							<Input
								id="signup-email"
								name="email"
								type="email"
								autoComplete="email"
								spellCheck={false}
								placeholder="name@university.edu"
								value={email}
								onChange={event => setEmail(event.target.value)}
								required
							/>
						</Field>

						<Field
							label="Organization / Institution"
							htmlFor="organization"
							description="The research organization or university this account belongs to."
							required>
							<Input
								id="organization"
								name="organization"
								type="text"
								autoComplete="organization"
								placeholder="Youth Enabling Environments Collaborative"
								value={organization}
								onChange={event => setOrganization(event.target.value)}
								required
							/>
						</Field>

						<Field label="Password" htmlFor="password" required>
							<PasswordField
								id="password"
								placeholder="Create a strong password"
								value={password}
								onChange={setPassword}
								required
								autoComplete="new-password"
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

						<Button type="submit" className="w-full" isLoading={submitting}>
							{submitting ? "Creating account..." : "Create account"}
						</Button>
					</form>

					<p className="text-sm text-muted-foreground">
						Already have an account?{" "}
						<Link
							href="/login"
							className="font-medium text-primary hover:text-primary/80 transition-colors">
							Sign in
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
