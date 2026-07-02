import type { NextRequest } from "next/server";

import { proxyRequest } from "@/server/backend/proxy";

export async function GET(request: NextRequest, { params }: { params: Promise<{ placeId: string }> }) {
	const { placeId } = await params;
	return proxyRequest({
		request,
		path: `/yee/places/${encodeURIComponent(placeId)}/audit-state`
	});
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ placeId: string }> }) {
	const { placeId } = await params;
	return proxyRequest({
		request,
		path: `/yee/places/${encodeURIComponent(placeId)}/draft`,
		method: "PUT",
		body: await request.json()
	});
}
