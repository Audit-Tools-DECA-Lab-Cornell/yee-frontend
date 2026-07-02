import type { NextRequest } from "next/server";

import { proxyRequest } from "@/server/backend/proxy";

export async function GET(request: NextRequest) {
	return proxyRequest({ request, path: "/yee/dashboard/manager-profile" });
}

export async function PUT(request: NextRequest) {
	return proxyRequest({
		request,
		path: "/yee/dashboard/manager-profile",
		method: "PUT",
		body: await request.json()
	});
}
