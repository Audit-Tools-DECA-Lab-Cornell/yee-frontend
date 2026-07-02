import { YeeSubmissionReport } from "@/features/yee-audit/components/yee-submission-report";

export default async function YeeSubmissionReportPage({ params }: { params: Promise<{ submissionId: string }> }) {
	const { submissionId } = await params;
	return <YeeSubmissionReport submissionId={submissionId} />;
}
