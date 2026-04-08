"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { getRouteForUser, type UserRole } from "@/lib/auth/session";

export function AuthGuard({
	children,
	allowedRoles
}: {
	children: React.ReactNode;
	allowedRoles: UserRole[];
}) {
	const router = useRouter();
	const { session, loading } = useAuth();

	React.useEffect(() => {
		if (loading) return;
		if (!session) {
			router.replace("/login");
			return;
		}
		if (session.user.next_step !== "DASHBOARD") {
			router.replace(getRouteForUser(session.user));
			return;
		}
		if (!allowedRoles.includes(session.user.account_type)) {
			const fallback = session.user.dashboard_path;
			router.replace(fallback);
		}
	}, [allowedRoles, loading, router, session]);

	if (loading || !session || session.user.next_step !== "DASHBOARD" || !allowedRoles.includes(session.user.account_type)) {
		return <main className="mx-auto max-w-4xl p-6 text-sm text-slate-600">Checking access...</main>;
	}

	return <>{children}</>;
}
