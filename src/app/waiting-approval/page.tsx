"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Clock } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { getRouteForUser } from "@/lib/auth/session";

export default function WaitingApprovalPage() {
  const router = useRouter();
  const { session, loading, refreshSession, logout } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  React.useEffect(() => {
    if (loading) return;
    if (!session) {
      router.replace("/login");
      return;
    }
    if (session.user.next_step !== "WAITING_APPROVAL") {
      router.replace(getRouteForUser(session.user));
    }
  }, [loading, router, session]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const nextSession = await refreshSession();
      if (nextSession) {
        router.replace(getRouteForUser(nextSession.user));
      }
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <AuthShell>
      <div className="space-y-6">
        <div className="flex size-12 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
          <Clock className="size-6" aria-hidden="true" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Waiting for approval
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your account is awaiting approval from a manager. You&apos;ll be notified
            by email when access is granted, and you can also check the status below.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-muted/50 px-4 py-4 text-sm text-muted-foreground">
          <span>Signed in as</span>{" "}
          <span className="font-medium text-foreground">
            {session?.user.email ?? "Not signed in"}
          </span>
        </div>

        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-muted/30 px-4 py-4 text-sm leading-relaxed text-muted-foreground space-y-2">
            <p className="font-medium text-foreground">What happens next?</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>A manager in your organization reviews and approves your account.</li>
              <li>Once approved, you&apos;ll complete your auditor profile.</li>
              <li>Your manager will assign you to specific audit locations.</li>
            </ol>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={handleRefresh} isLoading={refreshing}>
            {refreshing ? "Checking\u2026" : "Check approval status"}
          </Button>
          <Button variant="outline" onClick={logout}>
            Sign out
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Wrong account?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:text-primary/80 transition-colors">
            Back to sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
