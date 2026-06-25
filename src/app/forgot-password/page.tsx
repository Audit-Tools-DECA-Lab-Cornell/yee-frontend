"use client";

import Link from "next/link";
import * as React from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { requestPasswordReset } from "@/lib/auth/api";

export default function ForgotPasswordPage() {
	const [email, setEmail] = React.useState("");
	const [submitting, setSubmitting] = React.useState(false);
	const [message, setMessage] = React.useState<string | null>(null);
	const [error, setError] = React.useState<string | null>(null);

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSubmitting(true);
		setMessage(null);
		setError(null);

		try {
			const result = await requestPasswordReset(email);
			setMessage(result.message);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not send a reset link. Please try again.");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<AuthShell>
			<div className="space-y-6">
				<div className="space-y-1.5">
					<h2 className="text-2xl font-semibold tracking-tight text-foreground">Forgot your password?</h2>
					<p className="text-sm text-muted-foreground leading-relaxed">
						Enter the email tied to your account and we&apos;ll send a reset link if that account exists.
					</p>
				</div>

				{message ? (
					<div
						className="rounded-md border border-[var(--yee-green-200)] bg-[var(--yee-green-50)] px-4 py-3 text-sm text-[var(--yee-green-900)]"
						role="status"
						aria-live="polite">
						{message}
					</div>
				) : (
					<form className="space-y-4" onSubmit={handleSubmit} noValidate>
						<Field label="Email" htmlFor="email" required>
							<Input
								id="email"
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

						{error ? (
							<p
								role="alert"
								aria-live="polite"
								className="rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
								{error}
							</p>
						) : null}

						<Button type="submit" className="w-full" isLoading={submitting}>
							{submitting ? "Sending reset link..." : "Send reset link"}
						</Button>
					</form>
				)}

				<p className="text-sm text-muted-foreground">
					Remembered it?{" "}
					<Link href="/login" className="font-medium text-primary hover:text-primary/80 transition-colors">
						Back to sign in
					</Link>
				</p>
			</div>
		</AuthShell>
	);
}
