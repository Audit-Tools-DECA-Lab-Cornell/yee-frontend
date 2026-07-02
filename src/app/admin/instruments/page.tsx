import type { Metadata } from "next";

import { InstrumentsAdminClient } from "@/features/admin/instruments/instruments-admin-client";

export const metadata: Metadata = { title: "Instruments" };

export default function AdminInstrumentsPage() {
	return <InstrumentsAdminClient />;
}
