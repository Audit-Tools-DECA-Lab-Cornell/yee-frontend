import type { NextRequest } from "next/server";

import { proxyRequest } from "@/server/proxy";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ inviteId: string }> }) {
	const { inviteId } = await params;
	return proxyRequest({
		request,
		path: `/yee/dashboard/manager-invites/${encodeURIComponent(inviteId)}`,
		method: "DELETE"
	});
}
