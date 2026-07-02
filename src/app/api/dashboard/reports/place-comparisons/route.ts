import { NextResponse, type NextRequest } from "next/server";

import { proxyRequest } from "@/server/backend/proxy";
import { normalizePlaceComparisonGroupsPayload } from "@/server/backend/yee-reporting-normalization";

export async function GET(request: NextRequest) {
	const response = await proxyRequest({ request, path: "/yee/dashboard/reports/place-comparisons" });
	if (!response.ok) {
		return response;
	}

	return NextResponse.json(normalizePlaceComparisonGroupsPayload(await response.json()));
}
