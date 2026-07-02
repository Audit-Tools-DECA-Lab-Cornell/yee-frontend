import type { Metadata } from "next";

import { LiveReports } from "@/features/reporting/components/live-reports";

export const metadata: Metadata = { title: "Reports" };

export default function ReportsPage() {
	return <LiveReports />;
}
