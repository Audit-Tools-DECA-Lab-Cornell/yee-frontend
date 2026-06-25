"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { Suspense } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordField } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
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
      setError("Missing password reset token. Please use the link from your email.");
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
      setError(err instanceof Error ? err.message : "Could not reset password. The link may have expired.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell>
      <div className="space-y-6">
        <div className="space-y-1.5">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Set a new password
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Choose a password with at least eight characters. You&apos;ll be redirected to sign in once it&apos;s updated.
          </p>
        </div>

        {message ? (
          <div
            className="rounded-lg border border-[var(--yee-green-200)] bg-[var(--yee-green-50)] px-4 py-3 text-sm text-[var(--yee-green-900)]"
            role="status"
            aria-live="polite">
            {message} Redirecting to sign in\u2026
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <Field label="New password" htmlFor="password" required>
              <PasswordField
                id="password"
                placeholder="Create a new password"
                value={password}
                onChange={setPassword}
                required
                autoComplete="new-password"
              />
            </Field>

            <Field label="Confirm password" htmlFor="confirm-password" required>
              <PasswordField
                id="confirm-password"
                placeholder="Repeat your new password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                required
                autoComplete="new-password"
              />
            </Field>

            {error ? (
              <p
                role="alert"
                aria-live="polite"
                className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <Button type="submit" className="w-full" isLoading={submitting}>
              {submitting ? "Updating password\u2026" : "Update password"}
            </Button>
          </form>
        )}

        <p className="text-sm text-muted-foreground">
          Need another link?{" "}
          <Link
            href="/forgot-password"
            className="font-medium text-primary hover:text-primary/80 transition-colors">
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
