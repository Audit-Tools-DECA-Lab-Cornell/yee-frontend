import type { ReactNode } from "react";

import { AuthGuard } from "@/features/auth/components/auth-guard";
import { DashboardShell } from "@/components/layouts/dashboard/dashboard-shell";

export default function AuditorLayout({ children }: { children: ReactNode }) {
	return (
		<AuthGuard allowedRoles={["AUDITOR"]} allowManagerAuditorAccess>
			<DashboardShell variant="auditor">{children}</DashboardShell>
		</AuthGuard>
	);
}
