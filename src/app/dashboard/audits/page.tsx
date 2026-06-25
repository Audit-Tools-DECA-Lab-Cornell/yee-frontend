import type { Metadata } from "next";

import { LiveAuditsTable } from "@/components/dashboard/live-dashboard";

export const metadata: Metadata = { title: "Audits" };

export default function AuditsPage() {
	return <LiveAuditsTable />;
}
