import { YeeAuditWizard } from "@/components/yee/yee-audit-wizard";

export default async function YeeAuditReviewPage({ params }: { params: Promise<{ placeId: string }> }) {
	const { placeId } = await params;
	return <YeeAuditWizard placeId={placeId} mode="review" />;
}
