"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { Suspense } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordField } from "@/components/auth/password-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/lib/auth/api";

function ResetPasswordPageInner() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get("token") ?? "";
	const [password, setPassword] = React.useState("");
	const [confirmPassword, setConfirmPassword] = React.useState("");
	const [submitting, setSubmitting] = React.useState(false);
	const [message, setMessage] = React.useState<string | null>(null);
	const [error, setError] = React.useState<string | null>(null);

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setMessage(null);
		setError(null);

		if (!token) {
			setError("Missing password reset token.");
			return;
		}
		if (password !== confirmPassword) {
			setError("Passwords do not match.");
			return;
		}

		setSubmitting(true);
		try {
			const result = await resetPassword(token, password);
			setMessage(result.message);
			window.setTimeout(() => {
				router.replace("/login");
			}, 1500);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not reset password.");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<AuthShell
			eyebrow="Password Recovery"
			title="Choose a new password and return to the YEE workspace."
			description="Use the secure reset link from your email to set a new password for your account.">
			<div className="space-y-6">
				<div>
					<Badge className="rounded-full bg-amber-50 px-3 py-1 text-amber-700 hover:bg-amber-50">Reset password</Badge>
					<h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">Set a new password</h2>
					<p className="mt-2 text-sm leading-6 text-slate-600">
						Choose a password with at least eight characters, then sign in again with the updated credentials.
					</p>
				</div>

				<form className="space-y-4" onSubmit={handleSubmit}>
					<div className="space-y-2">
						<Label htmlFor="password">New password</Label>
						<PasswordField id="password" placeholder="Create a new password" value={password} onChange={setPassword} required />
					</div>
					<div className="space-y-2">
						<Label htmlFor="confirm-password">Confirm password</Label>
						<PasswordField id="confirm-password" placeholder="Repeat your new password" value={confirmPassword} onChange={setConfirmPassword} required />
					</div>
					{message ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p> : null}
					{error ? <p className="text-sm text-rose-600">{error}</p> : null}
					<Button type="submit" className="w-full rounded-2xl bg-[#10231f] text-white hover:bg-[#17302c]" disabled={submitting}>
						{submitting ? "Updating password\u2026" : "Update password"}
					</Button>
				</form>

				<p className="text-sm text-slate-600">
					Need another link?{" "}
					<Link href="/forgot-password" className="font-medium text-emerald-700 hover:text-emerald-800">
						Request a new reset email
					</Link>
				</p>
			</div>
		</AuthShell>
		);
}

export default function ResetPasswordPage() {
	return (
		<Suspense fallback={null}>
			<ResetPasswordPageInner />
		</Suspense>
	);
}
