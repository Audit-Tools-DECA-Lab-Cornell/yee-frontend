import type { NextRequest } from "next/server";

import { proxyRequest } from "@/server/backend/proxy";

export async function GET(request: NextRequest, { params }: { params: Promise<{ auditId: string }> }) {
	const { auditId } = await params;
	return proxyRequest({
		request,
		path: `/yee/dashboard/audits/${encodeURIComponent(auditId)}/edit`
	});
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ auditId: string }> }) {
	const { auditId } = await params;
	return proxyRequest({
		request,
		path: `/yee/dashboard/audits/${encodeURIComponent(auditId)}/edit`,
		method: "PATCH",
		body: await request.json()
	});
}
