import type { ReactNode } from "react";

import { AuthGuard } from "@/features/auth/components/auth-guard";
import { DashboardShell } from "@/components/layouts/dashboard/dashboard-shell";

export default function AdminLayout({ children }: { children: ReactNode }) {
	return (
		<AuthGuard allowedRoles={["ADMIN"]}>
			<DashboardShell variant="admin">{children}</DashboardShell>
		</AuthGuard>
	);
}
