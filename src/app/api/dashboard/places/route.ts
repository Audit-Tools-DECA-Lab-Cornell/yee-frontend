import type { NextRequest } from "next/server";

import { proxyRequest } from "@/server/backend/proxy";

export async function GET(request: NextRequest) {
	return proxyRequest({ request, path: "/yee/dashboard/places" });
}

export async function POST(request: NextRequest) {
	return proxyRequest({
		request,
		path: "/yee/dashboard/places",
		method: "POST",
		body: await request.json()
	});
}
