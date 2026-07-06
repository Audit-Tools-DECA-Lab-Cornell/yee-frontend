"use client";

import type { ReactNode } from "react";

import { AuthGuard } from "@/features/auth/components/auth-guard";
import { DashboardShell } from "@/components/layouts/dashboard/dashboard-shell";
import { useAuth } from "@/features/auth/components/auth-provider";
import type { WorkspaceVariant } from "@/components/layouts/dashboard/workspace-config";

const ROLE_VARIANT: Record<string, WorkspaceVariant> = {
	ADMIN: "admin",
	MANAGER: "manager",
	AUDITOR: "auditor"
};

/**
 * Shell for the standalone report route. Serves all three roles from one place:
 * the sidebar variant is derived from the signed-in user's role, and the report
 * renders full-bleed (no max-width) so charts get the whole screen.
 */
export function ReportsShell({ children }: { children: ReactNode }) {
	const { session } = useAuth();
	const variant = (session && ROLE_VARIANT[session.user.account_type]) || "manager";

	return (
		<AuthGuard allowedRoles={["ADMIN", "MANAGER", "AUDITOR"]} allowManagerAuditorAccess>
			<DashboardShell variant={variant} contentWidth="full">
				{children}
			</DashboardShell>
		</AuthGuard>
	);
}
