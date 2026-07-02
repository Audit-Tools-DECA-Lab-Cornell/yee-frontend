import type { Metadata } from "next";

import { AuditorPlaceList } from "@/features/auditor/components/auditor-place-list";

export const metadata: Metadata = { title: "My Audits" };

export default function MyPlacesPage() {
	return <AuditorPlaceList />;
}
