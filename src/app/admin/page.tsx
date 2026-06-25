import type { Metadata } from "next";

import { LiveAdminOverview } from "@/components/dashboard/live-dashboard";

export const metadata: Metadata = { title: "Admin Overview" };

export default function AdminPage() {
  return <LiveAdminOverview />;
}
