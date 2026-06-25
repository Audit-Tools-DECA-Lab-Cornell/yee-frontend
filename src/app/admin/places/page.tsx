import type { Metadata } from "next";

import { AdminPlacesTable } from "@/components/dashboard/live-dashboard";

export const metadata: Metadata = { title: "Places" };

export default function AdminPlacesPage() {
	return <AdminPlacesTable />;
}
