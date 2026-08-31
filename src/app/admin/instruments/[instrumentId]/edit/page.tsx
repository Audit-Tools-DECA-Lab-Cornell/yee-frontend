import type { Metadata } from "next";

import { InstrumentAuthoringWorkbench } from "@/features/admin/instruments/authoring/workbench";

export const metadata: Metadata = { title: "Edit instrument" };

export default async function EditInstrumentPage({ params }: { params: Promise<{ instrumentId: string }> }) {
	const { instrumentId } = await params;
	return <InstrumentAuthoringWorkbench instrumentId={instrumentId} />;
}
