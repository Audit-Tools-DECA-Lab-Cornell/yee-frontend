import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";

import { proxyRequest } from "@/server/backend/proxy";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ instrumentId: string }> }) {
	const { instrumentId } = await params;
	const response = await proxyRequest({
		request,
		path: `/yee/admin/instruments/${encodeURIComponent(instrumentId)}`,
		method: "PATCH",
		body: await request.json()
	});
	if (response.ok) {
		// Expire the cached public instrument so activation/edits ship immediately.
		revalidateTag("yee-instrument", { expire: 0 });
	}
	return response;
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ instrumentId: string }> }) {
	const { instrumentId } = await params;
	const response = await proxyRequest({
		request,
		path: `/yee/admin/instruments/${encodeURIComponent(instrumentId)}`,
		method: "DELETE"
	});
	if (response.ok) {
		// Expire the cached public instrument in case the active version changed.
		revalidateTag("yee-instrument", { expire: 0 });
	}
	return response;
}
