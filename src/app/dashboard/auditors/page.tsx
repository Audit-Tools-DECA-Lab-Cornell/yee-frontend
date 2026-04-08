import { LiveAuditorsTable } from "@/components/dashboard/live-dashboard";
import { AssignmentPanel } from "@/components/dashboard/assignment-panel";

export default function AuditorsPage() {
	return (
		<div className="space-y-6">
			<LiveAuditorsTable />
			<AssignmentPanel />
		</div>
	);
}
