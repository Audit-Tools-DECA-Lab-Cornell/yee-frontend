import type { ReactNode } from "react";

import { ReportsShell } from "@/components/layouts/dashboard/reports-shell";

/**
 * Route group that renders standalone reports inside the dashboard app-shell
 * (sidebar + header) at full width, for whichever role is viewing.
 */
export default function ReportsLayout({ children }: { children: ReactNode }) {
	return <ReportsShell>{children}</ReportsShell>;
}
