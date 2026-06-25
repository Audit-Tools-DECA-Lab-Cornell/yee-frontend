import { YeeAuditWizard } from "@/components/yee/yee-audit-wizard";

export default async function ManagerAuditEditReviewPage({ params }: { params: Promise<{ auditId: string }> }) {
	const { auditId } = await params;

	return (
		<YeeAuditWizard
			auditId={auditId}
			placeId="manager-edit"
			mode="review"
			variant="manager-edit"
			basePath={`/dashboard/audits/${auditId}/edit`}
			exitHref="/dashboard/audits"
		/>
	);
}
