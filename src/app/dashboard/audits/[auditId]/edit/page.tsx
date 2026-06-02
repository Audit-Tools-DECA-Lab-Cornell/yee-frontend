import { redirect } from "next/navigation";

export default async function ManagerAuditEditIndexPage({
	params
}: {
	params: Promise<{ auditId: string }>;
}) {
	const { auditId } = await params;
	redirect(`/dashboard/audits/${auditId}/edit/page/1`);
}
