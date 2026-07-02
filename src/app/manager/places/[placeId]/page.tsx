import { LivePlaceDetail } from "@/features/manager/components/live-detail-pages";

export default async function PlaceDetailPage({ params }: { params: Promise<{ placeId: string }> }) {
	const { placeId } = await params;

	return <LivePlaceDetail placeId={placeId} />;
}
