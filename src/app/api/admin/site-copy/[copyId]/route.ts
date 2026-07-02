import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";

import { proxyRequest } from "@/server/backend/proxy";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ copyId: string }> }) {
	const { copyId } = await params;
	const response = await proxyRequest({
		request,
		path: `/yee/admin/site-copy/${encodeURIComponent(copyId)}`,
		method: "PATCH",
		body: await request.json()
	});
	if (response.ok) {
		// Expire the cached public site copy so edits show up immediately.
		revalidateTag("site-copy", { expire: 0 });
	}
	return response;
}
