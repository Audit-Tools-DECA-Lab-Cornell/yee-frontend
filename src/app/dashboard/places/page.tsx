import type { Metadata } from "next";

import { LivePlacesTable } from "@/components/dashboard/live-dashboard";

export const metadata: Metadata = { title: "Places" };

export default function PlacesPage() {
  return <LivePlacesTable />;
}
