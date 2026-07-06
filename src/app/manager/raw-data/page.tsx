import type { Metadata } from "next";

import { LiveRawDataTable } from "@/features/reporting/components/live-raw-data-table";

export const metadata: Metadata = { title: "Raw Data" };

export default function DashboardRawDataPage() {
	return (
		<LiveRawDataTable
			scope="manager"
			filename="manager-raw-data.csv"
			title="Manager Raw Data"
			description="Export raw data for the audits in your scope. Auditor names are replaced with generated IDs to protect privacy."
		/>
	);
}
