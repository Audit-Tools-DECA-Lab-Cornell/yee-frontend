"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Clock3 } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { AuthShell } from "@/components/auth/auth-shell";
import { Badge } from "@/components/ui/badge";
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
		<AuthShell
			eyebrow="Auditor Onboarding"
			title="Your account is waiting for manager approval."
			description="This page is now driven by backend auth state, so auditors stay here until their approval status changes.">
			<div className="space-y-6">
				<div className="flex size-14 items-center justify-center rounded-3xl bg-amber-50 text-amber-700">
					<Clock3 className="size-7" />
				</div>
				<div>
					<Badge className="rounded-full bg-amber-50 px-3 py-1 text-amber-700 hover:bg-amber-50">Pending approval</Badge>
					<h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">Waiting for access</h2>
					<p className="mt-2 text-sm leading-6 text-slate-600">
						Once a manager approves the account, the next step will become profile completion or dashboard access.
					</p>
				</div>

				<div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-600">
					Current account: <span className="font-medium text-slate-900">{session?.user.email ?? "Not signed in"}</span>
				</div>

				<div className="grid gap-3 sm:grid-cols-2">
					<Button className="rounded-2xl bg-[#10231f] text-white hover:bg-[#17302c]" onClick={handleRefresh} disabled={refreshing}>
						{refreshing ? "Checking..." : "Check approval again"}
					</Button>
					<Button variant="outline" className="rounded-2xl" onClick={logout}>
						Log out
					</Button>
				</div>
				<p className="text-sm text-slate-600">
					Need to use a different account?{" "}
					<Link href="/login" className="font-medium text-emerald-700 hover:text-emerald-800">
						Back to login
					</Link>
				</p>
			</div>
		</AuthShell>
	);
}
