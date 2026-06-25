"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { Mail, MailCheck, AlertCircle } from "lucide-react";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { resendVerification, verifyEmail } from "@/lib/auth/api";

export function VerifyEmailScreen({ token, email }: { token?: string; email?: string }) {
	const router = useRouter();
	const [status, setStatus] = React.useState<"idle" | "verifying" | "success" | "error">(
		token ? "verifying" : "idle"
	);
	const [message, setMessage] = React.useState<string | null>(null);
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

	React.useEffect(() => {
		if (status !== "success") return;

		const params = new URLSearchParams();
		params.set("verified", "1");
		if (email) {
			params.set("email", email);
		}

		const timeout = window.setTimeout(() => {
			router.replace(`/login?${params.toString()}`);
		}, 1500);

		return () => window.clearTimeout(timeout);
	}, [email, router, status]);

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

	const statusIcon = status === "success" ? MailCheck : status === "error" ? AlertCircle : Mail;

	const StatusIcon = statusIcon;
	const iconColor =
		status === "success"
			? "text-[var(--yee-green-900)] bg-[var(--yee-green-100)]"
			: status === "error"
				? "text-destructive bg-destructive/10"
				: "text-muted-foreground bg-muted";

	const statusDescription =
		status === "success"
			? "Your email is verified. Redirecting you to sign in..."
			: status === "error"
				? "The verification link may be invalid or expired. You can request a new one below."
				: "Open the link in the email we sent you. If you don\u2019t see it, check your spam folder.";

	const defaultMessage =
		token && status === "verifying"
			? "Verifying your email address..."
			: "Check your inbox for the verification link.";

	return (
		<AuthShell>
			<div className="space-y-6">
				<div className={`flex size-12 items-center justify-center rounded-md ${iconColor}`}>
					<StatusIcon className="size-6" aria-hidden="true" />
				</div>

				<div className="space-y-1.5">
					<h2 className="text-2xl font-semibold tracking-tight text-foreground">
						{status === "success"
							? "Email verified"
							: status === "error"
								? "Verification failed"
								: "Check your inbox"}
					</h2>
					<p className="text-sm text-muted-foreground leading-relaxed">{message ?? defaultMessage}</p>
				</div>

				<div
					aria-live="polite"
					className="rounded-md border border-border bg-muted/50 px-4 py-4 text-sm leading-relaxed text-muted-foreground">
					{statusDescription}
				</div>

				<div className="flex flex-wrap gap-3">
					<Button onClick={() => router.push("/login")}>
						{status === "success" ? "Continue to sign in" : "Back to sign in"}
					</Button>
					{status !== "success" ? (
						<Button variant="outline" onClick={handleResend} isLoading={resending} disabled={!email}>
							{resending ? "Resending..." : "Resend verification email"}
						</Button>
					) : null}
				</div>

				{email ? (
					<p className="text-xs text-muted-foreground">
						Sent to <span className="font-medium text-foreground">{email}</span>
					</p>
				) : null}
			</div>
		</AuthShell>
	);
}
