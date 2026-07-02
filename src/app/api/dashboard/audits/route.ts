import { NextResponse, type NextRequest } from "next/server";

import { proxyRequest } from "@/server/backend/proxy";
import { normalizeAuditListPayload } from "@/server/backend/yee-reporting-normalization";

export async function GET(request: NextRequest) {
	const response = await proxyRequest({ request, path: "/yee/dashboard/audits" });
	if (!response.ok) {
		return response;
	}

	return NextResponse.json(normalizeAuditListPayload(await response.json()));
}
