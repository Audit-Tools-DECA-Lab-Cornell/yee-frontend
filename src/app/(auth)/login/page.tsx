"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { Suspense } from "react";

import { useAuth } from "@/features/auth/components/auth-provider";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { PasswordField } from "@/features/auth/components/password-field";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getRouteForUser } from "@/features/auth/session";

function LoginPageInner() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { login, session, loading } = useAuth();

	const prefilledEmail = searchParams.get("email") ?? "";
	const verified = searchParams.get("verified") === "1";

	const [email, setEmail] = React.useState(prefilledEmail);
	const [password, setPassword] = React.useState("");
	const [submitting, setSubmitting] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);

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
			setError(err instanceof Error ? err.message : "Sign in failed. Please check your credentials.");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<AuthShell>
			<div className="space-y-6">
				<div className="space-y-1.5">
					<h2 className="text-2xl font-semibold tracking-tight text-foreground">Sign in to your account</h2>
					<p className="text-sm text-muted-foreground">Enter your YEE account credentials to continue.</p>
				</div>

				{verified ? (
					<div
						className="rounded-md border border-(--yee-green-200) bg-(--yee-green-50) px-4 py-3 text-sm text-(--yee-green-900)"
						role="status">
						Email verified. Sign in to continue to your account setup.
					</div>
				) : null}

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

					<Field label="Password" htmlFor="password" required>
						<PasswordField
							id="password"
							placeholder="••••••••"
							value={password}
							onChange={setPassword}
							required
							autoComplete="current-password"
						/>
					</Field>

					<div className="flex justify-end">
						<Link
							href="/forgot-password"
							className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
							Forgot password?
						</Link>
					</div>

					{error ? (
						<p
							role="alert"
							aria-live="polite"
							className="rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
							{error}
						</p>
					) : null}

					<Button type="submit" className="w-full" isLoading={submitting}>
						{submitting ? "Signing in..." : "Sign in"}
					</Button>
				</form>

				<p className="text-sm text-muted-foreground">
					Need an account?{" "}
					<Link href="/signup" className="font-medium text-primary hover:text-primary/80 transition-colors">
						Create one here
					</Link>
				</p>
			</div>
		</AuthShell>
	);
}

export default function LoginPage() {
	return (
		<Suspense fallback={null}>
			<LoginPageInner />
		</Suspense>
	);
}
