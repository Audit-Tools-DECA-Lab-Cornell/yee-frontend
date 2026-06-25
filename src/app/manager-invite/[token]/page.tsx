import { ManagerInviteAcceptScreen } from "@/components/auth/manager-invite-accept-screen";

export default async function ManagerInvitePage({ params }: { params: Promise<{ token: string }> }) {
	const { token } = await params;
	return <ManagerInviteAcceptScreen token={token} />;
}
