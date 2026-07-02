import type { ReactNode } from "react";

import { AuthGuard } from "@/features/auth/components/auth-guard";
import { DashboardShell } from "@/components/layouts/dashboard/dashboard-shell";

export default function DashboardLayout({ children }: { children: ReactNode }) {
	return (
		<AuthGuard allowedRoles={["MANAGER"]}>
			<DashboardShell variant="manager">{children}</DashboardShell>
		</AuthGuard>
	);
}
