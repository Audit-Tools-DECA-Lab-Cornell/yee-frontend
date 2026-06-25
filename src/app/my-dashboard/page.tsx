import type { Metadata } from "next";

import { AuditorOverview } from "@/components/dashboard/auditor-overview";

export const metadata: Metadata = { title: "My Dashboard" };

export default function AuditorDashboardPage() {
	return <AuditorOverview />;
}
