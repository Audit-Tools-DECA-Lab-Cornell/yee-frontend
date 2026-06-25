import type { NextRequest } from "next/server";

import { proxyRequest } from "@/app/api/_lib/backend-proxy";

export async function POST(request: NextRequest, { params }: { params: Promise<{ inviteId: string }> }) {
	const { inviteId } = await params;
	const frontendOrigin = new URL(request.url).origin;
	return proxyRequest({
		request,
		path: `/yee/dashboard/manager-invites/${encodeURIComponent(inviteId)}/resend`,
		method: "POST",
		additionalHeaders: { "X-Frontend-Origin": frontendOrigin }
	});
}
