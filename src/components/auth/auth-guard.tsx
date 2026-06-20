"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { getRouteForUser, type UserRole } from "@/lib/auth/session";

export function AuthGuard({
	children,
	allowedRoles,
	allowManagerAuditorAccess = false
}: {
	children: React.ReactNode;
	allowedRoles: UserRole[];
	allowManagerAuditorAccess?: boolean;
}) {
	const router = useRouter();
	const { session, loading } = useAuth();
	const hasRoleAccess = React.useMemo(() => {
		if (!session) return false;
		if (allowedRoles.includes(session.user.account_type)) return true;
		if (allowManagerAuditorAccess && allowedRoles.includes("AUDITOR")) {
			return session.user.account_type === "MANAGER" && session.user.has_auditor_profile;
		}
		return false;
	}, [allowManagerAuditorAccess, allowedRoles, session]);

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
		if (!hasRoleAccess) {
			const fallback = session.user.dashboard_path;
			router.replace(fallback);
		}
	}, [hasRoleAccess, loading, router, session]);

	if (loading || !session || session.user.next_step !== "DASHBOARD" || !hasRoleAccess) {
		return <main className="mx-auto max-w-4xl p-6 text-sm text-slate-600">Checking access...</main>;
	}

	return <>{children}</>;
}
