import { proxyDashboardRequest } from "@/app/api/dashboard/_utils";

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ inviteId: string }> }
) {
	const { inviteId } = await params;
	return proxyDashboardRequest({
		targetPath: `/yee/dashboard/manager-invites/${encodeURIComponent(inviteId)}/resend`,
		method: "POST",
		authorization: request.headers.get("authorization")
	});
}
