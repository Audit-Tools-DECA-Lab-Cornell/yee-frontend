import { YeeAuditWizard } from "@/components/yee/yee-audit-wizard";
import type { YeeStepNumber } from "@/lib/yee-audit-config";

export default async function ManagerAuditEditStepPage({
	params
}: {
	params: Promise<{ auditId: string; step: string }>;
}) {
	const { auditId, step } = await params;
	const numericStep = Number(step);

	if (!Number.isInteger(numericStep) || numericStep < 1 || numericStep > 9) {
		return <main className="mx-auto max-w-4xl p-6 text-red-700">Invalid audit step.</main>;
	}

	return (
		<YeeAuditWizard
			auditId={auditId}
			placeId="manager-edit"
			mode="step"
			step={numericStep as YeeStepNumber}
			variant="manager-edit"
			basePath={`/dashboard/audits/${auditId}/edit`}
			exitHref="/dashboard/audits"
		/>
	);
}
