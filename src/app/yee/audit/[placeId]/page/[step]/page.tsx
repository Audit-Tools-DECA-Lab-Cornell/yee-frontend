import { notFound } from "next/navigation";

import { YeeAuditWizard } from "@/components/yee/yee-audit-wizard";
import type { YeeStepNumber } from "@/lib/yee-audit-config";

export default async function YeeAuditStepPage({
	params
}: {
	params: Promise<{ placeId: string; step: string }>;
}) {
	const { placeId, step } = await params;
	const numericStep = Number(step);
	if (!Number.isInteger(numericStep) || numericStep < 1 || numericStep > 9) {
		notFound();
	}

	return <YeeAuditWizard placeId={placeId} step={numericStep as YeeStepNumber} mode="step" />;
}
