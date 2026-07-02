import type { NextRequest } from "next/server";

import { proxyRequest } from "@/server/backend/proxy";

export async function GET(request: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
	const { projectId } = await params;
	return proxyRequest({
		request,
		path: `/yee/dashboard/projects/${encodeURIComponent(projectId)}`
	});
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
	const { projectId } = await params;
	return proxyRequest({
		request,
		path: `/yee/dashboard/projects/${encodeURIComponent(projectId)}`,
		method: "PATCH",
		body: await request.json()
	});
}
