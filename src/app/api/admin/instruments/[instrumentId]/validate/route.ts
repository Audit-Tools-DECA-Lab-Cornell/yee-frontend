import type { NextRequest } from "next/server";

import { proxyRequest } from "@/server/proxy";

export async function POST(request: NextRequest, { params }: { params: Promise<{ instrumentId: string }> }) {
	const { instrumentId } = await params;
	return proxyRequest({
		request,
		path: `/yee/admin/instruments/${encodeURIComponent(instrumentId)}/validate`,
		method: "POST"
	});
}
