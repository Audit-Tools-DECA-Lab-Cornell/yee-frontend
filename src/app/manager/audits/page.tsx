import type { Metadata } from "next";

import { LiveAuditsTable } from "@/features/manager/components/live-dashboard";

export const metadata: Metadata = { title: "Audits" };

export default function AuditsPage() {
	return <LiveAuditsTable />;
}
