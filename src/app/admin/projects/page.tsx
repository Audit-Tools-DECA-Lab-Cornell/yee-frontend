import type { Metadata } from "next";

import { AdminProjectsTable } from "@/features/admin/components/live-dashboard";

export const metadata: Metadata = { title: "Projects" };

export default function AdminProjectsPage() {
	return <AdminProjectsTable />;
}
