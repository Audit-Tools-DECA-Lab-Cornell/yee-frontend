import type { NextRequest } from "next/server";

import { proxyRequest } from "@/server/proxy";

export async function GET(request: NextRequest) {
	return proxyRequest({ request, path: "/yee/dashboard/auditors" });
}
