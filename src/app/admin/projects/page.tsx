import type { Metadata } from "next";

import { AdminProjectsTable } from "@/components/dashboard/live-dashboard";

export const metadata: Metadata = { title: "Projects" };

export default function AdminProjectsPage() {
	return <AdminProjectsTable />;
}
