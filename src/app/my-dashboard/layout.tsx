import type { ReactNode } from "react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default function AuditorLayout({ children }: { children: ReactNode }) {
	return <DashboardShell variant="auditor">{children}</DashboardShell>;
}
