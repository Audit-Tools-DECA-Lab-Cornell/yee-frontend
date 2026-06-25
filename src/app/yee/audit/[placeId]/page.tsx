import { redirect } from "next/navigation";

export default async function YeeAuditPage({ params }: { params: Promise<{ placeId: string }> }) {
	const { placeId } = await params;

	redirect(`/yee/audit/${placeId}/page/1`);
}
