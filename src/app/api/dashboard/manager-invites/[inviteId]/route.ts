import { proxyDashboardRequest } from "@/app/api/dashboard/_utils";

export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ inviteId: string }> }
) {
	const { inviteId } = await params;
	return proxyDashboardRequest({
		targetPath: `/yee/dashboard/manager-invites/${encodeURIComponent(inviteId)}`,
		method: "DELETE",
		authorization: request.headers.get("authorization")
	});
}
