import type { NextRequest } from "next/server";

import { proxyRequest } from "@/app/api/_lib/backend-proxy";

export async function GET(request: NextRequest) {
	return proxyRequest({ request, path: "/yee/dashboard/projects" });
}

export async function POST(request: NextRequest) {
	return proxyRequest({
		request,
		path: "/yee/dashboard/projects",
		method: "POST",
		body: await request.json()
	});
}
