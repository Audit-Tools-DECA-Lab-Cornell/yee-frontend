import { YeeAuditWizard } from "@/features/yee-audit/components/yee-audit-wizard";

export default async function ManagerAuditEditReviewPage({ params }: { params: Promise<{ auditId: string }> }) {
	const { auditId } = await params;

	return (
		<YeeAuditWizard
			auditId={auditId}
			placeId="manager-edit"
			mode="review"
			variant="manager-edit"
			basePath={`/manager/audits/${auditId}/edit`}
			exitHref="/manager/audits"
		/>
	);
}
