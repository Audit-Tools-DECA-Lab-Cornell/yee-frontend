import { LiveProjectDetail } from "@/components/dashboard/live-detail-pages";

export default async function ProjectDetailPage({ params }: { params: Promise<{ projectId: string }> }) {
	const { projectId } = await params;

	return <LiveProjectDetail projectId={projectId} />;
}
