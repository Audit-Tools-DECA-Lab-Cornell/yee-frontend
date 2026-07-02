import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";

import { proxyRequest } from "@/server/backend/proxy";

export async function GET(request: NextRequest) {
	return proxyRequest({ request, path: "/yee/admin/site-copy" });
}

export async function POST(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const activate = searchParams.get("activate") ?? "true";
	const response = await proxyRequest({
		request,
		path: `/yee/admin/site-copy?activate=${encodeURIComponent(activate)}`,
		method: "POST",
		body: await request.json()
	});
	if (response.ok) {
		// Expire the cached public site copy so edits show up immediately.
		revalidateTag("site-copy", { expire: 0 });
	}
	return response;
}
