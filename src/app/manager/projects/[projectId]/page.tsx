import { LiveProjectDetail } from "@/features/manager/components/live-detail-pages";

export default async function ProjectDetailPage({ params }: { params: Promise<{ projectId: string }> }) {
	const { projectId } = await params;

	return <LiveProjectDetail projectId={projectId} />;
}
