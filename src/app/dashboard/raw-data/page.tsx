import type { Metadata } from "next";

import { LiveRawDataTable } from "@/components/reporting/live-raw-data-table";

export const metadata: Metadata = { title: "Raw Data" };

export default function DashboardRawDataPage() {
	return (
		<LiveRawDataTable
			scope="manager"
			filename="manager-raw-data.csv"
			title="Manager Raw Data"
			description="Managers can export raw data only for audits within their accessible scope. Auditor names are replaced with generated IDs."
		/>
	);
}
