import type { NextRequest } from "next/server";

import { proxyRequest } from "@/server/backend/proxy";

export async function POST(request: NextRequest) {
	return proxyRequest({
		request,
		path: "/yee/dashboard/my-auditor-profile",
		method: "POST"
	});
}
