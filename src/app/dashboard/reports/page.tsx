import type { Metadata } from "next";

import { LiveReports } from "@/components/reporting/live-reports";

export const metadata: Metadata = { title: "Reports" };

export default function ReportsPage() {
  return <LiveReports />;
}
