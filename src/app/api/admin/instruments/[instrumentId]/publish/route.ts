import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";

import { proxyRequest } from "@/server/proxy";

export async function POST(request: NextRequest, { params }: { params: Promise<{ instrumentId: string }> }) {
	const { instrumentId } = await params;
	const response = await proxyRequest({
		request,
		path: `/yee/admin/instruments/${encodeURIComponent(instrumentId)}/publish`,
		method: "POST",
		body: await request.json()
	});
	if (response.ok) {
		revalidateTag("yee-instrument", { expire: 0 });
	}
	return response;
}
