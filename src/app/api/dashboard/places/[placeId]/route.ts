import { NextResponse, type NextRequest } from "next/server";

import { proxyRequest } from "@/server/backend/proxy";
import { normalizePlaceDetailPayload } from "@/server/backend/yee-reporting-normalization";

export async function GET(request: NextRequest, { params }: { params: Promise<{ placeId: string }> }) {
	const { placeId } = await params;
	const response = await proxyRequest({
		request,
		path: `/yee/dashboard/places/${encodeURIComponent(placeId)}`
	});
	if (!response.ok) {
		return response;
	}

	return NextResponse.json(normalizePlaceDetailPayload(await response.json()));
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ placeId: string }> }) {
	const { placeId } = await params;
	return proxyRequest({
		request,
		path: `/yee/dashboard/places/${encodeURIComponent(placeId)}`,
		method: "PATCH",
		body: await request.json()
	});
}
