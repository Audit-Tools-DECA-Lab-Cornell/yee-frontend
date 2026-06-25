import type { NextRequest } from "next/server";

import { proxyRequest } from "@/app/api/_lib/backend-proxy";

export async function GET(request: NextRequest) {
	return proxyRequest({ request, path: "/yee/admin/site-copy" });
}

export async function POST(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const activate = searchParams.get("activate") ?? "true";
	return proxyRequest({
		request,
		path: `/yee/admin/site-copy?activate=${encodeURIComponent(activate)}`,
		method: "POST",
		body: await request.json()
	});
}
