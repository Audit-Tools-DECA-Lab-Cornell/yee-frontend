import type { NextRequest } from "next/server";

import { proxyRequest } from "@/app/api/_lib/backend-proxy";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ inviteId: string }> }) {
	const { inviteId } = await params;
	return proxyRequest({
		request,
		path: `/yee/dashboard/manager-invites/${encodeURIComponent(inviteId)}`,
		method: "DELETE"
	});
}
