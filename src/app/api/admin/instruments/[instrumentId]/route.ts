import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";

import { proxyRequest } from "@/server/proxy";

export async function GET(request: NextRequest, { params }: { params: Promise<{ instrumentId: string }> }) {
	const { instrumentId } = await params;
	return proxyRequest({
		request,
		path: `/yee/admin/instruments/${encodeURIComponent(instrumentId)}`
	});
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ instrumentId: string }> }) {
	const { instrumentId } = await params;
	const body = await request.json();
	const response = await proxyRequest({
		request,
		path: `/yee/admin/instruments/${encodeURIComponent(instrumentId)}`,
		method: "PATCH",
		body
	});
	if (response.ok && body?.is_active === true) {
		revalidateTag("yee-instrument", { expire: 0 });
	}
	return response;
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ instrumentId: string }> }) {
	const { instrumentId } = await params;
	return proxyRequest({
		request,
		path: `/yee/admin/instruments/${encodeURIComponent(instrumentId)}`,
		method: "DELETE"
	});
}
