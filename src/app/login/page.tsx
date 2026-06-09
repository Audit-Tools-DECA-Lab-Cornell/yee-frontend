"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordField } from "@/components/auth/password-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getRouteForUser } from "@/lib/auth/session";

export default function LoginPage() {
	const router = useRouter();
	const { login, session, loading } = useAuth();
	const [email, setEmail] = React.useState("");
	const [password, setPassword] = React.useState("");
	const [submitting, setSubmitting] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);
	const [verified, setVerified] = React.useState(false);

	React.useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const prefilledEmail = params.get("email");
		if (prefilledEmail) {
			setEmail(prefilledEmail);
		}
		setVerified(params.get("verified") === "1");
	}, []);

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
			const nextSession = await login({ email, password });
			router.replace(getRouteForUser(nextSession.user));
		} catch (err) {
			setError(err instanceof Error ? err.message : "Login failed.");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<AuthShell
			eyebrow="Audit Tools Platform"
			title="Log in before entering the YEE workspace."
			description="The homepage now starts with authentication flow, and the survey is available only as one part of the product after routing through dashboard pages.">
			<div className="space-y-6">
				<div>
					<Badge className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 hover:bg-emerald-50">
						Step 1 of product flow
					</Badge>
					<h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">Log in</h2>
					<p className="mt-2 text-sm leading-6 text-slate-600">
						Use your verified YEE account to continue into the correct onboarding step or dashboard.
					</p>
				</div>

				<form className="space-y-4" onSubmit={handleSubmit}>
					{verified ? (
						<p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
							Email verified. Log in to continue to your next account setup step.
						</p>
					) : null}
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
					<div className="space-y-2">
						<Label htmlFor="password">Password</Label>
						<PasswordField id="password" placeholder="••••••••" value={password} onChange={setPassword} required />
					</div>
					<div className="flex justify-end">
						<Link href="/forgot-password" className="text-sm font-medium text-emerald-700 hover:text-emerald-800">
							Forgot password?
						</Link>
					</div>
					{error ? <p className="text-sm text-rose-600">{error}</p> : null}
					<Button type="submit" className="w-full rounded-2xl bg-[#10231f] text-white hover:bg-[#17302c]" disabled={submitting}>
						{submitting ? "Logging in..." : "Log in"}
					</Button>
				</form>

				<p className="text-sm text-slate-600">
					Need an account?{" "}
					<Link href="/signup" className="font-medium text-emerald-700 hover:text-emerald-800">
						Create one here
					</Link>
				</p>
			</div>
		</AuthShell>
	);
}
