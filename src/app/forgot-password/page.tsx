"use client";

import Link from "next/link";
import * as React from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
			setError(err instanceof Error ? err.message : "Could not request password reset.");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<AuthShell
			eyebrow="Password Recovery"
			title="Reset your password without leaving the YEE login flow."
			description="Request a reset email for your YEE account, then come back with the secure link to choose a new password.">
			<div className="space-y-6">
				<div>
					<Badge className="rounded-full bg-amber-50 px-3 py-1 text-amber-700 hover:bg-amber-50">Account recovery</Badge>
					<h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">Forgot password</h2>
					<p className="mt-2 text-sm leading-6 text-slate-600">
						Enter the email tied to your account and we&apos;ll send a reset link if that account exists.
					</p>
				</div>

				<form className="space-y-4" onSubmit={handleSubmit}>
					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							type="email"
							placeholder="name@university.edu"
							value={email}
							onChange={event => setEmail(event.target.value)}
							required
						/>
					</div>
					{message ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p> : null}
					{error ? <p className="text-sm text-rose-600">{error}</p> : null}
					<Button type="submit" className="w-full rounded-2xl bg-[#10231f] text-white hover:bg-[#17302c]" disabled={submitting}>
						{submitting ? "Sending reset link..." : "Send reset link"}
					</Button>
				</form>

				<p className="text-sm text-slate-600">
					Remembered it?{" "}
					<Link href="/login" className="font-medium text-emerald-700 hover:text-emerald-800">
						Back to login
					</Link>
				</p>
			</div>
		</AuthShell>
	);
}
