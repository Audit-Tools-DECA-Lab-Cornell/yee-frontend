import { YeeAuditWizard } from "@/features/yee-audit/components/yee-audit-wizard";

export default async function YeeAuditReviewPage({ params }: { params: Promise<{ placeId: string }> }) {
	const { placeId } = await params;
	return <YeeAuditWizard placeId={placeId} mode="review" />;
}
