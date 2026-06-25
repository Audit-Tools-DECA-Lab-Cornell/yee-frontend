import type { Metadata } from "next";

import { LiveManagerOverview } from "@/components/dashboard/live-dashboard";

export const metadata: Metadata = { title: "Overview" };

export default function DashboardPage() {
  return <LiveManagerOverview />;
}
