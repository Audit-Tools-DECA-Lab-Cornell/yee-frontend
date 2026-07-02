import type { NextRequest } from "next/server";

import { proxyRequest } from "@/server/backend/proxy";

export async function POST(request: NextRequest) {
	return proxyRequest({
		request,
		path: "/yee/dashboard/assignments",
		method: "POST",
		body: await request.json()
	});
}

export async function DELETE(request: NextRequest) {
	return proxyRequest({
		request,
		path: "/yee/dashboard/assignments",
		method: "DELETE",
		body: await request.json()
	});
}
