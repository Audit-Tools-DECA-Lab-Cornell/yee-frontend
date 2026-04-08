"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { resendVerification, verifyEmail } from "@/lib/auth/api";

export function VerifyEmailScreen({ token, email }: { token?: string; email?: string }) {
	const router = useRouter();
	const [status, setStatus] = React.useState<"idle" | "verifying" | "success" | "error">(
		token ? "verifying" : "idle"
	);
	const [message, setMessage] = React.useState(
		token ? "Verifying your email now..." : "Check your inbox and open the verification link to continue."
	);
	const [resending, setResending] = React.useState(false);

	React.useEffect(() => {
		if (!token) return;

		let cancelled = false;
		const run = async () => {
			try {
				const result = await verifyEmail(token);
				if (!cancelled) {
					setStatus("success");
					setMessage(result.message);
				}
			} catch (err) {
				if (!cancelled) {
					setStatus("error");
					setMessage(err instanceof Error ? err.message : "Verification failed.");
				}
			}
		};

		void run();
		return () => {
			cancelled = true;
		};
	}, [token]);

	async function handleResend() {
		if (!email) return;
		setResending(true);
		try {
			const result = await resendVerification(email);
			setMessage(result.message);
		} catch (err) {
			setMessage(err instanceof Error ? err.message : "Could not resend verification email.");
		} finally {
			setResending(false);
		}
	}

	return (
		<AuthShell
			eyebrow="Email Verification"
			title="Verify the email before account access continues."
			description="This page now connects to the backend verification flow and guides users back into login once their email is confirmed.">
			<div className="space-y-6">
				<div>
					<Badge className="rounded-full bg-sky-50 px-3 py-1 text-sky-700 hover:bg-sky-50">Verification step</Badge>
					<h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">Check your inbox</h2>
					<p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>
				</div>
				<div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-600">
					{status === "success"
						? "Your email is verified. The next step is to log in so the backend can route you to approval, profile setup, or your dashboard."
						: status === "error"
							? "The verification link may be invalid or expired. You can request a new verification email below."
							: "If SMTP is not configured locally, the verification link may appear in the backend terminal logs."}
				</div>
				<div className="flex flex-wrap gap-3">
					<Button className="rounded-2xl bg-[#10231f] text-white hover:bg-[#17302c]" onClick={() => router.push("/login")}>
						Back to login
					</Button>
					<Button variant="outline" className="rounded-2xl" onClick={handleResend} disabled={!email || resending}>
						{resending ? "Resending..." : "Resend verification"}
					</Button>
					{email ? (
						<Link href={`/verify-email?email=${encodeURIComponent(email)}`} className="self-center text-sm text-slate-500">
							{email}
						</Link>
					) : null}
				</div>
			</div>
		</AuthShell>
	);
}
