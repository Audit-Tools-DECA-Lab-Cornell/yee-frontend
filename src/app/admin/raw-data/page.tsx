import { LiveRawDataTable } from "@/components/reporting/live-raw-data-table";

export default function AdminRawDataPage() {
	return (
		<LiveRawDataTable
			scope="admin"
			filename="admin-raw-data.csv"
			title="Admin Raw Data"
			description="Admins can export the full raw audit dataset across projects, places, and generated auditor IDs."
		/>
	);
}
