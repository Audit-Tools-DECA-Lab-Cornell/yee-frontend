"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { AuthShell } from "@/components/auth/auth-shell";
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
	const [accountType, setAccountType] = React.useState<"AUDITOR" | "MANAGER">("AUDITOR");
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
			await signup({
				name,
				email,
				password,
				account_type: accountType
			});
			router.push(`/verify-email?email=${encodeURIComponent(email)}`);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Signup failed.");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<AuthShell
			eyebrow="New Account"
			title="Create an account before joining projects or fieldwork."
			description="Signup now reflects the real app idea from your notes: managers and auditors share one frontend, but their path after signup depends on approval and profile state.">
			<div className="space-y-6">
				<div>
					<Badge className="rounded-full bg-sky-50 px-3 py-1 text-sky-700 hover:bg-sky-50">Shared frontend repo</Badge>
					<h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">Sign up</h2>
					<p className="mt-2 text-sm leading-6 text-slate-600">
						This is now connected to backend signup for YEE accounts.
					</p>
				</div>

				<form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
					<div className="space-y-2 sm:col-span-2">
						<Label htmlFor="name">Full name</Label>
						<Input id="name" placeholder="Andisha Safdariyan" value={name} onChange={event => setName(event.target.value)} required />
					</div>
					<div className="space-y-2 sm:col-span-2">
						<Label htmlFor="signup-email">Email</Label>
						<Input
							id="signup-email"
							type="email"
							placeholder="name@university.edu"
							value={email}
							onChange={event => setEmail(event.target.value)}
							required
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="password">Password</Label>
						<Input
							id="password"
							type="password"
							placeholder="Create a password"
							value={password}
							onChange={event => setPassword(event.target.value)}
							required
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="role">Account type</Label>
						<select
							id="role"
							value={accountType}
							onChange={event => setAccountType(event.target.value as "AUDITOR" | "MANAGER")}
							className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none">
							<option value="AUDITOR">Auditor</option>
							<option value="MANAGER">Manager</option>
						</select>
					</div>
					{error ? <p className="sm:col-span-2 text-sm text-rose-600">{error}</p> : null}
					<div className="sm:col-span-2">
						<Button type="submit" className="w-full rounded-2xl bg-[#10231f] text-white hover:bg-[#17302c]" disabled={submitting}>
							{submitting ? "Creating account..." : "Create account"}
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
	);
}
