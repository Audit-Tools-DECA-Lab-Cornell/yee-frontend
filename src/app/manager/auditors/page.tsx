import type { Metadata } from "next";

import { LiveAuditorsTable } from "@/features/manager/components/live-dashboard";
import { AssignmentPanel } from "@/features/manager/components/assignment-panel";

export const metadata: Metadata = { title: "Auditors" };

export default function AuditorsPage() {
	return (
		<div className="space-y-6">
			<LiveAuditorsTable />
			<AssignmentPanel />
		</div>
	);
}
