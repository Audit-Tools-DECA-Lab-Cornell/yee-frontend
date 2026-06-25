import { InviteAcceptScreen } from "@/components/auth/invite-accept-screen";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
	const { token } = await params;
	return <InviteAcceptScreen token={token} />;
}
