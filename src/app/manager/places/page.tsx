import type { Metadata } from "next";

import { LivePlacesTable } from "@/features/manager/components/live-dashboard";

export const metadata: Metadata = { title: "Places" };

export default function PlacesPage() {
	return <LivePlacesTable />;
}
