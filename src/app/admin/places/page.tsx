import type { Metadata } from "next";

import { AdminPlacesTable } from "@/features/admin/components/live-dashboard";

export const metadata: Metadata = { title: "Places" };

export default function AdminPlacesPage() {
	return <AdminPlacesTable />;
}
