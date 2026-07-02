import type { Metadata } from "next";

import { LiveAdminOverview } from "@/features/admin/components/live-dashboard";

export const metadata: Metadata = { title: "Admin Overview" };

export default function AdminPage() {
	return <LiveAdminOverview />;
}
