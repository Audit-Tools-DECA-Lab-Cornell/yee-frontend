import type { Metadata } from "next";

import { LiveRawDataTable } from "@/features/reporting/components/live-raw-data-table";

export const metadata: Metadata = { title: "Raw Data" };

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
