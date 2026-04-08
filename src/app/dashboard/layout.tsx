import type { ReactNode } from "react";

import { AuthGuard } from "@/components/auth/auth-guard";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default function DashboardLayout({ children }: { children: ReactNode }) {
	return (
		<AuthGuard allowedRoles={["MANAGER"]}>
			<DashboardShell variant="manager">{children}</DashboardShell>
		</AuthGuard>
	);
}
