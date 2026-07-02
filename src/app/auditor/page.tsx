import type { Metadata } from "next";

import { AuditorOverview } from "@/features/auditor/components/auditor-overview";

export const metadata: Metadata = { title: "My Dashboard" };

export default function AuditorDashboardPage() {
	return <AuditorOverview />;
}
