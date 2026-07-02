import type { Metadata } from "next";

import { LiveManagerOverview } from "@/features/manager/components/live-dashboard";

export const metadata: Metadata = { title: "Overview" };

export default function DashboardPage() {
	return <LiveManagerOverview />;
}
