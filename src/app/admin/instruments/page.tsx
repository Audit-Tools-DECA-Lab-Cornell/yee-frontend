import type { Metadata } from "next";

import { InstrumentsAdminClient } from "@/components/dashboard/instruments/instruments-admin-client";

export const metadata: Metadata = { title: "Instruments" };

export default function AdminInstrumentsPage() {
	return <InstrumentsAdminClient />;
}
