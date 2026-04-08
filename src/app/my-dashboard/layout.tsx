import type { ReactNode } from "react";

import { AuthGuard } from "@/components/auth/auth-guard";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default function AuditorLayout({ children }: { children: ReactNode }) {
	return (
		<AuthGuard allowedRoles={["AUDITOR"]}>
			<DashboardShell variant="auditor">{children}</DashboardShell>
		</AuthGuard>
	);
}
